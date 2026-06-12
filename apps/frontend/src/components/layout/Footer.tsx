"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import {
  FooterAppColumn,
  FooterBottomBar,
  FooterContactColumn,
  FooterInfoColumn,
} from "./_FooterSections";

import type { SocialLink } from "@/types/database";

const HIDDEN_ROUTES = ["/cart", "/checkout", "/profile", "/events", "/articles", "/faq"];

export const Footer = () => {
  const pathname = usePathname();
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    const fetchSocialLinks = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("social_links")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (data) {
        setSocialLinks(data);
      }
    };

    fetchSocialLinks();
  }, []);

  // Hide footer on cart, checkout, and profile pages
  const shouldHide = HIDDEN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (shouldHide) return null;

  // Check if on product detail page (has fixed bottom bar on mobile)
  const isProductDetailPage = pathname.startsWith("/products/") && pathname !== "/products";

  return (
    <div
      className={`w-full bg-surface flex justify-center ${
        isProductDetailPage ? "mb-[81px] md:mb-0" : ""
      }`}
    >
      <div className="flex flex-col gap-12 md:gap-16 max-w-[1064px] w-full px-4 xl:px-0 py-12 sm:py-16 md:py-20">
        <div className="flex flex-col md:flex-row md:justify-between gap-12 md:gap-0">
          <FooterContactColumn socialLinks={socialLinks} />
          <div className="flex flex-col sm:flex-row gap-12 md:gap-20">
            <FooterInfoColumn />
            <FooterAppColumn />
          </div>
        </div>
        <FooterBottomBar />
      </div>
    </div>
  );
};
