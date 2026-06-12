"use client";

import { SITE } from "@repo/config-site";
import Link from "next/link";

import {
  AppStore,
  FaceBookBlack,
  InstagramBlack,
  MonpangBig,
  PlayStore,
  YoutubeBlack,
} from "@/components/svg";
import { BRAND } from "@/lib/utils/brand-config";

import type { SocialLink } from "@/types/database";

const platformIcons: Record<string, React.FC<{ className?: string }>> = {
  facebook: FaceBookBlack,
  instagram: InstagramBlack,
  youtube: YoutubeBlack,
};

function SocialLinksRow({ socialLinks }: { socialLinks: SocialLink[] }) {
  const hasInstagram = socialLinks.some((link) => link.platform.toLowerCase() === "instagram");

  return (
    <div className="flex gap-3">
      {socialLinks.length > 0 ? (
        socialLinks.map((link) => {
          const IconComponent = platformIcons[link.platform.toLowerCase()];
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
      {!hasInstagram && (
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
  );
}

export function FooterContactColumn({ socialLinks }: { socialLinks: SocialLink[] }) {
  return (
    <div className="flex flex-col gap-8 max-w-[440px] w-full">
      <MonpangBig />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-text-primary font-bold text-sm font-manrope">Хаяг:</p>
          <p className="text-text-primary font-normal text-sm font-manrope leading-relaxed">
            {SITE.contact.address}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-text-primary font-bold text-sm font-manrope">Утас:</p>
          <div className="flex flex-col">
            <a
              href={`tel:${SITE.contact.phone.replace(/\s+/g, "")}`}
              className="text-text-primary font-normal text-sm font-manrope underline underline-offset-2"
            >
              {SITE.contact.phone}
            </a>
            <a
              href={`mailto:${SITE.contact.email}`}
              className="text-text-primary font-normal text-sm font-manrope underline underline-offset-2"
            >
              {SITE.contact.email}
            </a>
          </div>
        </div>
      </div>
      <SocialLinksRow socialLinks={socialLinks} />
    </div>
  );
}

export function FooterInfoColumn() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-text-primary font-bold text-sm sm:text-base font-manrope">Мэдээлэл</p>
      <div className="flex flex-col gap-3">
        {SITE.features.articles && (
          <Link
            href="/articles"
            className="text-text-secondary font-medium text-sm font-manrope hover:text-text-primary transition-colors duration-200"
          >
            Нийтлэл
          </Link>
        )}
        {SITE.features.events && (
          <Link
            href="/events"
            className="text-text-secondary font-medium text-sm font-manrope hover:text-text-primary transition-colors duration-200"
          >
            Эвэнт
          </Link>
        )}
        <Link
          href="/faq"
          className="text-text-secondary font-medium text-sm font-manrope hover:text-text-primary transition-colors duration-200"
        >
          Түгээмэл асуулт
        </Link>
        <Link
          href="/profile?tab=branches"
          className="text-text-secondary font-medium text-sm font-manrope hover:text-text-primary transition-colors duration-200"
        >
          Салбарууд
        </Link>
      </div>
    </div>
  );
}

export function FooterAppColumn() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-text-primary font-bold text-sm sm:text-base font-manrope">
        {BRAND.name} app тун удахгүй
      </p>
      <div className="flex gap-2 md:gap-3">
        <AppStore />
        <PlayStore />
      </div>
    </div>
  );
}

export function FooterBottomBar() {
  return (
    <div className="flex flex-col gap-6 pb-4 md:pb-0">
      <div className="py-2">
        <div className="w-full h-px bg-border" />
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-between gap-8 sm:gap-0">
        <p className="text-text-secondary font-medium text-xs sm:text-sm font-manrope order-2 sm:order-1">
          © 2026 {BRAND.name}.com. All rights reserved.
        </p>
        <div className="flex flex-col md:flex-row flex-wrap gap-4 sm:gap-6 order-1 sm:order-2">
          <Link
            href="/privacy-policy"
            className="text-text-secondary font-medium text-xs sm:text-sm font-manrope underline underline-offset-2"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms-of-service"
            className="text-text-secondary font-medium text-xs sm:text-sm font-manrope underline underline-offset-2"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
