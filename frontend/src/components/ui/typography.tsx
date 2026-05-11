// Typography primitives extracted from repeated Tailwind class patterns
// across the storefront. Each component renders a <p> by default,
// applies a fixed class set, and merges any extra `className` via cn()
// so consumers can add layout/positioning classes (e.g. text-center,
// pt-2, leading-7) without losing the typographic baseline.
//
// Patterns extracted: every class string with 15+ occurrences in the
// codebase as of the Phase 6 audit. Less-common patterns stayed inline
// — extracting them would add ceremony without saving keystrokes.

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type TextProps = HTMLAttributes<HTMLParagraphElement>;

const BASE = "font-manrope";

const MUTED_BASE = `text-[#64748B] font-normal text-base ${BASE}`;
const MUTED_SM = `text-[#64748B] font-normal text-sm ${BASE}`;
const MUTED_XS = `text-[#64748B] font-normal text-xs ${BASE}`;
const MUTED_MEDIUM_SM = `text-[#64748B] font-medium text-sm ${BASE}`;
const PRIMARY_BODY = `text-[#020617] font-normal text-base ${BASE}`;
const PRIMARY_SM = `text-[#020617] font-normal text-sm ${BASE}`;
const PRIMARY_MEDIUM_SM = `text-[#020617] font-medium text-sm ${BASE}`;
const PRIMARY_MEDIUM_BASE = `text-[#020617] font-medium text-base ${BASE}`;
const PRIMARY_SEMIBOLD_SM = `text-[#020617] font-semibold text-sm ${BASE}`;
const PRIMARY_HEADING = `text-[#020617] font-semibold text-xl ${BASE}`;

/** `text-[#64748B] font-normal text-base font-manrope` — muted body text. */
export function MutedText({ className, ...props }: TextProps) {
  return <p className={cn(MUTED_BASE, className)} {...props} />;
}

/** `text-[#64748B] font-normal text-sm font-manrope` — muted small text. */
export function MutedTextSm({ className, ...props }: TextProps) {
  return <p className={cn(MUTED_SM, className)} {...props} />;
}

/** `text-[#64748B] font-normal text-xs font-manrope` — muted extra-small. */
export function MutedTextXs({ className, ...props }: TextProps) {
  return <p className={cn(MUTED_XS, className)} {...props} />;
}

/** `text-[#64748B] font-medium text-sm font-manrope` — muted medium-weight small. */
export function MutedMediumSm({ className, ...props }: TextProps) {
  return <p className={cn(MUTED_MEDIUM_SM, className)} {...props} />;
}

/** `text-[#020617] font-normal text-base font-manrope` — default body text. */
export function PrimaryBody({ className, ...props }: TextProps) {
  return <p className={cn(PRIMARY_BODY, className)} {...props} />;
}

/** `text-[#020617] font-normal text-sm font-manrope` — small primary text. */
export function PrimarySm({ className, ...props }: TextProps) {
  return <p className={cn(PRIMARY_SM, className)} {...props} />;
}

/** `text-[#020617] font-medium text-sm font-manrope` — UI labels, table headers. */
export function PrimaryMediumSm({ className, ...props }: TextProps) {
  return <p className={cn(PRIMARY_MEDIUM_SM, className)} {...props} />;
}

/** `text-[#020617] font-medium text-base font-manrope` — emphasised body text. */
export function PrimaryMediumBase({ className, ...props }: TextProps) {
  return <p className={cn(PRIMARY_MEDIUM_BASE, className)} {...props} />;
}

/** `text-[#020617] font-semibold text-sm font-manrope` — semibold small text. */
export function PrimarySemiboldSm({ className, ...props }: TextProps) {
  return <p className={cn(PRIMARY_SEMIBOLD_SM, className)} {...props} />;
}

/** `text-[#020617] font-semibold text-xl font-manrope` — section/card headings. */
export function PrimaryHeading({ className, ...props }: TextProps) {
  return <p className={cn(PRIMARY_HEADING, className)} {...props} />;
}
