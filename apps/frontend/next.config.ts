import type { NextConfig } from "next";

const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://monpang-admin.vercel.app";
const supabaseHost = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return "qtpfavodqjyosdnxjwjq.supabase.co";
  try {
    return new URL(url).hostname;
  } catch {
    return "qtpfavodqjyosdnxjwjq.supabase.co";
  }
})();

const nextConfig: NextConfig = {
  // Anchor Turbopack to the monorepo root so stale lockfiles in the user's home
  // directory don't confuse workspace detection.
  turbopack: {
    root: "../..",
  },
  transpilePackages: [
    "@repo/config-brand",
    "@repo/config-site",
    "@repo/ui-utils",
    "@repo/supabase",
    "@repo/db-types",
    "@repo/logger",
    "@repo/theme",
  ],
  images: {
    minimumCacheTTL: 2678400,
    formats: ["image/webp"],
    deviceSizes: [640, 1080, 1920],
    imageSizes: [16, 32, 64, 128, 256, 512],
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
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
        destination: `${adminUrl}/:path*`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
