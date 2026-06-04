import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/properties", destination: "/listing/grid-full-width", permanent: false },
      { source: "/blog", destination: "/blog/grid", permanent: false },
      { source: "/home", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
