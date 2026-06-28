/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@vora/ui', '@vora/types', '@vora/api-client', '@vora/validation'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
