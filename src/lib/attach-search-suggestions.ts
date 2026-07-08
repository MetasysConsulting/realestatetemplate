import type { SearchSuggestion, SearchSuggestionType } from "@/lib/search-suggestions";
import { suggestionTypeLabel } from "@/lib/search-suggestions";

const DEBOUNCE_MS = 280;
const MIN_QUERY_LENGTH = 2;

type AttachOptions = {
  onSelect?: (suggestion: SearchSuggestion) => void;
};

type SuggestResponse = {
  suggestions: SearchSuggestion[];
};

function groupSuggestions(items: SearchSuggestion[]): Array<{ type: SearchSuggestionType; items: SearchSuggestion[] }> {
  const order: SearchSuggestionType[] = ["state", "city", "county", "zip", "address"];
  const groups = new Map<SearchSuggestionType, SearchSuggestion[]>();

  for (const item of items) {
    const bucket = groups.get(item.type) ?? [];
    bucket.push(item);
    groups.set(item.type, bucket);
  }

  return order
    .filter((type) => groups.has(type))
    .map((type) => ({ type, items: groups.get(type)! }));
}

function ensureHost(input: HTMLInputElement): HTMLElement {
  const parent = input.parentElement;
  if (!parent) return input;
  parent.classList.add("reovana-search-suggest-host");
  return parent;
}

function createDropdown(host: HTMLElement): HTMLDivElement {
  const existing = host.querySelector<HTMLDivElement>(".reovana-search-suggest");
  if (existing) return existing;

  const dropdown = document.createElement("div");
  dropdown.className = "reovana-search-suggest";
  dropdown.setAttribute("role", "listbox");
  dropdown.hidden = true;
  host.appendChild(dropdown);
  return dropdown;
}

export function attachSearchSuggestions(input: HTMLInputElement, options: AttachOptions = {}): () => void {
  if (input.getAttribute("data-reovana-suggest-wired") === "1") {
    return () => undefined;
  }
  input.setAttribute("data-reovana-suggest-wired", "1");
  input.setAttribute("autocomplete", "off");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-expanded", "false");

  const host = ensureHost(input);
  const dropdown = createDropdown(host);
  let debounceTimer = 0;
  let activeIndex = -1;
  let currentSuggestions: SearchSuggestion[] = [];
  let requestId = 0;

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
    dropdown.hidden = true;
    dropdown.innerHTML = "";
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

  const renderSuggestions = (suggestions: SearchSuggestion[]) => {
    currentSuggestions = suggestions;
    dropdown.innerHTML = "";

    if (!suggestions.length) {
      closeDropdown();
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

        const label = document.createElement("span");
        label.className = "reovana-search-suggest__label";
        label.textContent = suggestion.label;
        button.appendChild(label);

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
    dropdown.hidden = false;
    input.setAttribute("aria-expanded", "true");
    setActiveItem(-1);
  };

  const fetchSuggestions = async (query: string) => {
    const id = ++requestId;
    try {
      const response = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Suggest request failed");
      const payload = (await response.json()) as SuggestResponse;
      if (id !== requestId) return;
      renderSuggestions(payload.suggestions ?? []);
    } catch {
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
    const items = flatItems();
    if (!items.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = activeIndex < items.length - 1 ? activeIndex + 1 : 0;
      setActiveItem(next);
      items[next]?.scrollIntoView({ block: "nearest" });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
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
      closeDropdown();
    }
  };

  input.addEventListener("input", scheduleFetch);
  input.addEventListener("focus", scheduleFetch);
  input.addEventListener("keydown", handleKeyDown);
  document.addEventListener("mousedown", handleDocumentClick);

  return () => {
    window.clearTimeout(debounceTimer);
    input.removeEventListener("input", scheduleFetch);
    input.removeEventListener("focus", scheduleFetch);
    input.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("mousedown", handleDocumentClick);
    closeDropdown();
    dropdown.remove();
  };
}
