export type GlossaryTerm = {
  term: string;
  definition: string;
  category: "Buying" | "Property Types" | "Auction" | "Finance";
};

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: "Foreclosure",
    category: "Property Types",
    definition:
      "A legal process where a lender repossesses a home after the borrower fails to make mortgage payments. Foreclosed homes are often sold at auction or as bank-owned listings.",
  },
  {
    term: "Bank Owned (REO)",
    category: "Property Types",
    definition:
      "Real Estate Owned — property that did not sell at foreclosure auction and is now owned by the lender. REOVANA lists these as bank-owned auction opportunities.",
  },
  {
    term: "Short Sale",
    category: "Property Types",
    definition:
      "A sale where the homeowner sells for less than the mortgage balance, with lender approval. Can offer value but typically requires longer closing timelines.",
  },
  {
    term: "Opening Bid",
    category: "Auction",
    definition:
      "The starting price at an auction event. On REOVANA listings this appears as the estimated opening bid before live bidding begins.",
  },
  {
    term: "Auction Event",
    category: "Auction",
    definition:
      "A scheduled sale — online or in person — where qualified bidders compete for a property. Events may be live or upcoming on REOVANA.",
  },
  {
    term: "Trustee Sale",
    category: "Auction",
    definition:
      "A public foreclosure auction conducted by a trustee on the courthouse steps or online, depending on state law.",
  },
  {
    term: "Second Chance Foreclosure",
    category: "Buying",
    definition:
      "Properties that returned to the market after a prior foreclosure sale did not close or was cancelled, offering another purchase opportunity.",
  },
  {
    term: "Non-Bank Owned",
    category: "Property Types",
    definition:
      "Distressed or motivated sales not held by a lending institution — may include private sellers, estates, or investor liquidations.",
  },
  {
    term: "Commercial Auction",
    category: "Property Types",
    definition:
      "Auctions for office, retail, warehouse, or mixed-use assets rather than residential single-family homes.",
  },
  {
    term: "Due Diligence",
    category: "Buying",
    definition:
      "Research a buyer performs before bidding — title review, property condition, liens, occupancy, and local regulations. Auction sales are often as-is.",
  },
  {
    term: "As-Is",
    category: "Buying",
    definition:
      "The property is sold in its current condition with no seller repairs or warranties. Common for foreclosure and auction inventory.",
  },
  {
    term: "Earnest Money Deposit",
    category: "Finance",
    definition:
      "Funds submitted with an offer to show serious intent. Auction and REO contracts may require deposits within strict deadlines.",
  },
  {
    term: "Lis Pendens",
    category: "Finance",
    definition:
      "A public notice that a property is subject to pending legal action, often filed when a foreclosure case begins.",
  },
  {
    term: "Occupancy Status",
    category: "Buying",
    definition:
      "Whether a property is vacant, owner-occupied, or tenant-occupied. Eviction or cash-for-keys may be required after purchase.",
  },
  {
    term: "Redemption Period",
    category: "Finance",
    definition:
      "A window after foreclosure sale in some states where the former owner can reclaim the property by paying the sale price plus costs.",
  },
];

export type HelpTopic = {
  title: string;
  description: string;
  href: string;
  icon: string;
};

export const HELP_TOPICS: HelpTopic[] = [
  {
    title: "Browse Auctions",
    description: "Search foreclosure, bank-owned, and short-sale listings on the map.",
    href: "/auctions",
    icon: "icon-find-plus",
  },
  {
    title: "FAQ",
    description: "Answers to common questions about bidding, deposits, and closing.",
    href: "/faq",
    icon: "icon-MagnifyingGlass",
  },
  {
    title: "Glossary",
    description: "Plain-language definitions for foreclosure and auction terms.",
    href: "/learn/glossary",
    icon: "icon-HouseLine",
  },
  {
    title: "Contact Us",
    description: "Reach the REOVANA team for account or listing support.",
    href: "/contact",
    icon: "icon-mail",
  },
];

export type FaqItem = {
  question: string;
  answer: string;
  group: string;
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    group: "Getting Started",
    question: "What is REOVANA?",
    answer:
      "REOVANA is a foreclosure and auction marketplace helping buyers discover distressed properties, bank-owned homes, short sales, and commercial assets across the United States.",
  },
  {
    group: "Getting Started",
    question: "How do I search for properties?",
    answer:
      "Use Buy in the navigation to open All Auction Homes or a category such as Foreclosure Homes. Filter by location on the map, asset type, and auction status.",
  },
  {
    group: "Auctions & Bidding",
    question: "What does estimated opening bid mean?",
    answer:
      "It is the projected starting price for the auction event, not a final sale price. Live bidding may begin at or near this amount depending on the seller.",
  },
  {
    group: "Auctions & Bidding",
    question: "Do I need to register before bidding?",
    answer:
      "Yes. Select Register on a listing to complete bidder verification, agree to auction terms, and submit any required deposit instructions for that event.",
  },
  {
    group: "Auctions & Bidding",
    question: "Are auction properties sold as-is?",
    answer:
      "Most foreclosure and bank-owned auction sales are as-is. Buyers should complete due diligence on title, condition, and occupancy before placing a bid.",
  },
  {
    group: "Property Types",
    question: "What is the difference between foreclosure and bank owned?",
    answer:
      "Foreclosure homes are heading toward or in the foreclosure sale process. Bank-owned (REO) properties are already repossessed by the lender and offered for sale.",
  },
  {
    group: "Property Types",
    question: "What is a short sale?",
    answer:
      "A short sale is approved by the lender to accept less than the mortgage balance. These can take longer to close but may offer below-market pricing.",
  },
  {
    group: "Account & Support",
    question: "How do I save a property?",
    answer:
      "Click the heart icon on any listing card to add it to your favorites once you are signed in to your REOVANA account.",
  },
  {
    group: "Account & Support",
    question: "Where can I get more help?",
    answer:
      "Visit the Help Center for guided topics, browse the Glossary for terminology, or contact our support team through the Contact page.",
  },
];
