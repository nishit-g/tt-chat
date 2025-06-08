import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig:NextConfig = {
  experimental: {
    // Enable latest features
    serverComponentsExternalPackages: ['dexie'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fal.media',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
  },
  // Enable Turbopack for development
  transpilePackages: ['ai'],
};

module.exports = nextConfig;
