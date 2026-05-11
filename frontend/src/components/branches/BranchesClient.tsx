"use client";

import Image from "next/image";
import { LocationProfile, Slash } from "@/components/svg";
import type { Branch } from "@/types/database";
import Link from "next/link";
import { CalendarBranch } from "../svg/CalendarBranch";
import { MailBranch } from "../svg/MailBranch";
import { PhoneBranch } from "../svg/PhoneBranch";

interface BranchCardProps {
  branch: Branch;
}

function BranchCard({ branch }: BranchCardProps) {
  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-11">
      {/* Image */}
      {branch.image_url && (
        <div className="w-full md:w-[474px] h-[316px] shrink-0 relative">
          <Image
            src={branch.image_url}
            alt={branch.name}
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 474px"
            quality={75}
          />
        </div>
      )}

      {/* Details */}
      <div className="flex flex-col gap-4 py-1">
        <p className="text-[#020617] font-bold text-xl leading-7 font-manrope">
          {branch.name}
        </p>

        {/* Phone */}
        {branch.phone && (
          <div className="flex items-center gap-5">
            <div className="py-1">
              <PhoneBranch />
            </div>
            <Link
              href={`tel:${branch.phone}`}
              className="text-[#020617] font-medium text-base font-manrope hover:text-[#0588F0] transition-colors"
            >
              {branch.phone}
            </Link>
          </div>
        )}

        {/* Email */}
        {branch.email && (
          <div className="flex items-center gap-5">
            <div className="py-1">
              <MailBranch />
            </div>
            <a
              href={`mailto:${branch.email}`}
              className="text-[#020617] font-medium text-base font-manrope hover:text-[#0588F0] transition-colors"
            >
              {branch.email}
            </a>
          </div>
        )}

        {/* Working Hours */}
        {(branch.weekday_hours || branch.weekend_hours) && (
          <div className="flex items-start gap-5">
            <div className="py-1">
              <CalendarBranch />
            </div>
            <div className="flex flex-col gap-0.5">
              {branch.weekday_hours && (
                <span className="text-[#020617] font-medium text-base font-manrope">
                  {branch.weekday_hours}
                </span>
              )}
              {branch.weekend_hours && (
                <span className="text-[#020617] font-medium text-base font-manrope">
                  {branch.weekend_hours}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Address */}
        {branch.address && (
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-5">
              <div className="py-1">
                <LocationProfile />
              </div>
              <p className="text-[#020617] font-medium text-base font-manrope whitespace-pre-line">
                {branch.address}
              </p>
            </div>
            {branch.google_maps_url && (
              <Link
                href={branch.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0588F0] font-normal text-base font-manrope underline underline-offset-2 decoration-0 ml-11 px-0.5"
              >
                Google maps дээр харах
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface BranchesClientProps {
  branches: Branch[];
}

export function BranchesClient({ branches }: BranchesClientProps) {
  return (
    <div className="w-full bg-white flex justify-center">
      <div className="flex flex-col gap-4 md:gap-2 max-w-[1064px] w-full pb-[52px] px-4 py-5 md:px-0 md:py-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 px-px md:px-0.5">
            <div className="flex items-center gap-1.5 md:hidden">
              <Link
                href="/profile"
                className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
              >
                Профайл
              </Link>
              <Slash />
            </div>
            <Link
              href="/profile?tab=settings"
              className="text-slate-500 text-sm font-normal font-manrope hover:text-slate-700 transition-colors"
            >
              Тохиргоо
            </Link>
            <Slash />
            <p className="text-slate-950 text-sm font-normal font-manrope">
              Салбарууд
            </p>
          </div>

          <p className="px-0 md:px-0.5 pb-0 md:pb-3 text-[#020617] font-bold md:font-semibold text-2xl md:text-xl font-manrope">
            Салбарууд
          </p>
        </div>

        {branches.length === 0 ? (
          <p className="text-[#64748B] font-normal text-base font-manrope py-5 w-full">
            Салбар олдсонгүй
          </p>
        ) : (
          <div className="flex flex-col gap-6 w-full">
            {branches.map((branch) => (
              <BranchCard key={branch.id} branch={branch} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
