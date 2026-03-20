/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'image.pollinations.ai' }],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        'fs/promises': false,
        dns: false,
        child_process: false,
      };
      // Stub out ALL protobufjs sub-packages that break browser builds
      config.resolve.alias = {
        ...config.resolve.alias,
        '@protobufjs/codegen': false,
        '@protobufjs/fetch':   false,
        '@protobufjs/aspromise': false,
        '@protobufjs/base64':  false,
        '@protobufjs/eventemitter': false,
        '@protobufjs/float':   false,
        '@protobufjs/inquire': false,
        '@protobufjs/path':    false,
        '@protobufjs/pool':    false,
        '@protobufjs/utf8':    false,
      };
    }
    return config;
  },
};

export default nextConfig;
