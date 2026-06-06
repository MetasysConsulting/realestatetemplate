/** Content ported from reovana-learn-section.html */

export type GlossaryPill = "REO" | "Filing" | "Stage";

export type GlossaryTerm = {
  term: string;
  pill?: GlossaryPill;
  definition: string;
};

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: "Bank-Owned (REO)",
    pill: "REO",
    definition:
      "A property the lender has taken back after it failed to sell at auction. \"Real Estate Owned\" homes are sold by the bank and often resemble a standard purchase.",
  },
  {
    term: "Deed in Lieu",
    definition:
      "An arrangement where an owner voluntarily transfers the property to the lender to avoid a full foreclosure process.",
  },
  {
    term: "Deficiency Judgment",
    definition:
      "A court ruling that can hold a former owner responsible for the gap between what was owed and what the property sold for.",
  },
  {
    term: "Distressed Property",
    definition:
      "Any home under financial or legal pressure — behind on payments, in foreclosure, or facing a forced sale.",
  },
  {
    term: "Equity",
    definition:
      "The difference between a property's estimated market value and the amount still owed on it. Positive equity is what makes a deal attractive.",
  },
  {
    term: "Foreclosure",
    definition:
      "The legal process a lender uses to recover a loan balance when an owner stops paying, usually ending in a forced sale of the home.",
  },
  {
    term: "Lien",
    definition:
      "A legal claim against a property for an unpaid debt — a mortgage, taxes, or contractor bills — that typically must be cleared before a clean sale.",
  },
  {
    term: "Lis Pendens",
    pill: "Filing",
    definition:
      "Latin for \"suit pending.\" A public notice that a foreclosure lawsuit has been filed against a property — often the first visible sign of distress.",
  },
  {
    term: "Notice of Default (NOD)",
    pill: "Filing",
    definition:
      "A formal notice recorded when an owner has missed payments, marking an early stage of the foreclosure timeline.",
  },
  {
    term: "Notice of Sale",
    pill: "Filing",
    definition:
      "A recorded announcement that a property is scheduled for auction, including the date, time, and location.",
  },
  {
    term: "Pre-Foreclosure",
    pill: "Stage",
    definition:
      "The window after a default notice but before the auction. Owners can still sell or resolve the debt, and buyers can often deal with them directly.",
  },
  {
    term: "Redemption Period",
    definition:
      "A timeframe in some states during which a former owner can reclaim the property by paying what's owed, even after a sale.",
  },
  {
    term: "Short Sale",
    pill: "Stage",
    definition:
      "A sale where the lender agrees to accept less than the full mortgage balance, usually to avoid the cost of foreclosure.",
  },
  {
    term: "Sheriff's Sale",
    definition:
      "A public auction, often court-ordered, where a foreclosed property is sold to the highest bidder.",
  },
  {
    term: "Tax Lien / Tax-Delinquent",
    definition:
      "A claim placed on a property for unpaid property taxes. Severe cases can lead to a tax sale of the home.",
  },
  {
    term: "Trustee Sale",
    definition:
      "An auction conducted by a trustee in states that handle foreclosures outside of court (non-judicial).",
  },
  {
    term: "Underwater Mortgage",
    definition:
      "When an owner owes more on the mortgage than the home is currently worth — a common driver of distress.",
  },
];

export type LearnHubCard = {
  title: string;
  description: string;
  href: string;
  icon: string;
};

export const LEARN_HUB_CARDS: LearnHubCard[] = [
  {
    title: "Glossary",
    description:
      "Lis pendens, REO, short sale — every foreclosure term defined in clear language.",
    href: "/learn/glossary",
    icon: "📖",
  },
  {
    title: "Help Center",
    description:
      "Step-by-step help for buying, bidding, unlocking listings, and selling your home.",
    href: "/learn/help-center",
    icon: "🛟",
  },
  {
    title: "Blog",
    description: "Market insights and how-to guides for finding deals in distressed real estate.",
    href: "/learn/guides/beginners-guide",
    icon: "✍️",
  },
  {
    title: "FAQ",
    description: "Quick answers about accounts, payments, data, and how REOVANA works.",
    href: "/learn/faq",
    icon: "❓",
  },
];

export type FeaturedGuide = {
  tag: string;
  title: string;
  description: string;
  href: string;
  imageUrl: string;
};

export const FEATURED_GUIDES: FeaturedGuide[] = [
  {
    tag: "Buying",
    title: "A beginner's guide to buying foreclosed homes",
    description:
      "What to expect at each stage, from pre-foreclosure to auction to bank-owned.",
    href: "/learn/guides/beginners-guide",
    imageUrl: "/images/auction-properties/09-wood-siding-bungalow.jpg",
  },
  {
    tag: "Help",
    title: "How unlocking a property's full details works",
    description: "What you see for free, what unlocking reveals, and how billing works.",
    href: "/learn/help/unlocking-listing-details",
    imageUrl: "/images/auction-properties/02-white-colonial.jpg",
  },
  {
    tag: "Glossary",
    title: "10 foreclosure terms every buyer should know",
    description: "Skip the jargon — understand the words you'll see on every listing.",
    href: "/learn/glossary",
    imageUrl: "/images/auction-properties/05-craftsman-porch.jpg",
  },
];

export type HelpCategory = {
  icon: string;
  title: string;
  articles: { label: string; href: string }[];
};

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    icon: "🚀",
    title: "Getting Started",
    articles: [
      { label: "Creating your REOVANA account", href: "/learn/faq" },
      { label: "Setting up search alerts", href: "/auctions" },
      { label: "Understanding listing types", href: "/learn/glossary" },
    ],
  },
  {
    icon: "🔨",
    title: "Buying & Bidding",
    articles: [
      {
        label: "How unlocking a listing works",
        href: "/learn/help/unlocking-listing-details",
      },
      { label: "How auctions are scheduled", href: "/auctions" },
      { label: "Placing and tracking a bid", href: "/learn/faq" },
    ],
  },
  {
    icon: "🏠",
    title: "Selling Your Home",
    articles: [
      { label: "Listing your property", href: "/add-property" },
      { label: "Listing fees explained", href: "/learn/faq" },
      { label: "Editing or removing a listing", href: "/contact" },
    ],
  },
  {
    icon: "💳",
    title: "Account & Billing",
    articles: [
      { label: "Per-unlock vs. subscription", href: "/learn/help/unlocking-listing-details" },
      { label: "Updating payment details", href: "/contact" },
      { label: "Refunds and receipts", href: "/learn/faq" },
    ],
  },
];

export const POPULAR_HELP_ARTICLES = [
  {
    label: "How unlocking a property's full details works",
    href: "/learn/help/unlocking-listing-details",
  },
  {
    label: "What's the difference between pre-foreclosure, auction, and bank-owned?",
    href: "/learn/faq",
  },
  {
    label: "Where does REOVANA's listing data come from?",
    href: "/learn/faq",
  },
  {
    label: "How accurate are the equity estimates?",
    href: "/learn/faq",
  },
];

export type LearnArticleSection =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "callout"; text: string };

export type LearnArticle = {
  slug: string;
  meta: string;
  title: string;
  backHref: string;
  backLabel: string;
  heroImageUrl?: string;
  sections: LearnArticleSection[];
};

export const HELP_ARTICLE_UNLOCKING: LearnArticle = {
  slug: "unlocking-listing-details",
  meta: "Help Center › Buying & Bidding · 3 min read",
  title: "How unlocking a property's full details works",
  backHref: "/learn/help-center",
  backLabel: "Back to Help Center",
  heroImageUrl: "/images/auction-properties/02-white-colonial.jpg",
  sections: [
    {
      type: "p",
      text: "Every REOVANA listing shows you a lot for free — the price estimate, distress stage, photos, neighborhood, and key dates. A few sensitive details are held back until you unlock them: the exact street address and the owner's contact information. Here's how that works.",
    },
    { type: "h2", text: "What you can see for free" },
    {
      type: "ul",
      items: [
        "Estimated value, amount owed, and equity",
        "Distress stage and the full foreclosure timeline",
        "Bedrooms, bathrooms, square footage, and photos",
        "Approximate location and neighborhood",
      ],
    },
    { type: "h2", text: "What unlocking reveals" },
    {
      type: "ul",
      items: [
        "The exact street address",
        "Owner of record and direct contact details",
        "Parcel ID and lender information",
      ],
    },
    {
      type: "callout",
      text: "Unlocking a property is for your own research and outreach. Always follow applicable contact and privacy rules when reaching out to an owner.",
    },
    { type: "h2", text: "Two ways to unlock" },
    {
      type: "ol",
      items: [
        "Pay per property — unlock a single listing's full details for a one-time fee.",
        "Subscribe — unlock unlimited listings while your plan is active, ideal for active investors.",
      ],
    },
    { type: "h3", text: "Step by step" },
    {
      type: "ol",
      items: [
        "Open any listing and scroll to the locked panel.",
        "Choose \"Unlock this property\" or \"Subscribe.\"",
        "Complete secure checkout.",
        "The address and owner contact appear instantly, and the property is saved to your unlocked list.",
      ],
    },
  ],
};

export const BLOG_ARTICLE_BEGINNERS: LearnArticle = {
  slug: "beginners-guide",
  meta: "Blog · Buying · June 2026 · 6 min read",
  title: "A beginner's guide to buying foreclosed homes",
  backHref: "/learn/overview",
  backLabel: "Back to Learn",
  heroImageUrl: "/images/auction-properties/09-wood-siding-bungalow.jpg",
  sections: [
    {
      type: "p",
      text: "Buying a distressed home can mean real value — but the process looks different from a typical purchase. Properties move through distinct stages, each with its own risks and opportunities. This guide walks through what to expect so you can decide where you're comfortable buying.",
    },
    { type: "h2", text: "The three stages of distress" },
    { type: "h3", text: "1. Pre-foreclosure" },
    {
      type: "p",
      text: "The owner has fallen behind on payments and a notice has been filed, but the home hasn't been sold yet. You're often dealing directly with the owner, which can mean more flexibility — and more time to inspect and arrange financing.",
    },
    { type: "h3", text: "2. Auction" },
    {
      type: "p",
      text: "If the default isn't resolved, the property goes to public auction. Auctions can offer the steepest discounts, but they also carry the most risk: limited inspection, cash or fast financing required, and the chance of existing liens. Preparation matters more here than anywhere else.",
    },
    { type: "h3", text: "3. Bank-owned (REO)" },
    {
      type: "p",
      text: "When a home doesn't sell at auction, the lender takes ownership and it becomes \"real estate owned.\" These sales feel closest to a normal transaction — you can usually inspect the home and use standard financing — though properties may need repairs.",
    },
    {
      type: "callout",
      text: "Rule of thumb: earlier stages offer more access and negotiation; later stages offer cleaner transactions. Match the stage to your risk tolerance and how much cash you can move quickly.",
    },
    { type: "h2", text: "Five steps to get started" },
    {
      type: "ol",
      items: [
        "Set your budget — include a cushion for repairs and back taxes or liens.",
        "Get financing lined up — pre-approval, or proof of funds for auctions.",
        "Research the property — value, equity, liens, and the foreclosure timeline.",
        "Inspect what you can — even a drive-by tells you a lot before an auction.",
        "Know your exit — live in it, rent it, or resell? Decide before you commit.",
      ],
    },
    {
      type: "p",
      text: "Distressed buying rewards preparation. The more you understand each stage before you bid, the more confidently you can spot a genuine deal.",
    },
  ],
};

export type FaqItem = {
  question: string;
  answer: string;
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Where does REOVANA's listing data come from?",
    answer:
      "Listings are aggregated from foreclosure and distressed-property data sources nationwide, then standardized into one format and refreshed on a regular schedule so the site stays current.",
  },
  {
    question: "What's the difference between pre-foreclosure, auction, and bank-owned?",
    answer:
      "They're stages of the same process. Pre-foreclosure is early, when the owner still holds the home; auction is the forced public sale; bank-owned (REO) is after the lender takes the property back.",
  },
  {
    question: "Why are some details blurred?",
    answer:
      "The price, photos, and key facts are free. The exact address and owner contact are unlocked with a payment, which keeps detailed data available to serious buyers and investors.",
  },
  {
    question: "Do I pay per property or subscribe?",
    answer:
      "Both options exist. Unlock a single property for a one-time fee, or subscribe for unlimited unlocks while your plan is active.",
  },
  {
    question: "How accurate are the equity estimates?",
    answer:
      "Estimates combine market value and the amount owed to give a useful starting signal. They're a guide for research, not a guaranteed figure — always verify before bidding.",
  },
  {
    question: "Can I sell my own property on REOVANA?",
    answer:
      "Yes. Use the Add Property option to list your home. Listing fees and options are shown during setup.",
  },
  {
    question: "Does REOVANA cover the whole country?",
    answer:
      "Coverage spans the U.S. and expands over time as more sources are added, with the broadest coverage in active foreclosure markets.",
  },
  {
    question: "Is REOVANA giving legal or financial advice?",
    answer:
      "No. The guides and data are for education and research. For decisions on a specific property, consult a qualified professional in your state.",
  },
];
