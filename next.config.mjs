/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "diligent-iguana-318.convex.cloud",
      },
    ],
  },
};

export default nextConfig;
