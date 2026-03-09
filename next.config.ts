import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Enable WASM support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Suppress Three.js canvas warnings in server builds
    if (isServer) {
      config.externals = [...(config.externals || []), "canvas"];
    }

    return config;
  },
};

export default nextConfig;
