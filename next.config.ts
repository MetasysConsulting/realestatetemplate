import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/buy/hud-home/:caseNumber", destination: "/properties/hud-home/:caseNumber" },
      { source: "/buy/hud-home", destination: "/properties/hud-home" },
      { source: "/buy/bank-owned/:listingId", destination: "/properties/bank-owned/:listingId" },
      { source: "/buy/auction-property/:listingId", destination: "/properties/auction-property/:listingId" },
      { source: "/buy/:category/:listingId", destination: "/properties/:category/:listingId" },
      { source: "/buy/:category", destination: "/properties/:category" },
    ];
  },
  async redirects() {
    return [
      { source: "/properties", destination: "/buy/foreclosure", permanent: true },
      { source: "/properties/:path*", destination: "/buy/:path*", permanent: true },
      { source: "/listing/:path*", destination: "/buy/bank-owned", permanent: false },
      { source: "/property/detail/:path*", destination: "/buy/bank-owned", permanent: false },
      { source: "/home/:path*", destination: "/", permanent: false },
      { source: "/blog", destination: "/learn/guides/beginners-guide", permanent: false },
      { source: "/blog/grid", destination: "/learn/guides/beginners-guide", permanent: false },
      { source: "/faq", destination: "/learn/faq", permanent: false },
      { source: "/home", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
