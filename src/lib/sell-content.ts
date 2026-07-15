export const SELL_HERO_FEATURES = [
  {
    title: "Reach Cash Buyers",
    description: "Get offers fast from serious investors.",
    icon: "cash",
    tone: "blue",
  },
  {
    title: "Maximize Exposure",
    description: "Your property is seen by thousands of buyers.",
    icon: "people",
    tone: "orange",
  },
  {
    title: "$49/month Listing",
    description: "Publish and keep your listing live with a simple monthly plan.",
    icon: "shield",
    tone: "blue",
  },
] as const;

export const SELL_OPTIONS = [
  {
    title: "Get a Cash Offer",
    description: "Sell directly to investors for a fast, hassle-free closing.",
    icon: "cash",
    tone: "green",
    perks: [
      "No repairs or inspections",
      "Close in as little as 7 days",
      "No realtor commissions or fees",
    ],
    cta: "Get My Cash Offer",
    decor: "house",
    href: null,
  },
  {
    title: "Find a Realtor®",
    description: "Work with a local agent who can help you sell your property.",
    icon: "realtor",
    tone: "blue",
    perks: [
      "Get expert pricing guidance",
      "Market to a wider audience",
      "Negotiation support",
    ],
    cta: "Find a Realtor",
    decor: "city",
    href: null,
  },
  {
    title: "Sell On Your Own",
    description: "List your property on REOVANA.com and sell on your own terms.",
    icon: "tag",
    tone: "orange",
    perks: [
      "$49/month listing subscription",
      "Connect with interested buyers",
      "You stay in control",
    ],
    cta: "List My Property",
    decor: "forsale",
    href: "/add-property",
  },
] as const;

export const SELL_WHY_CHOOSE = [
  {
    title: "Active Investor Network",
    description: "We connect you with serious cash buyers and investors.",
    icon: "network",
  },
  {
    title: "Fast & Convenient",
    description: "List today and start receiving interest right away.",
    icon: "fast",
  },
  {
    title: "Secure & Reliable",
    description: "Your information is safe and always protected.",
    icon: "secure",
  },
  {
    title: "Trusted by Investors",
    description: "REOVANA.com is a go-to platform for distressed property deals.",
    icon: "trusted",
  },
] as const;
