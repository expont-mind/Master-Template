"use client";

import { BRAND } from "@/lib/utils/brand-config";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SocialLink } from "@/types/database";
import {
  AppStore,
  FaceBookBlack,
  InstagramBlack,
  MonpangBig,
  PlayStore,
  YoutubeBlack,
} from "../svg";
import Link from "next/link";

const HIDDEN_ROUTES = [
  "/cart",
  "/checkout",
  "/profile",
  "/events",
  "/articles",
  "/faq",
];

// Map platform names to icon components
const platformIcons: Record<string, React.FC<{ className?: string }>> = {
  facebook: FaceBookBlack,
  instagram: InstagramBlack,
  youtube: YoutubeBlack,
};

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
  const isProductDetailPage =
    pathname.startsWith("/products/") && pathname !== "/products";

  return (
    <div
      className={`w-full bg-[#F8FAFC] flex justify-center ${isProductDetailPage ? "mb-[81px] md:mb-0" : ""}`}
    >
      <div className="flex flex-col gap-12 md:gap-16 max-w-[1064px] w-full px-4 xl:px-0 py-12 sm:py-16 md:py-20">
        <div className="flex flex-col md:flex-row md:justify-between gap-12 md:gap-0">
          <div className="flex flex-col gap-8 max-w-[440px] w-full">
            <MonpangBig />
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <p className="text-[#020617] font-bold text-sm font-manrope">
                  Хаяг:
                </p>
                <p className="text-[#020617] font-normal text-sm font-manrope leading-relaxed">
                  Монгол Улс, Улаанбаатар хот, СБД, 3-р хороо, 5-р хороолол,
                  Усны гудамж, Санто таур 4 давхар, 405 тоот
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[#020617] font-bold text-sm font-manrope">
                  Утас:
                </p>
                <div className="flex flex-col">
                  <a
                    href="tel:+97677710900"
                    className="text-[#020617] font-normal text-sm font-manrope underline underline-offset-2"
                  >
                    +976 77710900
                  </a>
                  <a
                    href="mailto:au@corelandmark.com"
                    className="text-[#020617] font-normal text-sm font-manrope underline underline-offset-2"
                  >
                    au@corelandmark.com
                  </a>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              {socialLinks.length > 0 ? (
                socialLinks.map((link) => {
                  const IconComponent =
                    platformIcons[link.platform.toLowerCase()];
                  if (!IconComponent) return null;
                  return (
                    <Link
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-80 transition-opacity"
                    >
                      <IconComponent />
                    </Link>
                  );
                })
              ) : (
                <>
                  <FaceBookBlack />
                  <InstagramBlack />
                  <YoutubeBlack />
                </>
              )}
              {!socialLinks.some(
                (link) => link.platform.toLowerCase() === "instagram",
              ) && (
                <Link
                  href="https://www.instagram.com/monpang.mn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <InstagramBlack />
                </Link>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-12 md:gap-20">
            <div className="flex flex-col gap-4">
              <p className="text-[#020617] font-bold text-sm sm:text-base font-manrope">
                Мэдээлэл
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/articles"
                  className="text-[#64748B] font-medium text-sm font-manrope hover:text-[#020617] transition-colors duration-200"
                >
                  Нийтлэл
                </Link>
                <Link
                  href="/events"
                  className="text-[#64748B] font-medium text-sm font-manrope hover:text-[#020617] transition-colors duration-200"
                >
                  Эвэнт
                </Link>
                <Link
                  href="/faq"
                  className="text-[#64748B] font-medium text-sm font-manrope hover:text-[#020617] transition-colors duration-200"
                >
                  Түгээмэл асуулт
                </Link>
                <Link
                  href="/profile?tab=branches"
                  className="text-[#64748B] font-medium text-sm font-manrope hover:text-[#020617] transition-colors duration-200"
                >
                  Салбарууд
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <p className="text-[#020617] font-bold text-sm sm:text-base font-manrope">
                {BRAND.name} app тун удахгүй
              </p>
              <div className="flex gap-2 md:gap-3">
                <AppStore />
                <PlayStore />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-6 pb-4 md:pb-0">
          <div className="py-2">
            <div className="w-full h-px bg-[#E2E8F0]" />
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-8 sm:gap-0">
            <p className="text-[#64748B] font-medium text-xs sm:text-sm font-manrope order-2 sm:order-1">
              © 2026 {BRAND.name}.com. All rights reserved.
            </p>
            <div className="flex flex-col md:flex-row flex-wrap gap-4 sm:gap-6 order-1 sm:order-2">
              <Link
                href="/privacy-policy"
                className="text-[#64748B] font-medium text-xs sm:text-sm font-manrope underline underline-offset-2"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-of-service"
                className="text-[#64748B] font-medium text-xs sm:text-sm font-manrope underline underline-offset-2"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
