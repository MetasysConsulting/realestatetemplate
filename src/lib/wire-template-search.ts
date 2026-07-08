"use client";

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
  const v = value.trim();
  if (!v) return "";
  if (/^(province|states?)\s*\/\s*states?$/i.test(v)) return "";
  if (/^province\s*\/\s*states$/i.test(v)) return "";
  if (/^any$/i.test(v)) return "";
  return v;
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
    const state = parseState(readNiceSelectCurrentText(stateSelect));
    const beds = asNumberToken(readNiceSelectCurrentText(bedsSelect));
    const baths = asNumberToken(readNiceSelectCurrentText(bathSelect));
    const rooms = asNumberToken(readNiceSelectCurrentText(roomsSelect));

    const minPrice = minPriceInput?.value ? asNumberToken(minPriceInput.value) : "";
    const maxPrice = maxPriceInput?.value ? asNumberToken(maxPriceInput.value) : "";

    // If template says "Rooms", treat it as "beds" when beds is not provided.
    const resolvedBeds = beds || rooms;

    const url = buildSearchUrl({
      q: q || undefined,
      state: state || undefined,
      beds: resolvedBeds || undefined,
      baths: baths || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
    });

    window.location.assign(url);
  };

  form.addEventListener("submit", submit);
  submitLink.addEventListener("click", submit);
}

