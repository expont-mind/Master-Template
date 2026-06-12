# Unknown-box measurement + office-pickup labelling fixes

**Date:** 2026-04-22
**Branch:** `152-express`
**Scope:** Express shipment flow (customer + Korea staff + shared detail views)

## Context

Two non-functional edge cases were reported in the Express shipment flow:

1. **"Unknown" box size is never actually measured.** The customer-side box
   picker offers a `?` preset ("Not sure — measured at pickup"). The hint
   copy promises "Our staff will measure and weigh the box at the Incheon
   warehouse." But the Korea intake wizard only has `scan → weigh → photo
→ label` steps. No step captures `dimensions_cm`, so an unknown box
   keeps `dimensions_cm = ""` forever. The customer-facing promise is
   silently broken.

2. **Office-pickup shipments are labelled as "delivery".** Several
   shared UI surfaces assume home-delivery and render "Delivery" / 배송 /
   Хүргэлт text (or fall back to a Mongolia city) for shipments whose
   `delivery_preference === "office_pickup"`. This is cosmetic but
   misleads both customers and staff, and makes it harder to see at a
   glance what handoff mode a shipment uses.

Both bugs originate in UI/UX only. No database migration, no change to
the status state machine, no change to dispatch or driver logic.

## Goals

- Populate `express_packages.dimensions_cm` during Korea intake for any
  box that arrived with empty/unknown dimensions, so the customer's
  promise is kept and downstream surfaces (detail cards, manifest,
  labels) have the data they already try to display.
- Remove "delivery" terminology from UI surfaces that render for both
  delivery modes, replacing it with pickup-aware labels when
  `delivery_preference === "office_pickup"`.

## Non-goals

- No new intake step. We're inlining measurement into the existing
  `weigh` step, not extending `INTAKE_STEPS`.
- No change to the dispatch flow, driver queue, or status transitions —
  existing branches (e.g. `WarehouseActions` choosing
  `out_for_delivery` vs `ready_for_pickup`) are already correct.
- No schema/migration work. `dimensions_cm` is already nullable text on
  `express_packages`.
- No redesign of the intake wizard layout. Changes stay within existing
  component surfaces.

---

## Bug 1 — Measure "unknown" boxes during Korea intake

### Design

Extend `WeighStep` to conditionally ask for W × H × D alongside the
weight reading.

**File:**
[`express/src/components/staff/korea/intake/WeighStep.tsx`](../../../express/src/components/staff/korea/intake/WeighStep.tsx)

**Trigger condition (when to show the block):**

```ts
const needsDimensions = pkg.box_size === "unknown" || !pkg.dimensions_cm;
```

This covers:

- customer picked `?` (unknown)
- legacy packages with no `box_size` and empty `dimensions_cm`

Preset sizes (S/M/L/XL) and `custom` boxes already have
`dimensions_cm` populated at create time, so the block stays hidden for
them and the step behaves exactly as before.

**UI:**

- A dedicated subsection below the actual-weight block, inside the same
  card.
- Eyebrow: `t("staff.intake.weigh.measure")` ("Measure" · 측정 ·
  Хэмжих).
- Short hint: `t("staff.intake.weigh.measureHelp")` explaining why
  this box needs measurement.
- Three inputs — Width / Height / Depth — mirroring the pattern
  already used in the customer form:
  [`BoxesStep.tsx` `CustomDimensionsInput`](../../../express/src/components/shipment/BoxesStep.tsx#L179-L224).
- Re-use existing i18n keys `shipment.form.width`,
  `shipment.form.height`, `shipment.form.depth`.
- Values are parsed from any existing `pkg.dimensions_cm` on mount
  (via the same `split(/[×x*]/i)` convention), held in local state,
  and recombined as `` `${w} × ${h} × ${d}` `` on submit.

**Validation:**

- All three inputs must be non-empty and parse to positive numbers
  before the step's "Continue" button is enabled.
- We trim whitespace and accept integer or decimal cm values — no
  tighter numeric validation; this is staff input on a trusted
  device.
- If `needsDimensions` is false, the button is only gated by the
  existing weight rules (unchanged).

**Write path:**

- Single call, same shape as today:
  ```ts
  await intake.advance(pkg.id, shipment.id, "photo", {
    actual_weight_kg: actual,
    ...(needsDimensions ? { dimensions_cm: combined } : {}),
  });
  ```
- `usePackageIntake.advance` already accepts
  `Partial<ExpressPackage>`; no hook changes.

### i18n

New keys in
[`express/src/lib/i18n/dictionaries/{en,ko,mn}.json`](../../../express/src/lib/i18n/dictionaries):

| key                              | en                                                                               | ko                                                                           | mn                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `staff.intake.weigh.measure`     | Measure                                                                          | 측정                                                                         | Хэмжих                                                                             |
| `staff.intake.weigh.measureHelp` | This box was marked "not sure" — measure width, height and depth in centimeters. | "잘 모르겠어요"로 접수된 박스입니다. 가로·세로·높이(cm)를 재서 입력해주세요. | "Мэдэхгүй" гэж бүртгэгдсэн хайрцаг. Өргөн, өндөр, гүнийг см-ээр хэмжиж оруулна уу. |

Existing `shipment.form.width/height/depth` (already present in the
dictionaries for the customer form) are reused.

### Acceptance

- Creating a shipment with an `unknown` box, then running through
  Korea intake's weigh step, surfaces the three-field measurement
  block with the new eyebrow and hint.
- Leaving any of W/H/D empty disables Continue.
- Submitting persists `dimensions_cm = "W × H × D"` on the package row,
  visible on the customer detail page's box card ("W × H × D cm") and
  in staff views.
- For S/M/L/XL/`custom` boxes the weigh step is visually and
  functionally unchanged (no measurement block shown).

---

## Bug 2 — Stop labelling office-pickup as "delivery"

### Design

Targeted conditional rendering across 5 files that currently emit
delivery-specific text or city fallbacks for shipments regardless of
`delivery_preference`. No structural changes.

### i18n (new keys)

| key                           | en                  | ko              | mn                     |
| ----------------------------- | ------------------- | --------------- | ---------------------- |
| `shipment.form.review.pickup` | Pickup              | 수령            | Авах                   |
| `shipment.pickedUpOn`         | Picked up on {date} | {date}에 수령함 | {date}-нд хүлээн авсан |
| `shipment.route.officePickup` | Office pickup       | 사무실 수령     | Оффисоос авах          |

### File changes

1. **[`express/src/components/shipment/ShipmentDetail.tsx`](../../../express/src/components/shipment/ShipmentDetail.tsx)**
   - The address card rendered when `mongolia_address` is null (line
     ~135) uses the `delivery` eyebrow. Switch based on
     `shipment.delivery_preference`:
     ```tsx
     const handoffEyebrow =
       shipment.delivery_preference === "office_pickup"
         ? t("shipment.form.review.pickup")
         : t("shipment.form.review.delivery");
     ```
   - The `toCity` headline (line ~48) currently falls back to
     `t("map.mongolia")`. When `office_pickup`, use
     `t("shipment.route.officePickup")` so the header reads
     "_Seoul_ → _Office pickup_" rather than a generic country.

2. **[`express/src/components/staff/StaffShipmentDetail.tsx`](../../../express/src/components/staff/StaffShipmentDetail.tsx)**
   - Same two changes (handoff-card eyebrow, `toCity` fallback) as
     above.

3. **[`express/src/components/shipment/ReviewStep.tsx`](../../../express/src/components/shipment/ReviewStep.tsx)**
   - The review column title (line ~60) is always "Delivery".
     Conditional on `values.delivery_preference`, emit the `pickup`
     label when the user chose office pickup.

4. **[`express/src/components/shipment/ShipmentList.tsx`](../../../express/src/components/shipment/ShipmentList.tsx)**
   - Row's `to` (line ~126): when `office_pickup`, replace the
     "Mongolia" fallback with `t("shipment.route.officePickup")`.
   - `formatEta` (line ~186-206): when `status === "completed"`, pick
     the key based on `delivery_preference` —
     `shipment.pickedUpOn` for pickups, `shipment.deliveredOn` for
     deliveries.

5. **[`express/src/components/staff/korea/InboxDetail.tsx`](../../../express/src/components/staff/korea/InboxDetail.tsx)**
   - `toCity` fallback (line ~161) gets the pickup-aware
     fallback like (1) and (2).

### Verification touchpoints (no change expected, just confirmed correct)

- `DispatchView` already `.filter(s => s.delivery_preference ===
"home_delivery")` — office pickups never enter the dispatch board.
- `WarehouseActions` already branches
  `home_delivery → out_for_delivery` vs `else → ready_for_pickup`.
- `useDriverQueue` restricts to `out_for_delivery,completed` — driver
  app never sees office pickups.
- `WorkspaceSidebar`'s "Deliveries in UB" count is intentionally tied
  to `out_for_delivery` and stays that way.

### Acceptance

- Create two shipments: one `home_delivery`, one `office_pickup`.
- Customer review step, customer list row, customer detail card,
  staff inbox header, and staff detail card all read "Pickup" /
  "Office pickup" for the pickup shipment and "Delivery" / the
  Mongolia city for the delivery shipment.
- Completing a pickup shipment surfaces "Picked up on {date}" on the
  list row; completing a delivery still surfaces "Delivered on
  {date}".
- Dispatch, driver queue, warehouse action buttons — all unchanged
  and behave as before.

---

## Rollout

Single PR on the `152-express` branch. No migration, no feature flag.
Manually smoke-tested by creating one shipment of each kind, plus one
`unknown`-sized box, and walking each through the Korea intake steps.
