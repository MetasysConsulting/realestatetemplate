import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/properties", destination: "/buy/foreclosure", permanent: true },
      { source: "/properties/:path*", destination: "/buy/:path*", permanent: true },
      { source: "/listing/:path*", destination: "/buy/bank-owned", permanent: false },
      { source: "/home/:path*", destination: "/", permanent: false },
      { source: "/blog", destination: "/learn/guides/beginners-guide", permanent: false },
      { source: "/blog/grid", destination: "/learn/guides/beginners-guide", permanent: false },
      { source: "/faq", destination: "/learn/faq", permanent: false },
      { source: "/home", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
