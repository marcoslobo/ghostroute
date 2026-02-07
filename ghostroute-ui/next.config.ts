import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
          crypto: require.resolve('crypto-browserify'),
          stream: require.resolve('stream-browserify'),
          zlib: require.resolve('browserify-zlib'),
          util: require.resolve('util'),
          buffer: require.resolve('buffer'),
          process: require.resolve('process/browser'),
          worker_threads: false,
          path: false,
          os: false,
          child_process: false,
        },
      };
    }
    
    // Fix for Noir/WebAssembly modules in Vercel
    config.resolve.alias = {
      ...config.resolve.alias,
      'worker_threads': false,
    };
    
    // Ignore worker_modules that cause issues in production
    config.externals = config.externals || [];
    config.externals.push({
      'worker_threads': 'worker_threads',
    });
    
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },

};

export default nextConfig;
