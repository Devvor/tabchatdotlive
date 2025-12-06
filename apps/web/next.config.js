/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@learnor/ui"],
  images: {
    domains: ["img.clerk.com", "images.clerk.dev"],
  },
};

module.exports = nextConfig;

