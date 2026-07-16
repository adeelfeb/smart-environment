/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  
  // Ensure dynamic routes are handled at runtime, not during build
  // Dynamic routes with getServerSideProps will be server-rendered
  
  // Generate stable build ID to prevent cache issues
  // Using a stable ID based on environment or timestamp only for production builds
  generateBuildId: async () => {
    // For production, use a timestamp-based ID
    // For deployments, this ensures consistent builds
    if (process.env.NODE_ENV === 'production') {
      // Use commit hash if available (from Vercel or CI), otherwise use timestamp
      const commitHash = process.env.VERCEL_GIT_COMMIT_SHA || 
                        process.env.GIT_COMMIT_SHA || 
                        process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA;
      if (commitHash) {
        return commitHash.substring(0, 12); // Use first 12 chars of commit hash
      }
      return 'build-' + Date.now();
    }
    // For dev, use a fixed ID to improve caching
    return 'dev-build';
  },

  // Build optimizations for faster builds
  // Note: SWC minification is enabled by default in Next.js 15
  compiler: {
    // Remove console logs in production for smaller bundle
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Enable experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['ag-grid-community', 'ag-grid-react'],
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },

  webpack: (config, { isServer, dev }) => {
    // Suppress webpack cache serialization warnings and autoprefixer warnings
    config.ignoreWarnings = [
      {
        module: /node_modules\/ag-grid-community/,
      },
      {
        message: /autoprefixer/,
      },
      {
        message: /No serializer registered for Warning/,
      },
      {
        message: /end value has mixed support/,
      },
    ];

    // Improved cache handling to prevent intermittent build issues
    // Next.js 15 has better built-in cache handling, but we ensure consistency
    if (dev) {
      // In dev mode, use webpack's default caching (Next.js handles it)
      // Don't override to prevent conflicts
    } else {
      // Production: Use filesystem cache for both server and client
      // This improves build reliability and prevents _document not found issues
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        cacheDirectory: path.join(process.cwd(), '.next', 'cache', 'webpack'),
        // Ensure cache is properly invalidated on config changes
        maxMemoryGenerations: 1,
      };
    }
    
    // Ensure we don't interfere with Next.js's internal chunking
    // Next.js handles chunk splitting automatically and optimally

    // Reduce infrastructure logging to suppress cache warnings (production only)
    if (!isServer && !dev) {
      config.infrastructureLogging = {
        level: 'error',
      };
    }

    return config;
  },

  // Suppress build warnings in console
  logging: {
    fetches: {
      fullUrl: false,
    },
  },

  // Production optimizations
  poweredByHeader: false, // Remove X-Powered-By header
  compress: true, // Enable gzip compression
}

module.exports = nextConfig

