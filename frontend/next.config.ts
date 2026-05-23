import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  turbopack: {},
  webpack: (config: any) => {
    config.externals = config.externals || [];
    return config;
  },
};

export default nextConfig;
