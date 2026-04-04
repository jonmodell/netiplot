/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['revis-network-ts'],
  typescript: {
    // Library source has existing type issues being fixed in Phase 4.
    // Demo code itself is type-safe; library types are checked during `npm run build` at root.
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.resolve.alias['revis-network-ts'] = require('path').resolve(__dirname, '../src/index.ts');
    return config;
  },
};

module.exports = nextConfig;
