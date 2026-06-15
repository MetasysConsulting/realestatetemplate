export type HomeNeighborhood = {
  id: string;
  city: string;
  count: string;
  imageUrl: string;
};

export const HOME_NEIGHBORHOODS: HomeNeighborhood[] = [
  {
    id: "tampa",
    city: "Tampa, Florida",
    count: "1,842",
    imageUrl: "/images/neighborhoods/tampa-florida.jpg",
  },
  {
    id: "austin",
    city: "Austin, Texas",
    count: "2,156",
    imageUrl: "/images/neighborhoods/austin-texas.jpg",
  },
  {
    id: "phoenix",
    city: "Phoenix, Arizona",
    count: "1,973",
    imageUrl: "/images/neighborhoods/phoenix-arizona.jpg",
  },
  {
    id: "denver",
    city: "Denver, Colorado",
    count: "1,508",
    imageUrl: "/images/neighborhoods/denver-colorado.jpg",
  },
  {
    id: "atlanta",
    city: "Atlanta, Georgia",
    count: "2,304",
    imageUrl: "/images/neighborhoods/atlanta-georgia.jpg",
  },
  {
    id: "houston",
    city: "Houston, Texas",
    count: "2,617",
    imageUrl: "/images/neighborhoods/houston-texas.jpg",
  },
  {
    id: "cleveland",
    city: "Cleveland, Ohio",
    count: "1,126",
    imageUrl: "/images/neighborhoods/cleveland-ohio.jpg",
  },
  {
    id: "miami",
    city: "Miami, Florida",
    count: "1,894",
    imageUrl: "/images/neighborhoods/miami-florida.jpg",
  },
];

export const HOME_NEIGHBORHOOD_ROWS = [
  HOME_NEIGHBORHOODS.slice(0, 4),
  HOME_NEIGHBORHOODS.slice(4, 8),
];
