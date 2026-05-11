# Unknown-box Measurement + Office-pickup Labelling Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two UX bugs in the Express shipment flow — (1) capture `dimensions_cm` during Korea intake for boxes the customer marked "unknown", and (2) stop labelling office-pickup shipments with delivery-specific copy on shared UI surfaces.

**Architecture:** UI-only changes. Bug 1 adds a conditional W×H×D input block to the existing Korea intake `weigh` step (no new step, no schema change). Bug 2 replaces hard-coded "Delivery" text and the "Mongolia" fallback city with `delivery_preference`-aware alternates on 5 shared view components. Persists via the existing `usePackageIntake.advance()` call.

**Tech Stack:** Next.js 16 (App Router), React 19, react-hook-form + zod, TanStack Query, Supabase, Tailwind v4. No unit-test framework — verification is `tsc --noEmit`, `eslint`, and manual browser walkthrough.

**Reference spec:** [`docs/superpowers/specs/2026-04-22-unknown-box-and-office-pickup-fixes-design.md`](../specs/2026-04-22-unknown-box-and-office-pickup-fixes-design.md)

---

## File inventory

**Modify:**
- `express/src/lib/i18n/dictionaries/en.json` — 3 new keys
- `express/src/lib/i18n/dictionaries/ko.json` — 3 new keys
- `express/src/lib/i18n/dictionaries/mn.json` — 3 new keys
- `express/src/components/staff/korea/intake/WeighStep.tsx` — conditional measurement block
- `express/src/components/shipment/ReviewStep.tsx` — conditional column title
- `express/src/components/shipment/ShipmentDetail.tsx` — conditional eyebrow + `toCity` fallback + ETA copy
- `express/src/components/shipment/ShipmentList.tsx` — row `to` label + `formatEta` pickup variant
- `express/src/components/staff/StaffShipmentDetail.tsx` — conditional eyebrow + `toCity` fallback
- `express/src/components/staff/korea/InboxDetail.tsx` — `toCity` fallback

**Create:** none.

**Reuse (already exist in all 3 dictionaries — do not re-add):**
- `shipment.form.review.pickup` ("Pickup" / "픽업" / "Авах")
- `shipment.form.officePickup` ("Office Pickup" / "사무실 수령" / "Оффисоос авах")
- `shipment.form.width`, `shipment.form.height`, `shipment.form.depth`
- `shipment.deliveredOn`

---

## Task 1: Add new i18n keys

**Files:**
- Modify: `express/src/lib/i18n/dictionaries/en.json`
- Modify: `express/src/lib/i18n/dictionaries/ko.json`
- Modify: `express/src/lib/i18n/dictionaries/mn.json`

Three new keys used by later tasks:

| key | en | ko | mn |
|-----|----|----|----|
| `staff.intake.weigh.measure` | Measure | 측정 | Хэмжих |
| `staff.intake.weigh.measureHelp` | This box was marked "not sure" — measure width, height and depth in cm. | "잘 모르겠어요"로 접수된 박스입니다. 가로·세로·높이(cm)를 재서 입력해주세요. | "Мэдэхгүй" гэж бүртгэгдсэн хайрцаг. Өргөн, өндөр, гүнийг см-ээр хэмжиж оруулна уу. |
| `shipment.pickedUpOn` | Picked up {date} | {date} 수령 완료 | {date}-нд авсан |

- [ ] **Step 1: Add keys to `en.json`**

Insert `staff.intake.weigh.measure` + `staff.intake.weigh.measureHelp` next to the other `staff.intake.weigh.*` keys (around line 322 `staff.intake.weigh.scale`). Insert `shipment.pickedUpOn` next to `shipment.deliveredOn` (line 102).

Add to `express/src/lib/i18n/dictionaries/en.json`:
```json
  "shipment.pickedUpOn": "Picked up {date}",
```
next to the existing `"shipment.deliveredOn": "Delivered {date}",` line.

Add near the other `staff.intake.weigh.*` keys:
```json
  "staff.intake.weigh.measure": "Measure",
  "staff.intake.weigh.measureHelp": "This box was marked \"not sure\" — measure width, height and depth in cm.",
```

- [ ] **Step 2: Add keys to `ko.json`** at the same relative positions

```json
  "shipment.pickedUpOn": "{date} 수령 완료",
```

```json
  "staff.intake.weigh.measure": "측정",
  "staff.intake.weigh.measureHelp": "\"잘 모르겠어요\"로 접수된 박스입니다. 가로·세로·높이(cm)를 재서 입력해주세요.",
```

- [ ] **Step 3: Add keys to `mn.json`** at the same relative positions

```json
  "shipment.pickedUpOn": "{date}-нд авсан",
```

```json
  "staff.intake.weigh.measure": "Хэмжих",
  "staff.intake.weigh.measureHelp": "\"Мэдэхгүй\" гэж бүртгэгдсэн хайрцаг. Өргөн, өндөр, гүнийг см-ээр хэмжиж оруулна уу.",
```

- [ ] **Step 4: Verify JSON parses**

Run: `cd express && node -e "['en','ko','mn'].forEach(l => JSON.parse(require('fs').readFileSync('src/lib/i18n/dictionaries/'+l+'.json','utf8')))"`
Expected: no output (exit 0). Any parse error means a trailing comma or unescaped quote.

- [ ] **Step 5: Commit**

```bash
git add express/src/lib/i18n/dictionaries/en.json express/src/lib/i18n/dictionaries/ko.json express/src/lib/i18n/dictionaries/mn.json
git commit -m "i18n(express): add measurement + pickup-aware keys

New keys in en/ko/mn for the intake weigh-step measurement block and
for 'picked up on' ETA copy used by pickup shipments."
```

---

## Task 2: Measure "unknown" boxes during Korea intake

**Files:**
- Modify: `express/src/components/staff/korea/intake/WeighStep.tsx` (full-file rewrite — see step 2 for the complete result)

Show a W × H × D block on the weigh step only when `pkg.box_size === "unknown"` or `pkg.dimensions_cm` is empty. Block "Continue" until all three fields are filled. Persist via the existing `intake.advance(..., "photo", { actual_weight_kg, dimensions_cm })` call.

- [ ] **Step 1: Read the current file to anchor the rewrite**

Run: `sed -n '1,150p' express/src/components/staff/korea/intake/WeighStep.tsx`

Expected: confirms current shape (stateful `actual`, single mutation at `handleContinue`, renders two columns + prev/next buttons). If the file diverges significantly from this, STOP and re-sync the plan.

- [ ] **Step 2: Rewrite WeighStep.tsx with the conditional measurement block**

Replace the entire contents of `express/src/components/staff/korea/intake/WeighStep.tsx` with:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/lib/i18n/client";
import { usePackageIntake } from "@/hooks/usePackageIntake";
import type { ExpressPackage, ExpressShipment } from "@/types/express";

interface Props {
  shipment: ExpressShipment;
  pkg: ExpressPackage;
  baseHref: string;
}

function parseDims(raw: string | null | undefined): [string, string, string] {
  if (!raw) return ["", "", ""];
  const parts = raw
    .split(/[×x*]/i)
    .map((s) => s.trim())
    .filter(Boolean);
  return [parts[0] ?? "", parts[1] ?? "", parts[2] ?? ""];
}

export function WeighStep({ shipment, pkg, baseHref }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const intake = usePackageIntake();

  const expected = pkg.weight_kg != null ? Number(pkg.weight_kg) : 0;
  const initialActual =
    pkg.actual_weight_kg != null ? Number(pkg.actual_weight_kg) : expected;
  const [actual, setActual] = useState<number>(initialActual);
  const delta = +(actual - expected).toFixed(2);
  const tolerance = Math.max(0.1, expected * 0.05); // 5% or 0.1 kg
  const withinTolerance = Math.abs(delta) <= tolerance;

  const needsDimensions =
    pkg.box_size === "unknown" || !pkg.dimensions_cm;
  const [initW, initH, initD] = parseDims(pkg.dimensions_cm);
  const [width, setWidth] = useState(initW);
  const [height, setHeight] = useState(initH);
  const [depth, setDepth] = useState(initD);

  const dimsComplete =
    width.trim() !== "" && height.trim() !== "" && depth.trim() !== "";
  const canContinue = needsDimensions ? dimsComplete : true;

  async function handleContinue() {
    const updates: { actual_weight_kg: number; dimensions_cm?: string } = {
      actual_weight_kg: actual,
    };
    if (needsDimensions && dimsComplete) {
      updates.dimensions_cm = `${width.trim()} × ${height.trim()} × ${depth.trim()}`;
    }
    await intake.advance(
      pkg.id,
      shipment.id,
      pkg.intake_step === "scan" || pkg.intake_step === "weigh"
        ? "photo"
        : pkg.intake_step,
      updates,
    );
    router.push(`${baseHref}/photo`);
  }

  return (
    <div className="rounded-ec border border-line bg-chrome p-10">
      <h2 className="font-serif text-[clamp(28px,3.4vw,38px)] font-light tracking-[-0.02em]">
        <span className="italic">{t("staff.intake.weigh.heading.italic")}</span>{" "}
        {t("staff.intake.weigh.heading.rest")}
      </h2>
      <p className="mt-3 max-w-[640px] text-[14px] leading-[1.55] text-text-dim">
        {t("staff.intake.weigh.help")}
      </p>

      <div className="mt-9 grid grid-cols-1 gap-7 min-[820px]:grid-cols-2">
        <div>
          <Eye>{t("staff.intake.weigh.expected")} · 예상</Eye>
          <div className="mt-3 flex items-baseline gap-2 font-serif text-[64px] leading-none tracking-[-0.03em]">
            {expected.toFixed(1)}
            <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-text-dim">
              kg
            </span>
          </div>

          <Eye className="mt-9">{t("staff.intake.weigh.actual")} · 실측</Eye>
          <div className="mt-3 flex items-baseline gap-3">
            <input
              type="number"
              step="0.1"
              min="0"
              value={Number.isFinite(actual) ? actual : ""}
              onChange={(e) => setActual(parseFloat(e.target.value) || 0)}
              className="w-[180px] border-0 border-b border-line bg-transparent pb-2 font-serif text-[64px] leading-none tracking-[-0.03em] text-text outline-none focus:border-amber"
            />
            <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-text-dim">
              kg
            </span>
          </div>
          <div
            className={`mt-3 font-mono text-[11px] tabular-nums ${
              withinTolerance ? "text-ec-green" : "text-rust"
            }`}
          >
            Δ {delta > 0 ? "+" : ""}
            {delta.toFixed(2)} kg —{" "}
            {withinTolerance
              ? t("staff.intake.weigh.tolerance.within")
              : t("staff.intake.weigh.tolerance.out")}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-ec bg-bg-soft p-10 text-center">
          <Eye>{t("staff.intake.weigh.scale")} · C-14</Eye>
          <div className="mt-4 font-serif text-[120px] leading-none tracking-[-0.04em]">
            {actual.toFixed(1)}
          </div>
          <div className="mt-2 font-mono text-[12px] uppercase tracking-[0.18em] text-text-dim">
            kilograms
          </div>
          <div className="mt-6 flex items-center gap-1">
            <Dot active />
            <Dot active />
            <Dot active />
            <Dot />
          </div>
          <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim">
            {t("staff.intake.weigh.signal")} · {t("staff.intake.weigh.stable")}
          </div>
        </div>
      </div>

      {needsDimensions && (
        <div className="mt-9 border-t border-line pt-7">
          <Eye>{t("staff.intake.weigh.measure")}</Eye>
          <p className="mt-2 max-w-[560px] text-[13px] leading-[1.55] text-text-dim">
            {t("staff.intake.weigh.measureHelp")}
          </p>
          <div className="mt-4 grid max-w-[420px] grid-cols-3 gap-3">
            <DimField
              id="weigh-width"
              label={t("shipment.form.width")}
              value={width}
              onChange={setWidth}
            />
            <DimField
              id="weigh-height"
              label={t("shipment.form.height")}
              value={height}
              onChange={setHeight}
            />
            <DimField
              id="weigh-depth"
              label={t("shipment.form.depth")}
              value={depth}
              onChange={setDepth}
            />
          </div>
        </div>
      )}

      <div className="mt-9 flex justify-between">
        <button
          type="button"
          onClick={() => router.push(`${baseHref}/scan`)}
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-line bg-transparent px-5 font-sans text-[13px] font-medium text-text transition-colors hover:border-text"
        >
          ← {t("common.previous")}
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={intake.isPatching || !canContinue}
          title={
            !canContinue ? t("staff.intake.weigh.measureHelp") : undefined
          }
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-transparent bg-text px-6 font-sans text-[13px] font-medium text-bg transition-colors hover:bg-amber hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("staff.intake.weigh.continue")} →
        </button>
      </div>
    </div>
  );
}

function DimField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim"
      >
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        placeholder="cm"
        onChange={(e) => onChange(e.target.value)}
        className="mt-[6px] w-full border-0 border-b border-line bg-transparent pb-2 font-serif text-[24px] leading-none text-text outline-none focus:border-amber"
      />
    </div>
  );
}

function Eye({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`font-mono text-[10px] uppercase tracking-[0.18em] text-text-dim ${
        className ?? ""
      }`}
    >
      {children}
    </div>
  );
}

function Dot({ active }: { active?: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-[6px] w-[6px] rounded-full ${
        active ? "bg-ec-green" : "bg-line"
      }`}
    />
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `cd express && npx tsc --noEmit`
Expected: no errors. If any, fix before proceeding.

- [ ] **Step 4: Lint the touched file**

Run: `cd express && bun run lint`
Expected: no new errors or warnings introduced by WeighStep.tsx.

- [ ] **Step 5: Commit**

```bash
git add express/src/components/staff/korea/intake/WeighStep.tsx
git commit -m "fix(express/intake): measure unknown boxes during Korea weigh step

Customers who pick the '?' (unknown) size send a package with empty
dimensions and a promise that staff measures it in the warehouse. The
intake wizard never actually captured dimensions. Add a conditional W×H×D
block to WeighStep that appears only when box_size='unknown' or
dimensions_cm is empty, gates Continue until filled, and persists via the
existing usePackageIntake.advance() call alongside actual_weight_kg."
```

---

## Task 3: Conditional column title in ReviewStep

**Files:**
- Modify: `express/src/components/shipment/ReviewStep.tsx:53-63`

- [ ] **Step 1: Replace the `blocks` array to pick the title key based on `delivery_preference`**

In `express/src/components/shipment/ReviewStep.tsx`, change this block:

```tsx
  const blocks = [
    { l: t("shipment.form.review.boxes"), v: boxesSummary },
    {
      l: t("shipment.form.review.pickup"),
      v: pickupLines.length > 0 ? pickupLines.join("\n") : "—",
    },
    {
      l: t("shipment.form.review.delivery"),
      v: deliveryLines.length > 0 ? deliveryLines.join("\n") : "—",
    },
  ];
```

to:

```tsx
  const handoffLabel =
    values.delivery_preference === "office_pickup"
      ? t("shipment.form.review.pickup")
      : t("shipment.form.review.delivery");

  const blocks = [
    { l: t("shipment.form.review.boxes"), v: boxesSummary },
    {
      l: t("shipment.form.review.pickup"),
      v: pickupLines.length > 0 ? pickupLines.join("\n") : "—",
    },
    {
      l: handoffLabel,
      v: deliveryLines.length > 0 ? deliveryLines.join("\n") : "—",
    },
  ];
```

Note: the **first** pickup block (originating in Korea) is a different concept — it's the Korea pickup address. The third block is the Mongolia handoff and is the one that needs the conditional label.

- [ ] **Step 2: Typecheck**

Run: `cd express && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add express/src/components/shipment/ReviewStep.tsx
git commit -m "fix(express/review): label handoff column as Pickup for office_pickup

ReviewStep hard-coded 'Delivery' for the third column even when the user
chose office pickup. Pick the label from delivery_preference."
```

---

## Task 4: ShipmentDetail — conditional eyebrow + toCity + ETA

**Files:**
- Modify: `express/src/components/shipment/ShipmentDetail.tsx:41-48`, `:135-142`, `:47-48` header route

When the shipment is office pickup:
- Route headline shows `"Seoul → Office pickup"` instead of `"Seoul → Mongolia"`.
- The address card's eyebrow says "Pickup" not "Delivery".
- (No ETA change here — this file does not use `formatEta`. Detail shows `shipment.etaPrefix` / `shipment.flight_arrival_at` which is flight ETA; unchanged.)

- [ ] **Step 1: Change `toCity` to be pickup-aware**

Locate (around line 47-48):

```tsx
  const fromCity = korea_address?.kr_city ?? t("map.korea");
  const toCity = mongolia_address?.mn_city ?? t("map.mongolia");
```

Replace with:

```tsx
  const isOfficePickup = shipment.delivery_preference === "office_pickup";
  const fromCity = korea_address?.kr_city ?? t("map.korea");
  const toCity = isOfficePickup
    ? t("shipment.form.officePickup")
    : (mongolia_address?.mn_city ?? t("map.mongolia"));
```

- [ ] **Step 2: Make the address-card eyebrow conditional**

Locate (around line 135-142):

```tsx
          ) : (
            <div className="rounded-ec border border-line bg-chrome p-[22px] transition-colors hover:border-[color-mix(in_srgb,var(--text)_30%,var(--line))]">
              <Eyebrow>{t("shipment.form.review.delivery")}</Eyebrow>
              <div className="mt-3 font-serif text-xl">
                {t("shipment.form.officePickup")}
              </div>
            </div>
          )}
```

Replace with:

```tsx
          ) : (
            <div className="rounded-ec border border-line bg-chrome p-[22px] transition-colors hover:border-[color-mix(in_srgb,var(--text)_30%,var(--line))]">
              <Eyebrow>
                {isOfficePickup
                  ? t("shipment.form.review.pickup")
                  : t("shipment.form.review.delivery")}
              </Eyebrow>
              <div className="mt-3 font-serif text-xl">
                {t("shipment.form.officePickup")}
              </div>
            </div>
          )}
```

- [ ] **Step 3: Typecheck**

Run: `cd express && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add express/src/components/shipment/ShipmentDetail.tsx
git commit -m "fix(express/detail): label office-pickup destination + handoff card

The route headline fell back to 'Mongolia' for office-pickup shipments
(which have no mongolia_address), and the handoff card showed a
'Delivery' eyebrow with an 'Office Pickup' body. Route now reads
'Seoul → Office pickup', eyebrow reads 'Pickup' for office-pickup."
```

---

## Task 5: StaffShipmentDetail — same conditional fixes as ShipmentDetail

**Files:**
- Modify: `express/src/components/staff/StaffShipmentDetail.tsx:64-76`, `:220-229`

- [ ] **Step 1: Make `toCity` pickup-aware**

Locate (around line 64-72):

```tsx
  const { shipment, korea_address, mongolia_address, packages, history } = data;
  const currentIdx = statusIndex(shipment.status);
  const total = statusTotal();
  const progress = currentIdx / Math.max(total - 1, 1);
  const chipKind = statusChipKind(shipment.status);

  const fromCity = korea_address?.kr_city ?? t("map.korea");
  const toCity = mongolia_address?.mn_city ?? t("map.mongolia");
```

Replace with:

```tsx
  const { shipment, korea_address, mongolia_address, packages, history } = data;
  const currentIdx = statusIndex(shipment.status);
  const total = statusTotal();
  const progress = currentIdx / Math.max(total - 1, 1);
  const chipKind = statusChipKind(shipment.status);

  const isOfficePickup = shipment.delivery_preference === "office_pickup";
  const fromCity = korea_address?.kr_city ?? t("map.korea");
  const toCity = isOfficePickup
    ? t("shipment.form.officePickup")
    : (mongolia_address?.mn_city ?? t("map.mongolia"));
```

- [ ] **Step 2: Make the address-card eyebrow conditional**

Locate (around line 221-228):

```tsx
          ) : (
            <div className="rounded-ec border border-line bg-chrome p-[22px] transition-colors hover:border-[color-mix(in_srgb,var(--text)_30%,var(--line))]">
              <Eyebrow>{t("shipment.form.review.delivery")}</Eyebrow>
              <div className="mt-3 font-serif text-xl">
                {t("shipment.form.officePickup")}
              </div>
            </div>
          )}
```

Replace with:

```tsx
          ) : (
            <div className="rounded-ec border border-line bg-chrome p-[22px] transition-colors hover:border-[color-mix(in_srgb,var(--text)_30%,var(--line))]">
              <Eyebrow>
                {isOfficePickup
                  ? t("shipment.form.review.pickup")
                  : t("shipment.form.review.delivery")}
              </Eyebrow>
              <div className="mt-3 font-serif text-xl">
                {t("shipment.form.officePickup")}
              </div>
            </div>
          )}
```

- [ ] **Step 3: Typecheck**

Run: `cd express && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add express/src/components/staff/StaffShipmentDetail.tsx
git commit -m "fix(express/staff-detail): same pickup labelling as user detail

Mirror the ShipmentDetail fixes: office-pickup route destination and
handoff card eyebrow switch to pickup-aware text."
```

---

## Task 6: InboxDetail — pickup-aware destination in headline

**Files:**
- Modify: `express/src/components/staff/korea/InboxDetail.tsx:160-162`

- [ ] **Step 1: Make `toCity` pickup-aware**

Locate (around line 160-165):

```tsx
  const fromCity = korea_address?.kr_city ?? t("map.korea");
  const toCity = mongolia_address?.mn_city ?? t("map.mongolia");
  const recipient =
    mongolia_address?.recipient_name ?? korea_address?.recipient_name ?? "—";
  const recipientPhone =
    mongolia_address?.recipient_phone ?? korea_address?.recipient_phone ?? null;
```

Replace with:

```tsx
  const isOfficePickup = shipment.delivery_preference === "office_pickup";
  const fromCity = korea_address?.kr_city ?? t("map.korea");
  const toCity = isOfficePickup
    ? t("shipment.form.officePickup")
    : (mongolia_address?.mn_city ?? t("map.mongolia"));
  const recipient =
    mongolia_address?.recipient_name ?? korea_address?.recipient_name ?? "—";
  const recipientPhone =
    mongolia_address?.recipient_phone ?? korea_address?.recipient_phone ?? null;
```

Note: leave `recipient` as-is. For office pickups we intentionally fall back to the Korea sender's name — they are the pickup party.

- [ ] **Step 2: Typecheck**

Run: `cd express && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add express/src/components/staff/korea/InboxDetail.tsx
git commit -m "fix(express/inbox): show 'Office pickup' in destination headline

Office-pickup shipments previously read 'Korea → Mongolia' in the inbox
detail; now show the pickup label explicitly."
```

---

## Task 7: ShipmentList — row destination + pickup-aware formatEta

**Files:**
- Modify: `express/src/components/shipment/ShipmentList.tsx:125-131`, `:186-206`

- [ ] **Step 1: Use pickup label for `to` in the row**

Locate (around line 122-131):

```tsx
function ShipmentRow({
  shipment,
  total,
  locale,
}: {
  shipment: ExpressShipment;
  total: number;
  locale: string;
}) {
  const t = useTranslations();
  const idx = statusIndex(shipment.status);
  const kind = statusChipKind(shipment.status);
  const from = shipment.korea_address?.kr_city ?? "Korea";
  const to = shipment.mongolia_address?.mn_city ?? "Mongolia";
```

Replace the last two lines with:

```tsx
  const from = shipment.korea_address?.kr_city ?? "Korea";
  const isOfficePickup = shipment.delivery_preference === "office_pickup";
  const to = isOfficePickup
    ? t("shipment.form.officePickup")
    : (shipment.mongolia_address?.mn_city ?? "Mongolia");
```

- [ ] **Step 2: Pickup-aware formatEta**

Locate `formatEta` (around line 186-206):

```tsx
function formatEta(
  shipment: ExpressShipment,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string | null {
  if (shipment.status === "completed" && shipment.delivered_at) {
    return t("shipment.deliveredOn", {
      date: new Date(shipment.delivered_at).toLocaleDateString(),
    });
  }
  if (shipment.flight_arrival_at) {
    return t("shipment.etaPrefix", {
      date: new Date(shipment.flight_arrival_at).toLocaleDateString(),
    });
  }
  if (shipment.pickup_scheduled_at) {
    return t("shipment.pickupPrefix", {
      date: new Date(shipment.pickup_scheduled_at).toLocaleDateString(),
    });
  }
  return null;
}
```

Replace the first `if` block with:

```tsx
  if (shipment.status === "completed" && shipment.delivered_at) {
    const key =
      shipment.delivery_preference === "office_pickup"
        ? "shipment.pickedUpOn"
        : "shipment.deliveredOn";
    return t(key, {
      date: new Date(shipment.delivered_at).toLocaleDateString(),
    });
  }
```

- [ ] **Step 3: Typecheck**

Run: `cd express && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add express/src/components/shipment/ShipmentList.tsx
git commit -m "fix(express/list): pickup-aware destination and completion copy

Row destination now shows 'Office pickup' instead of generic 'Mongolia'
for office-pickup shipments, and completed rows read 'Picked up {date}'
instead of 'Delivered {date}' when the shipment was an office pickup."
```

---

## Task 8: Full verification

- [ ] **Step 1: Typecheck whole project**

Run: `cd express && npx tsc --noEmit`
Expected: clean (exit 0, no errors).

- [ ] **Step 2: Lint**

Run: `cd express && bun run lint`
Expected: exit 0. No new warnings for the files we modified.

- [ ] **Step 3: Build**

Run: `cd express && bun run build`
Expected: successful build. If it fails with i18n or React-related errors, stop and diagnose.

- [ ] **Step 4: Manual walkthrough — Bug 1 ("unknown" box is measured)**

Start the dev server: `cd express && bun run dev`. Then:

1. As a customer, open `/en/shipments/new`.
2. Step 1: add one box, pick the `?` ("Not sure") size, enter weight 5, description "mixed".
3. Complete steps 2-4 and submit.
4. As a Korea admin staff member (existing account), open `/en/korea/inbox`, approve the new request, schedule pickup (any future time), mark picked up.
5. Navigate to `/en/korea/intake` and click into the new shipment, step through scan.
6. On the weigh step, verify the **Measure** block appears below the scale, with 3 inputs and the measureHelp text.
7. Try to click Continue without filling dimensions → button disabled, tooltip shows the measureHelp.
8. Fill W=40, H=30, D=20 → Continue enables. Click Continue.
9. Open the same shipment in `/en/shipments/<id>` (the customer detail). The box card should now show `40 × 30 × 20 cm`.
10. Repeat with an `S` preset box on a second shipment — verify the Measure block does NOT appear (dimensions pre-filled), and Continue is not gated.

Expected: all 10 checks pass.

- [ ] **Step 5: Manual walkthrough — Bug 2 (office-pickup labelling)**

1. Create two shipments as a customer: one with `delivery_preference = home_delivery` (any Mongolia address), one with `office_pickup`.
2. On step 4 (Review), confirm the **home-delivery** shipment's third column reads "Delivery" and the **office-pickup** shipment's third column reads "Pickup".
3. Submit both. On `/en/shipments` (list):
   - home-delivery row: destination reads the Mongolia city.
   - office-pickup row: destination reads "Office Pickup".
4. Click into the office-pickup shipment (`/en/shipments/<id>`):
   - Route headline reads `Seoul → Office Pickup`.
   - Handoff address card's eyebrow reads "Pickup" (not "Delivery"), body reads "Office Pickup".
5. As staff, open `/en/korea/inbox` and select the office-pickup shipment:
   - Headline reads `… → Office Pickup`.
6. As staff, `/en/warehouse/shipments` → open the office-pickup shipment's detail:
   - Route headline reads `Seoul → Office Pickup`.
   - Handoff card eyebrow reads "Pickup".
7. Home-delivery shipment keeps all original delivery copy — verify by viewing detail + list row.
8. Manually advance an office-pickup shipment to `completed` in the DB (or via the staff action path) with `delivered_at` set, then reload `/en/shipments` — the row's ETA text reads "Picked up {date}" not "Delivered {date}".

Expected: all 8 checks pass.

- [ ] **Step 6: Verify untouched surfaces are unchanged**

1. `/en/delivery/dispatch` board — still shows only `home_delivery` shipments (office pickups never appear there).
2. `/en/warehouse/shipments` for a home-delivery shipment in `ready` status — the main action button reads "Out for Delivery" (not "Ready for Pickup"), per `WarehouseActions.tsx`.
3. Driver app's queue (if you have a `mongolia_delivery` staff account) — still surfaces only `out_for_delivery,completed` shipments. Office pickups never show up in the queue.

Expected: behavior unchanged from before the PR.

- [ ] **Step 7: Final commit for the verification doc (optional)**

If any issues were found during verification and fixed, stage and commit them individually. Otherwise no commit needed — this step is pure verification.

- [ ] **Step 8: Push the branch**

```bash
git push
```

Expected: upstream updated on `152-express`.

---

## Self-review notes

**Spec coverage:**
- Bug 1 design (WeighStep conditional measurement) → Task 2 ✓
- Bug 2 eyebrow fix in ShipmentDetail → Task 4 ✓
- Bug 2 eyebrow fix in StaffShipmentDetail → Task 5 ✓
- Bug 2 ReviewStep column label → Task 3 ✓
- Bug 2 ShipmentList `to` + `formatEta` → Task 7 ✓
- Bug 2 InboxDetail `toCity` fallback → Task 6 ✓
- New i18n keys (`staff.intake.weigh.measure`, `staff.intake.weigh.measureHelp`, `shipment.pickedUpOn`) → Task 1 ✓
- Spec mentioned `shipment.route.officePickup` — we eliminated this key, reusing existing `shipment.form.officePickup` instead (already localized). Coverage is maintained; this is a simplification, not a gap.

**Placeholder scan:** no TBDs, no generic "add error handling", no "similar to Task N". All code blocks spell out the full replacement.

**Type/name consistency:** every task uses `isOfficePickup` as the local boolean flag; `needsDimensions` is only in Task 2. `t("shipment.form.officePickup")` (existing) is used for the destination label across all tasks, never the fictional `shipment.route.officePickup`. `handoffLabel` is only referenced in Task 3 where it is defined.
