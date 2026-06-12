import type { NextConfig } from "next";

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
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
