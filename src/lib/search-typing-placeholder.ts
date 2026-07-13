/**
 * Realtor.com–style rotating typing placeholders for empty search inputs.
 * Stops while the user focuses or types; resumes when empty + blurred.
 */

export const DEFAULT_SEARCH_TYPING_PHRASES = [
  "Describe what home you want to live in",
  "Single story home in Nashville",
  "HUD homes in Miami",
  "3 bed foreclosure in Texas",
  "Bank owned homes near Atlanta",
  "Auction property under $200,000",
] as const;

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
  const typeMs = options.typeMs ?? 48;
  const deleteMs = options.deleteMs ?? 28;
  const holdMs = options.holdMs ?? 1800;
  const gapMs = options.gapMs ?? 500;

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
    !stopped &&
    document.activeElement !== input &&
    !input.value.trim();

  const setPlaceholder = (text: string) => {
    input.setAttribute("placeholder", text);
  };

  const schedule = (fn: () => void, ms: number) => {
    clearTimer();
    timer = setTimeout(fn, ms);
  };

  const tick = () => {
    if (!shouldAnimate()) {
      if (input.value.trim()) {
        setPlaceholder("Search city, address, or property type");
      }
      schedule(tick, 400);
      return;
    }

    const phrase = phrases[phraseIndex % phrases.length] ?? "";

    if (!deleting) {
      charIndex = Math.min(charIndex + 1, phrase.length);
      setPlaceholder(phrase.slice(0, charIndex));
      if (charIndex >= phrase.length) {
        deleting = true;
        schedule(tick, holdMs);
        return;
      }
      schedule(tick, typeMs);
      return;
    }

    charIndex = Math.max(charIndex - 1, 0);
    setPlaceholder(phrase.slice(0, charIndex));
    if (charIndex <= 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      schedule(tick, gapMs);
      return;
    }
    schedule(tick, deleteMs);
  };

  const onFocus = () => {
    // Keep current hint while focused until they type.
    if (!input.value.trim() && input.placeholder) {
      // no-op — animation pauses via shouldAnimate
    }
  };

  const onInput = () => {
    if (input.value.trim()) {
      setPlaceholder("Search city, address, or property type");
    }
  };

  input.addEventListener("focus", onFocus);
  input.addEventListener("input", onInput);
  input.classList.add("reovana-search-typing-input");

  // Start with empty placeholder then type.
  setPlaceholder("");
  schedule(tick, 600);

  return () => {
    stopped = true;
    clearTimer();
    input.removeEventListener("focus", onFocus);
    input.removeEventListener("input", onInput);
    input.removeAttribute("data-reovana-typing-placeholder");
    input.classList.remove("reovana-search-typing-input");
  };
}
