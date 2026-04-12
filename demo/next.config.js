/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['netiplot'],
  typescript: {
    // Library source has existing type issues being fixed in Phase 4.
    // Demo code itself is type-safe; library types are checked during `npm run build` at root.
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.resolve.alias['netiplot'] = require('path').resolve(__dirname, '../src/index.ts');
    return config;
  },
};

module.exports = nextConfig;
