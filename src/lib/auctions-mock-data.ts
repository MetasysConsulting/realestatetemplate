export type AuctionProperty = {
  id: string;
  isNew: boolean;
  openingBid: number;
  tags: string[];
  category: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  beds: number;
  baths: number;
  sqft: number;
  auctionDate: string;
  auctionTime: string;
  status: string;
  lat: number;
  lng: number;
};

export type MapCluster = {
  id: string;
  label: string;
  top: string;
  left: string;
  size: "sm" | "md" | "lg";
};

export const MOCK_AUCTION_PROPERTIES: AuctionProperty[] = [
  {
    id: "1",
    isNew: true,
    openingBid: 225040,
    tags: ["Cash Only", "No Buyers Premium"],
    category: "Foreclosure Homes — In Person Auction",
    address: "27041 Edgewood St",
    city: "Bonita Springs",
    state: "FL",
    zip: "34135",
    beds: 3,
    baths: 2,
    sqft: 1842,
    auctionDate: "Jun 12, 2026",
    auctionTime: "10:00 AM ET",
    status: "Auction Event: Live Event",
    lat: 26.34,
    lng: -81.78,
  },
  {
    id: "2",
    isNew: true,
    openingBid: 189500,
    tags: ["Bank Owned"],
    category: "Bank Owned — Online Auction",
    address: "1842 Palm Harbor Blvd",
    city: "Tampa",
    state: "FL",
    zip: "33615",
    beds: 4,
    baths: 2,
    sqft: 2100,
    auctionDate: "Jun 14, 2026",
    auctionTime: "2:00 PM ET",
    status: "Auction Event: Live Event",
    lat: 27.95,
    lng: -82.66,
  },
  {
    id: "3",
    isNew: false,
    openingBid: 312800,
    tags: ["Short Sale"],
    category: "Short Sale — Sealed Bid",
    address: "905 Willow Creek Dr",
    city: "Austin",
    state: "TX",
    zip: "78745",
    beds: 3,
    baths: 2,
    sqft: 1654,
    auctionDate: "Jun 18, 2026",
    auctionTime: "11:30 AM CT",
    status: "Auction Event: Upcoming",
    lat: 30.22,
    lng: -97.79,
  },
  {
    id: "4",
    isNew: true,
    openingBid: 142750,
    tags: ["2nd Chance", "Cash Only"],
    category: "2nd Chance Foreclosure — Online",
    address: "4410 Oak Meadow Ln",
    city: "Houston",
    state: "TX",
    zip: "77084",
    beds: 3,
    baths: 1,
    sqft: 1288,
    auctionDate: "Jun 20, 2026",
    auctionTime: "9:00 AM CT",
    status: "Auction Event: Live Event",
    lat: 29.79,
    lng: -95.65,
  },
  {
    id: "5",
    isNew: false,
    openingBid: 278900,
    tags: ["Commercial"],
    category: "Commercial — In Person Auction",
    address: "120 Commerce Park Rd",
    city: "Phoenix",
    state: "AZ",
    zip: "85034",
    beds: 0,
    baths: 2,
    sqft: 4200,
    auctionDate: "Jun 22, 2026",
    auctionTime: "1:00 PM MT",
    status: "Auction Event: Upcoming",
    lat: 33.45,
    lng: -112.07,
  },
  {
    id: "6",
    isNew: true,
    openingBid: 96500,
    tags: ["Non-Bank Owned"],
    category: "All Auction Homes — Online",
    address: "78 Birchwood Ave",
    city: "Cleveland",
    state: "OH",
    zip: "44109",
    beds: 2,
    baths: 1,
    sqft: 980,
    auctionDate: "Jun 25, 2026",
    auctionTime: "10:00 AM ET",
    status: "Auction Event: Live Event",
    lat: 41.48,
    lng: -81.69,
  },
  {
    id: "7",
    isNew: false,
    openingBid: 415200,
    tags: ["No Buyers Premium"],
    category: "Foreclosure Homes — Online Auction",
    address: "2109 Lakeview Terrace",
    city: "Denver",
    state: "CO",
    zip: "80219",
    beds: 4,
    baths: 3,
    sqft: 2450,
    auctionDate: "Jun 28, 2026",
    auctionTime: "12:00 PM MT",
    status: "Auction Event: Upcoming",
    lat: 39.69,
    lng: -105.03,
  },
  {
    id: "8",
    isNew: true,
    openingBid: 156300,
    tags: ["Cash Only"],
    category: "Bank Owned — In Person Auction",
    address: "553 Pinecrest Rd",
    city: "Atlanta",
    state: "GA",
    zip: "30331",
    beds: 3,
    baths: 2,
    sqft: 1512,
    auctionDate: "Jul 2, 2026",
    auctionTime: "11:00 AM ET",
    status: "Auction Event: Live Event",
    lat: 33.72,
    lng: -84.49,
  },
  {
    id: "9",
    isNew: false,
    openingBid: 198600,
    tags: ["Short Sale", "Cash Only"],
    category: "Short Sale — Online Auction",
    address: "334 Harbor View Ct",
    city: "Jacksonville",
    state: "FL",
    zip: "32207",
    beds: 3,
    baths: 2,
    sqft: 1720,
    auctionDate: "Jul 5, 2026",
    auctionTime: "3:00 PM ET",
    status: "Auction Event: Upcoming",
    lat: 30.29,
    lng: -81.62,
  },
  {
    id: "10",
    isNew: true,
    openingBid: 267400,
    tags: ["Bank Owned"],
    category: "All Auction Homes — In Person Auction",
    address: "8901 Desert Sage Way",
    city: "Las Vegas",
    state: "NV",
    zip: "89123",
    beds: 4,
    baths: 2,
    sqft: 1988,
    auctionDate: "Jul 8, 2026",
    auctionTime: "10:30 AM PT",
    status: "Auction Event: Live Event",
    lat: 36.03,
    lng: -115.12,
  },
];

export const MOCK_MAP_CLUSTERS: MapCluster[] = [
  { id: "c1", label: "190", top: "28%", left: "22%", size: "md" },
  { id: "c2", label: "71", top: "35%", left: "38%", size: "sm" },
  { id: "c3", label: "1,104", top: "42%", left: "52%", size: "lg" },
  { id: "c4", label: "326", top: "55%", left: "44%", size: "md" },
  { id: "c5", label: "88", top: "48%", left: "28%", size: "sm" },
  { id: "c6", label: "412", top: "62%", left: "58%", size: "md" },
  { id: "c7", label: "156", top: "38%", left: "68%", size: "sm" },
];

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
