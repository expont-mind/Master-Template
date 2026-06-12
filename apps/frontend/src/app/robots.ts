import { MetadataRoute } from "next";

import { BASE_URL } from "@/lib/utils/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/", "/cart", "/checkout", "/profile", "/wishlist"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
