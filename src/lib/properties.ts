export type Property = {
  id: string;
  title: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  sqft: number;
  image: string;
  tags: string[];
  featured?: boolean;
};

export const properties: Property[] = [
  {
    id: "1",
    title: "Elegant studio flat",
    location: "102 Ingraham St, Brooklyn, NY 11237",
    price: "$8,600",
    beds: 3,
    baths: 3,
    sqft: 4043,
    image: "/images/section/box-house.jpg",
    tags: ["Featured", "For Sale"],
    featured: true,
  },
  {
    id: "2",
    title: "Modern waterfront villa",
    location: "88 Ocean Drive, Honolulu, HI 96815",
    price: "$2,450,000",
    beds: 4,
    baths: 3,
    sqft: 3200,
    image: "/images/section/box-house-2.jpg",
    tags: ["Featured", "For Sale"],
    featured: true,
  },
  {
    id: "3",
    title: "Luxury penthouse suite",
    location: "1200 Ala Moana Blvd, Honolulu, HI 96814",
    price: "$1,890,000",
    beds: 3,
    baths: 2,
    sqft: 2100,
    image: "/images/section/box-house-3.jpg",
    tags: ["For Rent"],
  },
  {
    id: "4",
    title: "Tropical garden estate",
    location: "45 Kahala Ave, Honolulu, HI 96816",
    price: "$5,200,000",
    beds: 5,
    baths: 4,
    sqft: 5800,
    image: "/images/section/box-house-4.jpg",
    tags: ["Featured", "For Sale"],
  },
  {
    id: "5",
    title: "Coastal family home",
    location: "210 Kailua Rd, Kailua, HI 96734",
    price: "$1,275,000",
    beds: 4,
    baths: 3,
    sqft: 2800,
    image: "/images/section/box-house-5.jpg",
    tags: ["For Sale"],
  },
  {
    id: "6",
    title: "Downtown loft with views",
    location: "500 Ala Moana Blvd, Honolulu, HI 96813",
    price: "$925,000",
    beds: 2,
    baths: 2,
    sqft: 1450,
    image: "/images/section/box-house.jpg",
    tags: ["For Sale"],
  },
];

export function getPropertyById(id: string): Property | undefined {
  return properties.find((p) => p.id === id);
}
