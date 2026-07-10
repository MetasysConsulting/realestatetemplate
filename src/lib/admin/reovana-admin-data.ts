import {
  Activity,
  DollarSign,
  Eye,
  Home,
  RefreshCw,
  Unlock,
  Users,
} from "lucide-react";

export const REOVANA_BRAND = {
  name: "REOVANA",
  tagline: "Distressed property intelligence",
  headline: "Find great deals. Create real value.",
  adminTitle: "REOVANA Admin",
  publicSiteUrl: "https://reovana.com",
  localPublicSiteUrl: "/",
  primaryColor: "#7695ff",
  adminUser: { name: "REOVANA Admin", email: "admin@reovana.com", role: "Site Administrator" },
} as const;

export const ADMIN_NOTIFICATIONS = [
  { title: "HUD scrape completed", detail: "807 listings synced", time: "8 min ago", type: "success" as const },
  { title: "Property unlock", detail: "investor.fl@email.com — Tampa, FL", time: "22 min ago", type: "revenue" as const },
  { title: "Fannie Mae HomePath blocked", detail: "CloudFront 403 — manual review needed", time: "41 min ago", type: "warning" as const },
  { title: "New Pro subscriber", detail: "sarah.m@email.com", time: "1h ago", type: "success" as const },
  { title: "VA REO feed refreshed", detail: "800 listings updated", time: "2h ago", type: "success" as const },
];

export const MOCK_LISTINGS = [
  { id: "HUD-094-123456", category: "HUD Home", city: "Tampa", state: "FL", price: "$142,000", status: "Published", views: 284, unlocks: 12 },
  { id: "VA-REO-8821", category: "Bank Owned", city: "Jacksonville", state: "FL", price: "$98,500", status: "Published", views: 196, unlocks: 8 },
  { id: "FC-2024-44102", category: "Foreclosure", city: "Cleveland", state: "OH", price: "$67,200", status: "Published", views: 412, unlocks: 19 },
  { id: "HS-475-019", category: "HomeSteps", city: "Austin", state: "TX", price: "$215,000", status: "Published", views: 158, unlocks: 6 },
  { id: "AUC-8844", category: "Auction", city: "Atlanta", state: "GA", price: "$124,900", status: "Pending review", views: 89, unlocks: 3 },
  { id: "PRE-9921", category: "Pre-Foreclosure", city: "Phoenix", state: "AZ", price: "$189,000", status: "Published", views: 221, unlocks: 11 },
  { id: "TAX-4410", category: "Tax Delinquent", city: "Kansas City", state: "MO", price: "$54,800", status: "Published", views: 134, unlocks: 7 },
  { id: "HUD-094-998812", category: "HUD Home", city: "Las Vegas", state: "NV", price: "$176,500", status: "Published", views: 302, unlocks: 14 },
  { id: "OFF-2201", category: "Off-Market", city: "Charlotte", state: "NC", price: "$203,000", status: "Draft", views: 0, unlocks: 0 },
  { id: "MOT-1188", category: "Motivated Seller", city: "Nashville", state: "TN", price: "$165,000", status: "Published", views: 97, unlocks: 4 },
  { id: "SHER-330", category: "Sheriff's Sale", city: "Columbus", state: "OH", price: "$72,400", status: "Published", views: 178, unlocks: 9 },
  { id: "GSA-048-2", category: "Government Auction", city: "Denver", state: "CO", price: "$310,000", status: "Published", views: 64, unlocks: 2 },
];

export const BUY_MENU_CATEGORIES = [
  "Motivated Seller", "Off-Market", "Foreclosure", "Pre-Foreclosure",
  "Bank Owned", "Auction Property", "Sheriff's Sale", "Tax Delinquent", "HUD Home",
];

export const SUBSCRIPTION_FAQ = [
  {
    q: "Can investors switch between per-unlock and Pro?",
    a: "Yes. Pro members skip per-unlock fees while active. Lapsed subscribers can still pay $9 per property.",
  },
  {
    q: "What payment methods are supported?",
    a: "Stripe checkout for cards and digital wallets. Wire transfer available for bulk investor accounts.",
  },
  {
    q: "Is browsing free on the public site?",
    a: "Yes. Users can search categories and see blurred previews. Full address and contact require unlock or Pro.",
  },
  {
    q: "What happens when a listing is removed at source?",
    a: "The admin feed marks it inactive on the next scrape. Unlocked buyers retain their purchased detail snapshot.",
  },
];

export const SITE_SETTINGS_DEFAULTS = {
  unlockPrice: 9,
  proMonthlyPrice: 49,
  blurAddresses: true,
  showEquityEstimates: true,
  autoPublishScraped: true,
  scraperSchedule: "Every 6 hours",
};

/** Mirrors live scraper inventory on the public site (mock admin snapshot). */
export const DATA_SOURCE_FEEDS = [
  { name: "HUD HomeStore", listings: 807, status: "Active", lastSync: "2h ago" },
  { name: "VA REO (VRM)", listings: 800, status: "Active", lastSync: "3h ago" },
  { name: "Freddie Mac HomeSteps", listings: 475, status: "Active", lastSync: "4h ago" },
  { name: "GSA Government Disposition", listings: 48, status: "Active", lastSync: "6h ago" },
  { name: "GSA Federal Property Auctions", listings: 12, status: "Active", lastSync: "6h ago" },
  { name: "USDA Resales", listings: 0, status: "Blocked", lastSync: "Failed" },
  { name: "Fannie Mae HomePath", listings: 0, status: "Blocked", lastSync: "403 error" },
] as const;

export const LISTING_CATEGORIES = [
  { name: "HUD Homes", listings: 807, fill: "var(--chart-1)" },
  { name: "Foreclosure", listings: 312, fill: "var(--chart-1)" },
  { name: "Bank Owned", listings: 248, fill: "var(--chart-1)" },
  { name: "Pre-Foreclosure", listings: 186, fill: "url(#barStripes)" },
  { name: "Auction", listings: 164, fill: "var(--chart-1)" },
  { name: "Tax Delinquent", listings: 92, fill: "var(--chart-1)" },
] as const;

export const dashboardStats = [
  {
    title: "Active Listings",
    value: "2,142",
    icon: Home,
    change: "+12.4%",
    trend: "up" as const,
    gradient: "from-primary/20 to-primary/20",
    iconBg: "bg-white/10",
    iconColor: "text-white",
    subtext: "156 added this week",
  },
  {
    title: "Property Unlocks",
    value: "1,847",
    icon: Unlock,
    change: "+21.8%",
    trend: "up" as const,
    gradient: "from-primary/20 to-primary/20",
    iconBg: "bg-white/10",
    iconColor: "text-white",
    subtext: "94 today",
  },
  {
    title: "Monthly Revenue",
    value: "$28.4K",
    icon: DollarSign,
    change: "+18.6%",
    trend: "up" as const,
    gradient: "from-primary/20 to-[#4e0aad]/20",
    iconBg: "bg-white/10",
    iconColor: "text-white",
    subtext: "$1.2K today",
  },
  {
    title: "Scraper Success",
    value: "96.2%",
    icon: RefreshCw,
    change: "+1.4%",
    trend: "up" as const,
    gradient: "from-[#4e0aad]/20 to-primary/20",
    iconBg: "bg-white/10",
    iconColor: "text-white",
    subtext: "5 of 7 feeds healthy",
  },
];

export const listingTrendData = [
  { month: "Jan", listings: 1680, unlocks: 920, revenue: 14200 },
  { month: "Feb", listings: 1745, unlocks: 1010, revenue: 15800 },
  { month: "Mar", listings: 1810, unlocks: 1120, revenue: 17100 },
  { month: "Apr", listings: 1895, unlocks: 1185, revenue: 18400 },
  { month: "May", listings: 1960, unlocks: 1290, revenue: 21200 },
  { month: "Jun", listings: 2045, unlocks: 1410, revenue: 23800 },
  { month: "Jul", listings: 2142, unlocks: 1520, revenue: 25400 },
];

export const recentAdminActivity = [
  {
    time: "8 min ago",
    action: "HUD HomeStore scrape completed",
    user: "807 listings synced",
    status: "success" as const,
  },
  {
    time: "22 min ago",
    action: "Property unlock purchased",
    user: "investor.fl@email.com",
    status: "success" as const,
  },
  {
    time: "41 min ago",
    action: "Fannie Mae HomePath blocked",
    user: "CloudFront 403",
    status: "warning" as const,
  },
  {
    time: "1h ago",
    action: "New Pro subscription",
    user: "sarah.m@email.com",
    status: "success" as const,
  },
  {
    time: "2h ago",
    action: "VA REO feed refreshed",
    user: "800 listings updated",
    status: "success" as const,
  },
];

export const topMarkets = [
  { name: "Florida", listings: "412", views: "18.2K", status: "Active", usage: 88 },
  { name: "Texas", listings: "318", views: "14.6K", status: "Active", usage: 74 },
  { name: "Ohio", listings: "245", views: "11.1K", status: "Active", usage: 62 },
  { name: "Georgia", listings: "198", views: "8.4K", status: "Growing", usage: 48 },
];

export const analyticsKeyMetrics = [
  {
    title: "Unlock Revenue",
    value: "$28,400",
    change: "+18.6%",
    trend: "up" as const,
    icon: DollarSign,
    subtext: "$12.4K from subscriptions",
    color: "green-500",
  },
  {
    title: "Listing Views",
    value: "184K",
    change: "+24.1%",
    trend: "up" as const,
    icon: Eye,
    subtext: "6.2K views/day avg",
    color: "blue-500",
  },
  {
    title: "Paid Subscribers",
    value: "1,240",
    change: "+9.8%",
    trend: "up" as const,
    icon: Users,
    subtext: "86 new this month",
    color: "purple-500",
  },
  {
    title: "Feed Uptime",
    value: "96.2%",
    change: "+1.4%",
    trend: "up" as const,
    icon: Activity,
    subtext: "2 feeds need attention",
    color: "emerald-500",
  },
];

export const revenueData = [
  { month: "Jan", revenue: 18200, expenses: 8400, profit: 9800 },
  { month: "Feb", revenue: 19800, expenses: 8600, profit: 11200 },
  { month: "Mar", revenue: 21400, expenses: 8900, profit: 12500 },
  { month: "Apr", revenue: 22100, expenses: 9100, profit: 13000 },
  { month: "May", revenue: 24600, expenses: 9400, profit: 15200 },
  { month: "Jun", revenue: 26800, expenses: 9800, profit: 17000 },
  { month: "Jul", revenue: 28400, expenses: 10200, profit: 18200 },
];

export const trafficData = [
  { day: "Mon", views: 8200, unlocks: 142, signups: 28 },
  { day: "Tue", views: 9100, unlocks: 156, signups: 31 },
  { day: "Wed", views: 10400, unlocks: 168, signups: 35 },
  { day: "Thu", views: 9800, unlocks: 151, signups: 29 },
  { day: "Fri", views: 11200, unlocks: 189, signups: 42 },
  { day: "Sat", views: 7600, unlocks: 124, signups: 22 },
  { day: "Sun", views: 6900, unlocks: 108, signups: 19 },
];

export const scraperPerformance = [
  { time: "00:00", success: 94, failed: 6, pending: 12 },
  { time: "04:00", success: 96, failed: 4, pending: 8 },
  { time: "08:00", success: 92, failed: 8, pending: 18 },
  { time: "12:00", success: 97, failed: 3, pending: 6 },
  { time: "16:00", success: 95, failed: 5, pending: 10 },
  { time: "20:00", success: 96, failed: 4, pending: 7 },
];

export const subscriptionMetrics = [
  { month: "Jan", new: 68, churned: 22, net: 46 },
  { month: "Feb", new: 74, churned: 19, net: 55 },
  { month: "Mar", new: 82, churned: 24, net: 58 },
  { month: "Apr", new: 79, churned: 21, net: 58 },
  { month: "May", new: 91, churned: 18, net: 73 },
  { month: "Jun", new: 96, churned: 25, net: 71 },
];

export const topSiteFeatures = [
  { feature: "Property Search", usage: 12400, growth: 22 },
  { feature: "HUD Home Listings", usage: 9800, growth: 28 },
  { feature: "Unlock Checkout", usage: 7200, growth: 19 },
  { feature: "Auction Calendar", usage: 5100, growth: 14 },
  { feature: "Equity Estimates", usage: 4300, growth: 11 },
];

export const reovanaPricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Browse blurred listings and explore categories",
    features: [
      { text: "Browse all property categories", included: true },
      { text: "Basic search & filters", included: true },
      { text: "Learn guides & FAQs", included: true },
      { text: "Property unlocks", included: false },
      { text: "Saved searches", included: false },
      { text: "Priority alerts", included: false },
    ],
    cta: "View on site",
    popular: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "Unlimited unlocks for active investors",
    features: [
      { text: "Unlimited property unlocks", included: true },
      { text: "Full address & contact details", included: true },
      { text: "Saved searches & alerts", included: true },
      { text: "Auction & HUD detail pages", included: true },
      { text: "Export saved lists (CSV)", included: true },
      { text: "Priority email support", included: true },
    ],
    cta: "Manage plan",
    popular: true,
  },
  {
    name: "Per Unlock",
    price: "$9",
    period: "/property",
    description: "Pay once for a single property detail",
    features: [
      { text: "One full property unlock", included: true },
      { text: "Address & owner contact", included: true },
      { text: "Equity estimate snapshot", included: true },
      { text: "No subscription required", included: true },
      { text: "Bulk unlock discounts", included: false },
      { text: "Unlimited access", included: false },
    ],
    cta: "View pricing",
    popular: false,
  },
];

export const adminChartConfig = {
  listings: { label: "Listings", color: "var(--chart-1)" },
  unlocks: { label: "Unlocks", color: "var(--chart-2)" },
  revenue: { label: "Revenue", color: "var(--chart-3)" },
  views: { label: "Views", color: "var(--chart-1)" },
  success: { label: "Success %", color: "var(--chart-1)" },
  failed: { label: "Failed", color: "var(--chart-2)" },
  new: { label: "New", color: "var(--chart-1)" },
  churned: { label: "Churned", color: "var(--chart-2)" },
  expenses: { label: "Expenses", color: "var(--chart-2)" },
  profit: { label: "Profit", color: "var(--chart-3)" },
};

/** Sammy admin Home tab — operations snapshot (mock). */
export const HOME_SALES_STATS = [
  { label: "Today", value: "$1,240", subtext: "▲ 12% vs yesterday", trend: "up" as const },
  { label: "This Week", value: "$8,930", subtext: "▲ 6%", trend: "up" as const },
  { label: "This Month", value: "$34,720", subtext: "▲ 18%", trend: "up" as const },
  { label: "Total", value: "$412,560", subtext: "all time", trend: "neutral" as const },
];

export type HomeIncomeSource = {
  source: string;
  value: number;
  amount: string;
};

/** Monthly revenue mix — chart scale 0–12 ($K index) for admin Home tab. */
export const HOME_INCOME_SOURCES: HomeIncomeSource[] = [
  { source: "Paid Memberships", value: 10.2, amount: "$12,400" },
  { source: "Loan Leads", value: 9.1, amount: "$9,100" },
  { source: "Agent Leads", value: 8.3, amount: "$8,300" },
  { source: "Cash Offer Leads", value: 8.1, amount: "$8,100" },
  { source: "Data Sales", value: 7.4, amount: "$7,400" },
  { source: "Advertising", value: 6.2, amount: "$6,200" },
  { source: "Property Listings", value: 7.0, amount: "$7,000" },
];

export const HOME_MEMBER_STATS = [
  { label: "Today", value: "38", subtext: "▲ 9", trend: "up" as const },
  { label: "This Week", value: "264", subtext: "▲ 4%", trend: "up" as const },
  { label: "This Month", value: "1,109", subtext: "▲ 11%", trend: "up" as const },
  { label: "Total", value: "18,402", subtext: "all time", trend: "neutral" as const },
];

export const HOME_NEW_USERS = [
  { id: "u1", name: "Marcus Reyes", email: "m.reyes@gmail.com", plan: "Subscriber", joined: "Today, 9:14 AM" },
  { id: "u2", name: "Dana Whitfield", email: "danaw@outlook.com", plan: "Free", joined: "Today, 8:02 AM" },
  { id: "u3", name: "Priya Nair", email: "priya.n@yahoo.com", plan: "Pay-per-unlock", joined: "Today, 7:48 AM" },
  { id: "u4", name: "Tyler Brooks", email: "tbrooks@gmail.com", plan: "Free", joined: "Yesterday" },
  { id: "u5", name: "Elena Sokolov", email: "elena.s@gmail.com", plan: "Subscriber", joined: "Yesterday" },
  { id: "u6", name: "Lisa Nguyen", email: "lisa.n@email.com", plan: "Free", joined: "Yesterday" },
  { id: "u7", name: "Robert Hayes", email: "r.hayes@email.com", plan: "Subscriber", joined: "2 days ago" },
];

export const HOME_NEW_LISTINGS_TODAY = 142;

export const HOME_NEW_LISTINGS_BREAKDOWN = [
  { label: "HUD Homes", count: 61 },
  { label: "Foreclosure", count: 34 },
  { label: "Pre-Foreclosure", count: 28 },
  { label: "Auction", count: 12 },
  { label: "User-posted", count: 7 },
];

export const HOME_LOAN_FORM_NEW_COUNT = 17;

export const HOME_LOAN_LEADS = [
  { id: "l1", name: "R. Castillo", submitted: "Today" },
  { id: "l2", name: "J. Morgan", submitted: "Today" },
  { id: "l3", name: "S. Patel", submitted: "Today" },
  { id: "l4", name: "L. Nguyen", submitted: "Yesterday" },
];

export const HOME_LOAN_LEADS_TO_BANKS_COUNT = 9;

export const HOME_LOAN_LEADS_TO_BANKS = [
  { id: "b1", lead: "R. Castillo", bank: "SunTrust", status: "Pending" },
  { id: "b2", lead: "J. Morgan", bank: "Chase", status: "Pending" },
  { id: "b3", lead: "A. Flores", bank: "Wells", status: "Reviewing" },
];

export const HOME_CLOSED_LOANS_TOTAL = "$14,250";

export const HOME_CLOSED_LOANS_DEFAULT = [
  { id: "c1", lead: "A. Flores", earned: "$6,500" },
  { id: "c2", lead: "M. Diaz", earned: "$4,750" },
  { id: "c3", lead: "K. Owusu", earned: "$3,000" },
];

export type HomeListingType =
  | "Pre-Foreclosure"
  | "Auction"
  | "Bank-Owned"
  | "HUD Home"
  | "Tax Delinquent";

export const HOME_LISTING_TYPE_STYLES: Record<
  HomeListingType,
  { bg: string; text: string }
> = {
  "Pre-Foreclosure": { bg: "bg-orange-500/20", text: "text-orange-400" },
  Auction: { bg: "bg-red-500/20", text: "text-red-400" },
  "Bank-Owned": { bg: "bg-blue-500/20", text: "text-blue-400" },
  "HUD Home": { bg: "bg-purple-500/20", text: "text-purple-400" },
  "Tax Delinquent": { bg: "bg-teal-500/20", text: "text-teal-400" },
};

export const HOME_TOP_NEW_LISTINGS = [
  {
    id: "MI-4421-NW18",
    address: "4421 NW 18th Ave, Miami, FL",
    price: "$312,000",
    category: "Pre-Foreclosure" as HomeListingType,
    added: "Today",
    beds: 3,
    baths: 2,
    sqft: "1,520",
    views: 184,
    source: "County records",
  },
  {
    id: "HI-812-SW9",
    address: "812 SW 9th St, Hialeah, FL",
    price: "$245,500",
    category: "Auction" as HomeListingType,
    added: "Today",
    beds: 2,
    baths: 1,
    sqft: "980",
    views: 142,
    source: "Auction feed",
  },
  {
    id: "MI-2207-CORAL",
    address: "2207 Coral Way, Miami, FL",
    price: "$398,000",
    category: "Bank-Owned" as HomeListingType,
    added: "Today",
    beds: 4,
    baths: 3,
    sqft: "2,100",
    views: 256,
    source: "VA REO (VRM)",
  },
  {
    id: "MI-159-NE62",
    address: "159 NE 62 Ter, Miami, FL",
    price: "$176,900",
    category: "HUD Home" as HomeListingType,
    added: "Today",
    beds: 3,
    baths: 2,
    sqft: "1,340",
    views: 198,
    source: "HUD HomeStore",
  },
  {
    id: "MI-6630-BIRD",
    address: "6630 Bird Rd, Miami, FL",
    price: "$289,000",
    category: "Tax Delinquent" as HomeListingType,
    added: "Today",
    beds: 3,
    baths: 2,
    sqft: "1,680",
    views: 167,
    source: "Tax delinquent feed",
  },
];

export type HomePageView = {
  id: string;
  page: string;
  path: string;
  viewsToday: number;
  viewsWeek: number;
  change: number;
  share: number;
};

export const HOME_PAGE_VIEWS_TODAY = 6240;
export const HOME_PAGE_VIEWS_WEEK = 48320;

/** Public site page views — mock snapshot for admin Home tab. */
export const HOME_PAGE_VIEWS: HomePageView[] = [
  { id: "pv1", page: "Homepage", path: "/", viewsToday: 1842, viewsWeek: 14280, change: 14, share: 29.6 },
  { id: "pv2", page: "HUD Homes", path: "/listing/hud-homes", viewsToday: 986, viewsWeek: 7640, change: 22, share: 15.8 },
  { id: "pv3", page: "Foreclosure Listings", path: "/listing/foreclosure", viewsToday: 812, viewsWeek: 6180, change: 11, share: 12.8 },
  { id: "pv4", page: "Property Search", path: "/listing", viewsToday: 704, viewsWeek: 5420, change: 9, share: 11.2 },
  { id: "pv5", page: "Loans", path: "/loans", viewsToday: 518, viewsWeek: 3910, change: 31, share: 8.1 },
  { id: "pv6", page: "Pre-Foreclosure", path: "/listing/pre-foreclosure", viewsToday: 412, viewsWeek: 3240, change: 7, share: 6.7 },
  { id: "pv7", page: "Auction Properties", path: "/listing/auction", viewsToday: 368, viewsWeek: 2890, change: 5, share: 6.0 },
  { id: "pv8", page: "Bank Owned", path: "/listing/bank-owned", viewsToday: 298, viewsWeek: 2310, change: 4, share: 4.8 },
  { id: "pv9", page: "Contact", path: "/contact", viewsToday: 156, viewsWeek: 1180, change: -3, share: 2.4 },
  { id: "pv10", page: "FAQ & Resources", path: "/faq", viewsToday: 144, viewsWeek: 1270, change: 2, share: 2.6 },
];

export type MemberSavedProperty = { id: string; title: string; price: string; savedAt: string };
export type MemberPostedProperty = { id: string; title: string; price: string; status: string; postedAt: string };
export type MemberPayment = { id: string; date: string; description: string; amount: string; method: string };

export const MOCK_MEMBERS = [
  {
    id: "m1",
    name: "Sarah Mitchell",
    email: "sarah.m@email.com",
    plan: "Pro",
    savedProperties: 4,
    postedProperties: 2,
    totalSpent: "$294",
    joined: "Jan 2025",
    savedList: [
      { id: "HUD-094-123456", title: "3bd HUD — Tampa, FL", price: "$142,000", savedAt: "Jun 3, 2026" },
      { id: "FC-2024-44102", title: "2bd Foreclosure — Cleveland, OH", price: "$67,200", savedAt: "Jun 1, 2026" },
      { id: "VA-REO-8821", title: "4bd Bank Owned — Jacksonville, FL", price: "$98,500", savedAt: "May 28, 2026" },
      { id: "PRE-9921", title: "3bd Pre-Foreclosure — Phoenix, AZ", price: "$189,000", savedAt: "May 20, 2026" },
    ] as MemberSavedProperty[],
    postedList: [
      { id: "MOT-1188", title: "Motivated seller — Nashville, TN", price: "$165,000", status: "Published", postedAt: "Apr 12, 2026" },
      { id: "OFF-2201", title: "Off-market duplex — Charlotte, NC", price: "$203,000", status: "Draft", postedAt: "May 2, 2026" },
    ] as MemberPostedProperty[],
    payments: [
      { id: "p1", date: "Jun 1, 2026", description: "Pro subscription — monthly", amount: "$49", method: "Stripe" },
      { id: "p2", date: "May 1, 2026", description: "Pro subscription — monthly", amount: "$49", method: "Stripe" },
      { id: "p3", date: "Apr 1, 2026", description: "Pro subscription — monthly", amount: "$49", method: "Stripe" },
      { id: "p4", date: "Mar 15, 2026", description: "Property unlock — HUD Tampa", amount: "$9", method: "Stripe" },
      { id: "p5", date: "Mar 1, 2026", description: "Pro subscription — monthly", amount: "$49", method: "Stripe" },
      { id: "p6", date: "Feb 1, 2026", description: "Pro subscription — monthly", amount: "$49", method: "Stripe" },
    ] as MemberPayment[],
  },
  {
    id: "m2",
    name: "Marcus Chen",
    email: "marcus.chen@email.com",
    plan: "Pro",
    savedProperties: 3,
    postedProperties: 0,
    totalSpent: "$441",
    joined: "Mar 2025",
    savedList: [
      { id: "HS-475-019", title: "3bd HomeSteps — Austin, TX", price: "$215,000", savedAt: "Jun 4, 2026" },
      { id: "TAX-4410", title: "Tax delinquent — Kansas City, MO", price: "$54,800", savedAt: "May 30, 2026" },
      { id: "SHER-330", title: "Sheriff's sale — Columbus, OH", price: "$72,400", savedAt: "May 18, 2026" },
    ] as MemberSavedProperty[],
    postedList: [] as MemberPostedProperty[],
    payments: [
      { id: "p1", date: "Jun 1, 2026", description: "Pro subscription — monthly", amount: "$49", method: "Stripe" },
      { id: "p2", date: "May 1, 2026", description: "Pro subscription — monthly", amount: "$49", method: "Stripe" },
      { id: "p3", date: "Apr 22, 2026", description: "Property unlock — Austin HomeSteps", amount: "$9", method: "Stripe" },
      { id: "p4", date: "Apr 1, 2026", description: "Pro subscription — monthly", amount: "$49", method: "Stripe" },
      { id: "p5", date: "Mar 1, 2026", description: "Pro subscription — monthly", amount: "$49", method: "Stripe" },
    ] as MemberPayment[],
  },
  {
    id: "m3",
    name: "James Ortiz",
    email: "j.ortiz@email.com",
    plan: "Per unlock",
    savedProperties: 2,
    postedProperties: 1,
    totalSpent: "$72",
    joined: "May 2025",
    savedList: [
      { id: "AUC-8844", title: "Auction — Atlanta, GA", price: "$124,900", savedAt: "Jun 2, 2026" },
      { id: "GSA-048-2", title: "Government auction — Denver, CO", price: "$310,000", savedAt: "May 25, 2026" },
    ] as MemberSavedProperty[],
    postedList: [
      { id: "MOT-3301", title: "Motivated seller — Orlando, FL", price: "$178,000", status: "Published", postedAt: "May 8, 2026" },
    ] as MemberPostedProperty[],
    payments: [
      { id: "p1", date: "May 28, 2026", description: "Property unlock — Atlanta auction", amount: "$9", method: "Stripe" },
      { id: "p2", date: "May 10, 2026", description: "Property unlock — Orlando off-market", amount: "$9", method: "Stripe" },
      { id: "p3", date: "Apr 3, 2026", description: "Property unlock — Denver GSA", amount: "$9", method: "Stripe" },
    ] as MemberPayment[],
  },
  {
    id: "m4",
    name: "Emily Foster",
    email: "emily.f@email.com",
    plan: "Pro",
    savedProperties: 5,
    postedProperties: 0,
    totalSpent: "$539",
    joined: "Feb 2025",
    savedList: [
      { id: "HUD-094-998812", title: "HUD Home — Las Vegas, NV", price: "$176,500", savedAt: "Jun 3, 2026" },
      { id: "FC-2024-44102", title: "2bd Foreclosure — Cleveland, OH", price: "$67,200", savedAt: "Jun 1, 2026" },
      { id: "VA-REO-8821", title: "4bd Bank Owned — Jacksonville, FL", price: "$98,500", savedAt: "May 29, 2026" },
      { id: "PRE-9921", title: "3bd Pre-Foreclosure — Phoenix, AZ", price: "$189,000", savedAt: "May 22, 2026" },
      { id: "HS-475-019", title: "3bd HomeSteps — Austin, TX", price: "$215,000", savedAt: "May 15, 2026" },
    ] as MemberSavedProperty[],
    postedList: [] as MemberPostedProperty[],
    payments: [
      { id: "p1", date: "Jun 1, 2026", description: "Pro subscription — monthly", amount: "$49", method: "Stripe" },
      { id: "p2", date: "May 1, 2026", description: "Pro subscription — monthly", amount: "$49", method: "Stripe" },
      { id: "p3", date: "Apr 1, 2026", description: "Pro subscription — monthly", amount: "$49", method: "Stripe" },
      { id: "p4", date: "Mar 1, 2026", description: "Pro subscription — monthly", amount: "$49", method: "Stripe" },
      { id: "p5", date: "Feb 1, 2026", description: "Pro subscription — monthly", amount: "$49", method: "Stripe" },
    ] as MemberPayment[],
  },
  {
    id: "m5",
    name: "David Kim",
    email: "david.kim@email.com",
    plan: "Free",
    savedProperties: 1,
    postedProperties: 0,
    totalSpent: "$0",
    joined: "Jun 2026",
    savedList: [
      { id: "HUD-094-123456", title: "3bd HUD — Tampa, FL", price: "$142,000", savedAt: "Jun 4, 2026" },
    ] as MemberSavedProperty[],
    postedList: [] as MemberPostedProperty[],
    payments: [] as MemberPayment[],
  },
];

export const MOCK_EMAIL_CAMPAIGNS = [
  { id: "e1", subject: "New HUD listings in Florida", audience: "Pro members — FL", status: "Sent", sentAt: "Today 9:00 AM", opens: "42%", recipients: 318 },
  { id: "e2", subject: "Your saved search: Tampa foreclosures", audience: "Saved search alerts", status: "Scheduled", sentAt: "Tomorrow 8:00 AM", opens: "—", recipients: 124 },
  { id: "e3", subject: "Welcome to REOVANA Pro", audience: "New Pro signups", status: "Automated", sentAt: "On signup", opens: "68%", recipients: 86 },
  { id: "e4", subject: "Weekly distressed property digest", audience: "All subscribers", status: "Draft", sentAt: "—", opens: "—", recipients: 1240 },
  { id: "e5", subject: "Auction ending soon — Atlanta, GA", audience: "Saved auction alerts", status: "Sent", sentAt: "Yesterday 6:00 PM", opens: "51%", recipients: 89 },
  { id: "e6", subject: "Tax delinquent deals in Missouri", audience: "Pro members — MO", status: "Sent", sentAt: "Jun 2, 2026", opens: "38%", recipients: 42 },
];

export const EMAIL_SUMMARY_STATS = {
  sentThisMonth: MOCK_EMAIL_CAMPAIGNS.filter((c) => c.status === "Sent").length,
  scheduled: MOCK_EMAIL_CAMPAIGNS.filter((c) => c.status === "Scheduled").length,
  avgOpenRate: "54%",
};
