import type { SearchSuggestion, SearchSuggestionType } from "@/lib/search-suggestion-types";
import { suggestionTypeLabel } from "@/lib/search-suggestion-types";

const DEBOUNCE_MS = 260;
const MIN_QUERY_LENGTH = 2;

function getSuggestionTypeIcon(type: SearchSuggestionType): string {
  switch (type) {
    case "city":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="reovana-suggest-icon"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
    case "zip":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="reovana-suggest-icon"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9M15 21V9"/></svg>`;
    case "county":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="reovana-suggest-icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>`;
    case "state":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="reovana-suggest-icon"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/></svg>`;
    case "address":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="reovana-suggest-icon"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
    default:
      return "";
  }
}

type AttachOptions = {
  onSelect?: (suggestion: SearchSuggestion) => void;
};

type SuggestResponse = {
  suggestions: SearchSuggestion[];
};

function groupSuggestions(items: SearchSuggestion[]): Array<{ type: SearchSuggestionType; items: SearchSuggestion[] }> {
  const groups = new Map<SearchSuggestionType, SearchSuggestion[]>();
  const firstIndex = new Map<SearchSuggestionType, number>();

  items.forEach((item, index) => {
    const bucket = groups.get(item.type) ?? [];
    bucket.push(item);
    groups.set(item.type, bucket);
    if (!firstIndex.has(item.type)) firstIndex.set(item.type, index);
  });

  return Array.from(groups.entries())
    .sort((a, b) => (firstIndex.get(a[0]) ?? 0) - (firstIndex.get(b[0]) ?? 0))
    .map(([type, groupItems]) => ({ type, items: groupItems }));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightMatch(text: string, query: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const trimmed = query.trim();
  if (!trimmed) {
    fragment.appendChild(document.createTextNode(text));
    return fragment;
  }

  const pattern = new RegExp(`(${escapeRegExp(trimmed)})`, "ig");
  const parts = text.split(pattern);
  for (const part of parts) {
    if (!part) continue;
    if (part.toLowerCase() === trimmed.toLowerCase()) {
      const mark = document.createElement("mark");
      mark.className = "reovana-search-suggest__mark";
      mark.textContent = part;
      fragment.appendChild(mark);
    } else {
      fragment.appendChild(document.createTextNode(part));
    }
  }
  return fragment;
}

function ensureHost(input: HTMLInputElement): HTMLElement {
  const formTitle = input.closest(".form-title");
  if (formTitle instanceof HTMLElement) {
    formTitle.classList.add("reovana-search-suggest-host");
    return formTitle;
  }

  const parent = input.parentElement;
  if (parent) {
    parent.classList.add("reovana-search-suggest-host");
    return parent;
  }

  return input;
}

function createDropdown(inputId: string): HTMLDivElement {
  const existing = document.getElementById(`${inputId}-listbox`) as HTMLDivElement | null;
  if (existing) return existing;

  const dropdown = document.createElement("div");
  dropdown.className = "reovana-search-suggest";
  dropdown.id = `${inputId}-listbox`;
  dropdown.setAttribute("role", "listbox");
  dropdown.hidden = true;
  document.body.appendChild(dropdown);
  return dropdown;
}

function ensureInputId(input: HTMLInputElement): string {
  if (input.id) return input.id;
  const id = `reovana-search-input-${Math.random().toString(36).slice(2, 9)}`;
  input.id = id;
  return id;
}

export function attachSearchSuggestions(input: HTMLInputElement, options: AttachOptions = {}): () => void {
  if (input.getAttribute("data-reovana-suggest-wired") === "1") {
    return () => undefined;
  }
  input.setAttribute("data-reovana-suggest-wired", "1");
  input.setAttribute("autocomplete", "off");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-expanded", "false");

  const inputId = ensureInputId(input);
  const host = ensureHost(input);
  const dropdown = createDropdown(inputId);
  input.setAttribute("aria-controls", dropdown.id);

  let debounceTimer = 0;
  let activeIndex = -1;
  let currentSuggestions: SearchSuggestion[] = [];
  let requestId = 0;
  let abortController: AbortController | null = null;

  const updatePosition = () => {
    const rect = input.getBoundingClientRect();
    dropdown.style.position = "absolute";
    dropdown.style.left = `${rect.left + window.scrollX}px`;
    dropdown.style.top = `${rect.bottom + window.scrollY + 8}px`;
    dropdown.style.width = `${rect.width}px`;
  };

  const handleResizeOrScroll = () => {
    if (!dropdown.hidden) {
      updatePosition();
    }
  };

  const flatItems = () =>
    Array.from(dropdown.querySelectorAll<HTMLButtonElement>(".reovana-search-suggest__item"));

  const setActiveItem = (index: number) => {
    const items = flatItems();
    activeIndex = index;
    items.forEach((item, itemIndex) => {
      const active = itemIndex === index;
      item.classList.toggle("is-active", active);
      if (active) item.setAttribute("aria-selected", "true");
      else item.removeAttribute("aria-selected");
    });
  };

  const closeDropdown = () => {
    abortController?.abort();
    abortController = null;
    dropdown.hidden = true;
    dropdown.innerHTML = "";
    dropdown.classList.remove("is-loading");
    activeIndex = -1;
    currentSuggestions = [];
    input.setAttribute("aria-expanded", "false");
  };

  const selectSuggestion = (suggestion: SearchSuggestion) => {
    closeDropdown();
    if (options.onSelect) {
      options.onSelect(suggestion);
      return;
    }
    window.location.assign(suggestion.href);
  };

  const renderStatus = (message: string, className: string) => {
    dropdown.innerHTML = "";
    const status = document.createElement("div");
    status.className = className;
    status.textContent = message;
    dropdown.appendChild(status);
    updatePosition();
    dropdown.hidden = false;
    dropdown.classList.remove("is-loading");
    input.setAttribute("aria-expanded", "true");
    activeIndex = -1;
    currentSuggestions = [];
  };

  const renderSuggestions = (suggestions: SearchSuggestion[], query: string) => {
    dropdown.innerHTML = "";
    dropdown.classList.remove("is-loading");

    if (!suggestions.length) {
      renderStatus(`No locations found for “${query}”. Press Search to try anyway.`, "reovana-search-suggest__empty");
      return;
    }

    const grouped = groupSuggestions(suggestions);
    const flat: SearchSuggestion[] = [];

    for (const group of grouped) {
      const section = document.createElement("div");
      section.className = "reovana-search-suggest__group";

      const heading = document.createElement("div");
      heading.className = "reovana-search-suggest__heading";
      heading.textContent = suggestionTypeLabel(group.type);
      section.appendChild(heading);

      for (const suggestion of group.items) {
        flat.push(suggestion);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "reovana-search-suggest__item";
        button.setAttribute("role", "option");
        button.id = `${inputId}-option-${flat.length - 1}`;

        const leftContainer = document.createElement("span");
        leftContainer.className = "reovana-search-suggest__item-left";

        const iconSpan = document.createElement("span");
        iconSpan.className = "reovana-search-suggest__icon-wrapper";
        iconSpan.innerHTML = getSuggestionTypeIcon(suggestion.type);
        leftContainer.appendChild(iconSpan);

        const label = document.createElement("span");
        label.className = "reovana-search-suggest__label";
        label.appendChild(highlightMatch(suggestion.label, query));
        leftContainer.appendChild(label);

        button.appendChild(leftContainer);

        if (suggestion.sublabel) {
          const sublabel = document.createElement("span");
          sublabel.className = "reovana-search-suggest__sublabel";
          sublabel.textContent = suggestion.sublabel;
          button.appendChild(sublabel);
        }

        button.addEventListener("mousedown", (event) => {
          event.preventDefault();
        });
        button.addEventListener("click", () => selectSuggestion(suggestion));
        section.appendChild(button);
      }

      dropdown.appendChild(section);
    }

    currentSuggestions = flat;
    updatePosition();
    dropdown.hidden = false;
    input.setAttribute("aria-expanded", "true");
    setActiveItem(-1);
  };

  const fetchSuggestions = async (query: string) => {
    const id = ++requestId;
    abortController?.abort();
    abortController = new AbortController();

    dropdown.classList.add("is-loading");
    updatePosition();
    dropdown.hidden = false;
    dropdown.innerHTML = "";
    const loading = document.createElement("div");
    loading.className = "reovana-search-suggest__loading";
    loading.textContent = "Searching locations…";
    dropdown.appendChild(loading);
    input.setAttribute("aria-expanded", "true");

    try {
      const response = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`, {
        signal: abortController.signal,
      });
      if (!response.ok) throw new Error("Suggest request failed");
      const payload = (await response.json()) as SuggestResponse;
      if (id !== requestId) return;
      if (input.value.trim() !== query) return;
      renderSuggestions(payload.suggestions ?? [], query);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (id === requestId) closeDropdown();
    }
  };

  const scheduleFetch = () => {
    window.clearTimeout(debounceTimer);
    const query = input.value.trim();
    if (query.length < MIN_QUERY_LENGTH) {
      closeDropdown();
      return;
    }
    debounceTimer = window.setTimeout(() => {
      void fetchSuggestions(query);
    }, DEBOUNCE_MS);
  };

  const handleDocumentClick = (event: MouseEvent) => {
    if (!host.contains(event.target as Node)) closeDropdown();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (dropdown.hidden) return;

    if (event.key === "ArrowDown") {
      if (!currentSuggestions.length) return;
      event.preventDefault();
      const items = flatItems();
      const next = activeIndex < items.length - 1 ? activeIndex + 1 : 0;
      setActiveItem(next);
      items[next]?.scrollIntoView({ block: "nearest" });
      return;
    }

    if (event.key === "ArrowUp") {
      if (!currentSuggestions.length) return;
      event.preventDefault();
      const items = flatItems();
      const next = activeIndex > 0 ? activeIndex - 1 : items.length - 1;
      setActiveItem(next);
      items[next]?.scrollIntoView({ block: "nearest" });
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const suggestion = currentSuggestions[activeIndex];
      if (suggestion) selectSuggestion(suggestion);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeDropdown();
    }
  };

  input.addEventListener("input", scheduleFetch);
  input.addEventListener("focus", scheduleFetch);
  input.addEventListener("keydown", handleKeyDown);
  document.addEventListener("mousedown", handleDocumentClick);
  window.addEventListener("resize", handleResizeOrScroll);
  window.addEventListener("scroll", handleResizeOrScroll, { passive: true });

  return () => {
    window.clearTimeout(debounceTimer);
    abortController?.abort();
    window.removeEventListener("resize", handleResizeOrScroll);
    window.removeEventListener("scroll", handleResizeOrScroll);
    input.removeEventListener("input", scheduleFetch);
    input.removeEventListener("focus", scheduleFetch);
    input.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("mousedown", handleDocumentClick);
    closeDropdown();
    dropdown.remove();
  };
}
