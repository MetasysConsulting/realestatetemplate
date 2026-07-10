export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  attachments?: Array<{
    type: "image" | "pdf" | "file"
    name: string
    url: string
    size?: string
  }>
}

export const simulateAIResponse = (userMessage: string): string => {
  const lowerMessage = userMessage.toLowerCase()

  if (lowerMessage.includes("summarize") || lowerMessage.includes("summary")) {
    return "REOVANA platform snapshot:\n\n• **2,142** active distressed-property listings nationwide\n• **1,847** property unlocks this month (+21.8%)\n• **$28.4K** unlock + subscription revenue in July\n• Top inventory: HUD Homes (807), VA REO (800), HomeSteps (475)\n• **5 of 7** data feeds healthy — USDA and Fannie Mae HomePath blocked\n\nFlorida, Texas, and Ohio drive the most traffic and unlock volume."
  }

  if (lowerMessage.includes("hud") || lowerMessage.includes("scraper") || lowerMessage.includes("feed")) {
    return "Data feed status:\n\n| Source | Listings | Status |\n|--------|----------|--------|\n| HUD HomeStore | 807 | Active |\n| VA REO (VRM) | 800 | Active |\n| Freddie Mac HomeSteps | 475 | Active |\n| GSA Government Disposition | 48 | Active |\n| GSA Federal Auctions | 12 | Active |\n| USDA Resales | 0 | Blocked (anti-clickjack) |\n| Fannie Mae HomePath | 0 | Blocked (403) |\n\nRun `pnpm scrape-hud` and similar scripts on the main site repo to refresh feeds."
  }

  if (lowerMessage.includes("unlock") || lowerMessage.includes("revenue") || lowerMessage.includes("subscription")) {
    return "Monetization breakdown (mock admin data):\n\n• **Per-unlock**: $9 one-time for full address + contact\n• **Pro plan**: $49/mo — unlimited unlocks\n• July revenue: **$28.4K** ($16K unlocks, $12.4K subscriptions)\n• Conversion: ~0.8% of listing views → unlock\n• Pro subscribers: **1,240** (+86 this month)\n\nHUD and foreclosure categories convert best in FL and TX markets."
  }

  if (lowerMessage.includes("category") || lowerMessage.includes("foreclosure") || lowerMessage.includes("listing")) {
    return "Buy menu categories on the public site:\n\n• Motivated Seller · Off-Market · Foreclosure · Pre-Foreclosure\n• Bank Owned · Auction Property · Sheriff's Sale · Tax Delinquent · HUD Home\n\nHighest inventory right now: **HUD Homes** (807 on-site detail pages), **Foreclosure** (312), and **Bank Owned** (248).\n\nListings show blurred details until a user unlocks or subscribes to Pro."
  }

  if (lowerMessage.includes("market") || lowerMessage.includes("state") || lowerMessage.includes("florida")) {
    return "Top markets by listing volume:\n\n1. **Florida** — 412 listings, 18.2K views\n2. **Texas** — 318 listings, 14.6K views\n3. **Ohio** — 245 listings, 11.1K views\n4. **Georgia** — 198 listings, 8.4K views\n\nThese align with active foreclosure corridors. Consider prioritizing scraper refresh for Gulf Coast and Sun Belt metros."
  }

  return `I can help with REOVANA admin tasks related to "${userMessage}". Try asking about:\n\n• Listing inventory and buy categories\n• HUD, VA REO, and other data feeds\n• Unlock revenue and Pro subscriptions\n• Top states and conversion trends\n• Scraper health and blocked sources\n\nWhat would you like to dig into?`
}

export const suggestedPrompts = [
  "Summarize REOVANA platform metrics",
  "Which data feeds are blocked?",
  "Top foreclosure markets this month",
  "Unlock revenue vs subscriptions",
]
