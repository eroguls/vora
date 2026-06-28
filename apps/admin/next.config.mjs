/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/admin',
  transpilePackages: ['@vora/ui', '@vora/api-client'],
  experimental: { optimizePackageImports: ['lucide-react'] },
};

export default nextConfig;
