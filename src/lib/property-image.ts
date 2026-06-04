import type { BuyCategoryKey } from "@/lib/buy-categories";

const PROMPTS: Record<BuyCategoryKey, string> = {
  all: "professional real estate photograph single family suburban house exterior front yard sunny day",
  "foreclosure-homes":
    "distressed foreclosure single family home exterior real estate photo needs renovation suburban",
  "bank-owned":
    "bank owned repossessed residential house exterior real estate listing photo suburban",
  "second-chance-foreclosure":
    "affordable suburban home exterior second chance foreclosure real estate photograph",
  "short-sale":
    "short sale residential property exterior real estate photo two story home neighborhood",
  commercial:
    "commercial real estate property office retail building exterior professional photograph",
  "non-bank-owned":
    "private sale residential home exterior real estate photo charming suburban house",
};

/** AI-generated style placeholder via Pollinations (stable per property id). */
export function getPropertyImageUrl(propertyId: string, buyType: BuyCategoryKey): string {
  const prompt = PROMPTS[buyType] ?? PROMPTS.all;
  const seed = propertyId.replace(/[^a-z0-9]/gi, "");
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=480&height=360&seed=${seed}&nologo=true`;
}
