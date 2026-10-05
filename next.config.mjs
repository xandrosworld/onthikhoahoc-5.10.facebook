/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    '/**': ['./prisma/demo.db', './uploads/**/*', './node_modules/.prisma/client/**/*'],
  },
  experimental: { serverActions: { bodySizeLimit: '4mb' } },
};
export default nextConfig;
