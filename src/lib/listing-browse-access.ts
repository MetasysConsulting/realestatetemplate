/**
 * Browse cards show street address + price publicly (Sammy Jul 2026: lock only owner info).
 * Kept as an async helper so call sites stay unchanged if soft-gates return later.
 */
export async function shouldRevealBrowseDetails(): Promise<boolean> {
  return true;
}
