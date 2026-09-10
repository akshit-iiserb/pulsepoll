/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  // Webpack fallback for non-turbopack builds
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
