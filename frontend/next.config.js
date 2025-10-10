/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed standalone output for proper API routes support
  experimental: {
    outputFileTracingRoot: undefined,
  },
};

module.exports = nextConfig;
