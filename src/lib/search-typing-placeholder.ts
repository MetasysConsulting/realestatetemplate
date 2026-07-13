/**
 * Realtor.com–style rotating typing placeholders for empty search inputs.
 * Renders typed example queries + a blinking caret overlay.
 * Pauses while focused or when the user has typed; resumes when empty + blurred.
 */

export const DEFAULT_SEARCH_TYPING_PHRASES = [
  "Miami, FL foreclosures",
  "1810 NW 55th St, Miami, FL",
  "3 bed, 2 bath bank-owned home",
  "HUD homes under $250,000",
  "Nashville, TN single-family",
  "Auction properties near Atlanta, GA",
  "Motivated sellers in Dallas, TX",
] as const;

const STATIC_PLACEHOLDER = "City, address, ZIP, or home type";

type AttachTypingPlaceholderOptions = {
  phrases?: readonly string[];
  typeMs?: number;
  deleteMs?: number;
  holdMs?: number;
  gapMs?: number;
};

export function attachTypingPlaceholder(
  input: HTMLInputElement,
  options: AttachTypingPlaceholderOptions = {},
): () => void {
  if (input.getAttribute("data-reovana-typing-placeholder") === "1") {
    return () => undefined;
  }
  input.setAttribute("data-reovana-typing-placeholder", "1");

  const phrases = options.phrases?.length
    ? options.phrases
    : DEFAULT_SEARCH_TYPING_PHRASES;
  const typeMs = options.typeMs ?? 46;
  const deleteMs = options.deleteMs ?? 26;
  const holdMs = options.holdMs ?? 2000;
  const gapMs = options.gapMs ?? 420;

  const host = input.parentElement;
  if (!host) {
    input.removeAttribute("data-reovana-typing-placeholder");
    return () => undefined;
  }

  host.classList.add("reovana-search-typing-host");

  const overlay = document.createElement("div");
  overlay.className = "reovana-search-typing-overlay";
  overlay.setAttribute("aria-hidden", "true");

  const textEl = document.createElement("span");
  textEl.className = "reovana-search-typing-overlay__text";

  const caretEl = document.createElement("span");
  caretEl.className = "reovana-search-typing-overlay__caret";

  overlay.append(textEl, caretEl);
  host.appendChild(overlay);

  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  const clearTimer = () => {
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const shouldAnimate = () =>
    !stopped && document.activeElement !== input && !input.value.trim();

  const showOverlay = (visible: boolean) => {
    overlay.classList.toggle("is-visible", visible);
    if (visible) {
      input.setAttribute("placeholder", "");
    } else if (!input.value.trim()) {
      input.setAttribute("placeholder", STATIC_PLACEHOLDER);
    } else {
      input.setAttribute("placeholder", STATIC_PLACEHOLDER);
    }
  };

  const renderTyped = () => {
    const phrase = phrases[phraseIndex % phrases.length] ?? "";
    textEl.textContent = phrase.slice(0, charIndex);
  };

  const schedule = (fn: () => void, ms: number) => {
    clearTimer();
    timer = setTimeout(fn, ms);
  };

  const tick = () => {
    if (!shouldAnimate()) {
      showOverlay(false);
      schedule(tick, 350);
      return;
    }

    showOverlay(true);
    const phrase = phrases[phraseIndex % phrases.length] ?? "";

    if (!deleting) {
      charIndex = Math.min(charIndex + 1, phrase.length);
      renderTyped();
      if (charIndex >= phrase.length) {
        deleting = true;
        schedule(tick, holdMs);
        return;
      }
      schedule(tick, typeMs);
      return;
    }

    charIndex = Math.max(charIndex - 1, 0);
    renderTyped();
    if (charIndex <= 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      schedule(tick, gapMs);
      return;
    }
    schedule(tick, deleteMs);
  };

  const onFocus = () => showOverlay(false);
  const onBlur = () => {
    if (!input.value.trim()) {
      // Resume animation on next tick loop.
    }
  };
  const onInput = () => {
    if (input.value.trim()) showOverlay(false);
  };

  input.addEventListener("focus", onFocus);
  input.addEventListener("blur", onBlur);
  input.addEventListener("input", onInput);
  input.classList.add("reovana-search-typing-input");
  input.setAttribute("placeholder", "");

  schedule(tick, 500);

  return () => {
    stopped = true;
    clearTimer();
    input.removeEventListener("focus", onFocus);
    input.removeEventListener("blur", onBlur);
    input.removeEventListener("input", onInput);
    input.removeAttribute("data-reovana-typing-placeholder");
    input.classList.remove("reovana-search-typing-input");
    host.classList.remove("reovana-search-typing-host");
    overlay.remove();
    input.setAttribute("placeholder", STATIC_PLACEHOLDER);
  };
}
