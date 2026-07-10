"use client";

import { attachSearchSuggestions } from "@/lib/attach-search-suggestions";
import { normalizeStateQuery } from "@/lib/us-states";

type SearchPayload = {
  q?: string;
  state?: string;
  beds?: string;
  baths?: string;
  minPrice?: string;
  maxPrice?: string;
};

function normalizeToken(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function asNumberToken(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, "");
  return cleaned ? String(Math.floor(Number(cleaned) || 0)) : "";
}

function readNiceSelectCurrentText(wrapper: Element | null): string {
  const current = wrapper?.querySelector(".current")?.textContent ?? "";
  return normalizeToken(current);
}

function parseState(value: string): string {
  return normalizeStateQuery(value);
}

function readNiceSelectCurrent(wrapper: Element | null): string {
  return readNiceSelectCurrentText(wrapper);
}

function readOptionalCount(wrapper: Element | null): string {
  if (!wrapper) return "";
  const current = readNiceSelectCurrent(wrapper);
  if (!current || /any/i.test(current) || /^rooms?$/i.test(current)) return "";
  return asNumberToken(current);
}

function advancedFiltersActive(advanced: Element | null): boolean {
  return Boolean(advanced?.classList.contains("show"));
}

function buildSearchUrl(payload: SearchPayload): string {
  const params = new URLSearchParams();
  if (payload.q) params.set("q", payload.q);
  if (payload.state) params.set("state", payload.state);
  if (payload.beds) params.set("beds", payload.beds);
  if (payload.baths) params.set("baths", payload.baths);
  if (payload.minPrice) params.set("minPrice", payload.minPrice);
  if (payload.maxPrice) params.set("maxPrice", payload.maxPrice);
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

export function wireTemplateSearch(): void {
  const root = document.getElementById("template-root");
  if (!root) return;

  // Homepage hero search widget (template HTML).
  const widget = root.querySelector(".wg-filter");
  if (!widget) return;

  const form = widget.querySelector("form");
  const input = widget.querySelector<HTMLInputElement>("input[type=\"text\"]");
  const submitLink = widget.querySelector<HTMLAnchorElement>(".wrap-btn a.tf-btn");

  // Advanced search panel fields.
  const advanced = widget.querySelector(".wd-search-form");
  const stateSelect = advanced?.querySelectorAll(".nice-select")?.[0] ?? null;
  const roomsSelect = advanced?.querySelectorAll(".nice-select")?.[1] ?? null;
  const bathSelect = advanced?.querySelectorAll(".nice-select")?.[2] ?? null;
  const bedsSelect = advanced?.querySelectorAll(".nice-select")?.[3] ?? null;

  const minPriceInput = advanced?.querySelector<HTMLInputElement>("input[name=\"min-value\"]") ?? null;
  const maxPriceInput = advanced?.querySelector<HTMLInputElement>("input[name=\"max-value\"]") ?? null;

  if (!form || !input || !submitLink) return;
  if (form.getAttribute("data-reovana-search-wired") === "1") return;
  form.setAttribute("data-reovana-search-wired", "1");

  const submit = (event?: Event) => {
    event?.preventDefault();

    const q = normalizeToken(input.value);
    const useAdvanced = advancedFiltersActive(advanced);

    const state = useAdvanced ? parseState(readNiceSelectCurrent(stateSelect)) : "";
    const beds = useAdvanced ? readOptionalCount(bedsSelect) || readOptionalCount(roomsSelect) : "";
    const baths = useAdvanced ? readOptionalCount(bathSelect) : "";

    const minPrice =
      useAdvanced && minPriceInput?.value ? asNumberToken(minPriceInput.value) : "";
    const maxPrice =
      useAdvanced && maxPriceInput?.value ? asNumberToken(maxPriceInput.value) : "";

    const url = buildSearchUrl({
      q: q || undefined,
      state: state || undefined,
      beds: beds || undefined,
      baths: baths || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
    });

    window.location.assign(url);
  };

  form.addEventListener("submit", submit);
  submitLink.addEventListener("click", submit);
  attachSearchSuggestions(input, {
    onSelect: (suggestion) => {
      // Input already filled by attachSearchSuggestions; navigate to the suggestion URL.
      window.location.assign(suggestion.href);
      return false;
    },
  });
}

