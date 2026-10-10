import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@sperad/shared', '@sperad/engine', '@sperad/database'],
  reactStrictMode: true
};

export default nextConfig;
