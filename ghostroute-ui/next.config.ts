import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force webpack instead of turbopack
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
          cluster: false,
        },
      };
    }
    
    // Completely ignore worker_modules that cause issues
    config.externals = config.externals || [];
    config.externals.push(
      'worker_threads',
      'cluster',
      'node:worker_threads',
      'node:cluster'
    );
    
    // Fix for Noir/WebAssembly modules
    config.resolve.alias = {
      ...config.resolve.alias,
      'worker_threads': false,
      'node:worker_threads': false,
      'cluster': false,
      'node:cluster': false,
    };
    
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
