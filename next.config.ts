import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.pollinations.ai",
        pathname: "/prompt/**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/properties", destination: "/listing/grid-full-width", permanent: false },
      { source: "/blog", destination: "/blog/grid", permanent: false },
      { source: "/home", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
