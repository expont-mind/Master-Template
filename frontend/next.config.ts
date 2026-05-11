import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    minimumCacheTTL: 2678400,
    formats: ["image/webp"],
    deviceSizes: [640, 1080, 1920],
    imageSizes: [16, 32, 64, 128, 256, 512],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qtpfavodqjyosdnxjwjq.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/*/image/upload/**",
      },
      {
        protocol: "https",
        hostname: "cdn.zochil.shop",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/admin/:path*",
        destination: "https://monpang-admin.vercel.app/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
