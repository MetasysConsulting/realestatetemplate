export type LegalSection = {
  title: string;
  paragraphs: string[];
};

export const LEGAL_LAST_UPDATED = "June 30, 2026";

export const PRIVACY_POLICY_SECTIONS: LegalSection[] = [
  {
    title: "Overview",
    paragraphs: [
      "REOVANA (“we,” “us,” or “our”) operates the website at reovana.com and related services. This Privacy Policy explains how we collect, use, and protect information when you use our site.",
      "This is a placeholder policy for launch purposes. Your organization should review and replace this text with counsel-approved language before production marketing.",
    ],
  },
  {
    title: "Information we collect",
    paragraphs: [
      "Account information such as name, email address, and password when you register or sign in (including through Google or other providers).",
      "Usage information such as pages viewed, searches, and device/browser data collected through cookies and similar technologies.",
      "Property and listing interaction data, including saved searches, favorites, and unlock activity where those features are enabled.",
    ],
  },
  {
    title: "How we use information",
    paragraphs: [
      "To provide and improve the REOVANA marketplace, including listings, search, and account features.",
      "To authenticate users, secure accounts, and prevent fraud or abuse.",
      "To communicate with you about your account, support requests, and service updates.",
      "To comply with legal obligations and enforce our Terms of Use.",
    ],
  },
  {
    title: "Sharing",
    paragraphs: [
      "We use service providers (for example hosting, authentication, analytics, and payment processing) that process data on our behalf under contractual safeguards.",
      "We may disclose information if required by law, to protect rights and safety, or in connection with a business transfer.",
      "We do not sell your personal information for money. Any sharing for advertising or analytics will be described in an updated policy.",
    ],
  },
  {
    title: "Data retention & security",
    paragraphs: [
      "We retain information as long as needed to provide the service, meet legal requirements, and resolve disputes.",
      "We use reasonable administrative, technical, and organizational measures to protect data. No method of transmission over the Internet is 100% secure.",
    ],
  },
  {
    title: "Your choices",
    paragraphs: [
      "You may update account details from your profile where available, or contact us to request access, correction, or deletion subject to applicable law.",
      "You may disable cookies in your browser, though some features may not work correctly.",
    ],
  },
  {
    title: "Contact",
    paragraphs: [
      "Questions about this policy: contact us through the REOVANA contact page or your account support email on file.",
    ],
  },
];

export const TERMS_OF_USE_SECTIONS: LegalSection[] = [
  {
    title: "Agreement",
    paragraphs: [
      "By accessing or using REOVANA, you agree to these Terms of Use. If you do not agree, do not use the site.",
      "This is a placeholder agreement for launch purposes. Replace with client-approved terms before broad public release.",
    ],
  },
  {
    title: "Service description",
    paragraphs: [
      "REOVANA provides information about distressed, foreclosure-related, and investment properties, along with tools to browse listings and related resources.",
      "We are not a broker, lender, or legal advisor unless explicitly stated on a specific page. Listing data may come from third parties and is not guaranteed accurate or complete.",
    ],
  },
  {
    title: "Accounts",
    paragraphs: [
      "You are responsible for maintaining the confidentiality of your login credentials and for activity under your account.",
      "You must provide accurate registration information and notify us of unauthorized use.",
    ],
  },
  {
    title: "Acceptable use",
    paragraphs: [
      "You may not scrape, reverse engineer, or misuse the site; interfere with security; impersonate others; or use the service for unlawful purposes.",
      "Paid features (such as listing unlocks or subscriptions) are subject to displayed pricing and any additional checkout terms.",
    ],
  },
  {
    title: "Intellectual property",
    paragraphs: [
      "Site content, branding, software, and design are owned by REOVANA or licensors and protected by applicable law. Limited personal, non-commercial use is permitted.",
    ],
  },
  {
    title: "Disclaimers",
    paragraphs: [
      "THE SITE AND LISTINGS ARE PROVIDED “AS IS” WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT TO THE MAXIMUM EXTENT PERMITTED BY LAW.",
      "Property details, valuations, and availability may change. Verify all information independently before making investment decisions.",
    ],
  },
  {
    title: "Limitation of liability",
    paragraphs: [
      "TO THE MAXIMUM EXTENT PERMITTED BY LAW, REOVANA AND ITS AFFILIATES WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SITE.",
    ],
  },
  {
    title: "Changes & contact",
    paragraphs: [
      "We may update these Terms from time to time. Continued use after changes constitutes acceptance of the revised Terms.",
      "Questions: use the contact options on reovana.com.",
    ],
  },
];
