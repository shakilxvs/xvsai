/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'image.pollinations.ai' }],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fix Firebase Firestore protobufjs issue in browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        'fs/promises': false,
      };
    }
    // Ignore the @protobufjs/codegen warning
    config.resolve.alias = {
      ...config.resolve.alias,
      '@protobufjs/codegen': false,
    };
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },
};

export default nextConfig;
