# Korea Inbox Buttons — make them real

## Context

The Korea inbox page currently renders four buttons that don't do useful work:

- **Saved views** (toolbar) — explicitly `disabled` with a "coming soon" tooltip.
- **Log issue** (toolbar) — explicitly `disabled` with a "coming soon" tooltip.
- **Edit** (shipment detail header) — clickable, no `onClick`, does literally nothing.
- **Print label** (shipment detail header) — clickable, no `onClick`, does literally nothing.

Goal: stop the UI from lying. Remove the two that don't serve a real operational need, and build minimum-viable versions of the two that do (Log issue, Edit).

## Decisions (already validated)

- **Saved views** → remove. Existing filter pills (All / Korea / In transit / Mongolia / Delivery) cover day-to-day triage; named-view CRUD is overhead for a small ops team.
- **Print label** → remove. Label printing already exists in the intake wizard (`ScanStep`). A second print path on the inbox is redundant.
- **Log issue** → build. Resolve-able. Red-dot badge on inbox list rows with unresolved issues.
- **Edit** → build. Editable fields: recipient, Korea address, pickup time. Modal UI, restricted until `status < 'in_transit'`.

## Removals

Two files, pure deletes.

### [express/src/components/staff/korea/InboxToolbar.tsx](express/src/components/staff/korea/InboxToolbar.tsx)

- Delete the disabled "Saved views" `<PillButton>` block (currently lines 63–70) and its `ChevronDown` import if it becomes unused.

### [express/src/components/staff/korea/InboxDetail.tsx](express/src/components/staff/korea/InboxDetail.tsx)

- Delete the inert "Print label" `<button>` block (currently lines 157–162).

### i18n

Remove from `express/src/lib/i18n/dictionaries/{en,ko,mn}.json`:

- `staff.inbox.savedViews`
- `staff.inbox.printLabel` (the inbox-side one; the `staff.intake.scan.printLabel` used in the intake wizard stays).

## Log issue

### Data model — new migration `015_express_shipment_issues.sql`

```sql
CREATE TABLE express_shipment_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES express_shipments(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'wrong_address','unreachable','damaged','delayed','customer_change','other'
  )),
  note TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT
);

CREATE INDEX express_shipment_issues_shipment_idx
  ON express_shipment_issues (shipment_id);
CREATE INDEX express_shipment_issues_unresolved_idx
  ON express_shipment_issues (shipment_id)
  WHERE resolved_at IS NULL;

ALTER TABLE express_shipment_issues ENABLE ROW LEVEL SECURITY;

-- Follows the same staff-only pattern used elsewhere in the schema.
CREATE POLICY "Staff can read all issues"
  ON express_shipment_issues FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM express_staff
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Staff can insert issues"
  ON express_shipment_issues FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM express_staff
    WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Staff can update issues"
  ON express_shipment_issues FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM express_staff
    WHERE user_id = auth.uid() AND is_active = true
  ));
```

### API routes

#### `POST /api/express/shipments/[id]/issues`

Create an issue.

- **Auth**: active staff row in `express_staff` (any role).
- **Body**: `{ category: IssueCategory, note: string (1..2000) }`.
- **Response**: inserted issue row.
- **Errors**: 401 unauth, 403 not staff, 400 bad body, 404 shipment not found.

#### `POST /api/express/shipments/[id]/issues/[issueId]/resolve`

Resolve an open issue.

- **Auth**: active staff.
- **Body**: `{ resolution_note?: string (0..2000) }`.
- **Side effects**: sets `resolved_at = now()`, `resolved_by = user.id`, `resolution_note = body`.
- **Errors**: 409 if already resolved.

### Hook — `useShipmentIssues.ts`

- `useShipmentIssues(shipmentId)` → `useQuery` returning issue rows joined with author email/name (from `express_staff`).
- `useCreateShipmentIssue()` → `useMutation` invalidating the issues query + the shipment-list query (for the badge count).
- `useResolveShipmentIssue()` → `useMutation` invalidating the same.

### UI

#### `LogIssueModal.tsx` (new)

- Triggered by the existing "Log issue" toolbar button (now an `onClick` instead of `disabled`).
- Requires a shipment selected; if none, the button is disabled (same UX as the current "Approve" button).
- Fields:
  - Category `<Select>` — labels from i18n, values are the enum.
  - Note `<Textarea>` — required, 1..2000 chars.
- Submit calls `useCreateShipmentIssue`. On success: toast + close + timeline refreshes.

#### `IssueTimelineEntry.tsx` (new)

- Rendered inside the existing activity timeline in `InboxDetail.tsx`.
- Shows: category chip, note, author, created_at, Resolve button (if unresolved), resolution note + resolver (if resolved).
- Clicking Resolve opens a small second modal for optional resolution note → `useResolveShipmentIssue`.

#### Inbox list badge

- Extend [`useStaffShipmentList.ts`](express/src/hooks/useStaffShipmentList.ts) SELECT with an aggregate: `open_issues_count:express_shipment_issues!shipment_id(count).eq(resolved_at,null)`. Confirm Supabase's exact filter-on-relation syntax during implementation; fall back to a small RPC if it doesn't express cleanly.
- In the inbox list UI, render a 6-px red dot next to the shipment number when `open_issues_count > 0`.

### i18n keys to add

Under `staff.inbox.issues.*`:

- `modal.title`, `modal.category`, `modal.note`, `modal.submit`, `modal.cancel`
- `resolve.title`, `resolve.note`, `resolve.confirm`
- `category.wrong_address`, `category.unreachable`, `category.damaged`, `category.delayed`, `category.customer_change`, `category.other`
- `timeline.openedBy`, `timeline.resolvedBy`, `badge.unresolved` (aria-label)

## Edit

### Scope

Editable fields:

- `recipient_name`, `recipient_phone` (stored on `express_addresses` with `address_type = 'korea_pickup'`)
- `kr_province`, `kr_city`, `kr_street`, `kr_building`, `kr_detail`
- `pickup_scheduled_at` (stored on `express_shipments`)

Read-only in this modal: boxes, Mongolia address, status, user note, cost.

### Status gating

Edits allowed when `shipment.status` is one of:
`request_created`, `request_approved`, `pickup_scheduled`, `picked_up`, `at_korea_warehouse`.

Edits blocked once `in_transit` or later — UI shows the button disabled with a tooltip; server returns 409 even if the client tries.

### API route

#### `PATCH /api/express/shipments/[id]`

- **Auth**: active `korea_admin` staff.
- **Body** (all optional, at least one required): `{ recipient_name?, recipient_phone?, korea_address?: { kr_province?, kr_city?, kr_street?, kr_building?, kr_detail? }, pickup_scheduled_at?: string | null }`.
- **Logic**:
  1. Fetch `express_shipments` row + `korea_address` relation.
  2. If status is beyond the gate, return 409.
  3. Compute a list of changed fields (server-side diff against current values; ignore no-ops).
  4. Update `express_addresses` (using the address's id) if any address field changed OR recipient changed.
  5. Update `express_shipments` if `pickup_scheduled_at` changed.
  6. Insert an activity entry in `express_status_history`: `previous_status = current`, `new_status = current`, `note = "Edited: {changed fields joined}"`. Status history stays status-only for actual status transitions — the edit entry is disambiguated by the note prefix.
- **Response**: refreshed shipment row.

### Hook — `useShipmentUpdate.ts`

`useMutation` that POSTs the patch and invalidates: the shipment detail, the staff shipment list, the activity timeline.

### UI — `EditShipmentModal.tsx` (new)

- Triggered by the existing "Edit" button (now an `onClick` instead of inert).
- Modal matches the existing payment-confirmation dialog style.
- React-hook-form + Zod patch schema. Initial values from current shipment; uses the existing Korea address picker + street/building/detail inputs from the sender form.
- `pickup_scheduled_at` uses `<input type="datetime-local">`. Clearing it sets null.
- Save button disabled until form is dirty. Cancel just closes.
- On success: toast, close, queries invalidate, detail panel re-renders with new values.

### Zod schema

A new `editShipmentSchema` colocated with the modal, mirroring `koreaAddressSchema`'s field constraints but all optional. Max 50 chars for province/city, 200 for street, 100 for building, 200 for detail, 7..30 for phone, 1..100 for recipient_name. pickup_scheduled_at accepts ISO string or null.

### i18n keys to add

Under `staff.inbox.edit.*`:

- `title`, `recipient`, `phone`, `pickupTime`, `pickupTimeClear`
- `save`, `cancel`, `saved`, `noChanges`, `lockedAfterTransit`

## Out of scope

- Mongolia address edits (separate modal later if needed — delivery-side fixes are less frequent).
- Box-level edits (weight, description) — stays in the intake wizard where it belongs.
- Issue auto-assignment / notifications.
- A dedicated Issues inbox view — issues live inside the shipment detail only for v1.

## Verification

1. **Migration**: `npx supabase db push`. Confirm `express_shipment_issues` table + indexes + RLS.
2. **Typecheck + lint**: `npx tsc --noEmit` and `npx eslint src` in `express/` — both clean.
3. **Removals**: Saved views and Print label buttons are gone from toolbar and detail panel. No dead i18n keys trigger lint warnings.
4. **Log issue happy path**: Select a shipment → Log issue → pick "wrong_address", note "needs street" → submit. Timeline shows the entry; inbox list row shows a red dot. Click Resolve with note "confirmed with customer" → entry shows as resolved; red dot disappears.
5. **Edit happy path**: Select a shipment in `request_created` → Edit → change recipient name and pickup time → Save. Detail panel reflects change; activity timeline shows "Edited: recipient_name, pickup_scheduled_at".
6. **Edit gate**: Edit an `in_transit` shipment → button is disabled with tooltip; if forced via DevTools, API returns 409 and toast reflects the block.
7. **Permissions**: Sign in as non-staff user → Log issue POST returns 403; Edit PATCH returns 403.
8. **Browser**: test in the Korea inbox in `ko` + `en` locales. Labels localized correctly.

## Rollback

The migration is reversible:

```sql
DROP TABLE IF EXISTS express_shipment_issues;
```

Removals are reversible via `git revert`. The new features ship behind no flag — if either breaks, revert the commit and the DB migration (issues table is orphan, safe to drop).
