# Korea Inbox Buttons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the Korea staff inbox from rendering fake buttons — remove Saved views + Print label, ship working Log issue + Edit shipment flows.

**Architecture:** Two small deletes (Saved views, Print label) plus two new features that reuse the existing staff-auth + activity-timeline + modal patterns already in the app. Log issue gets a new `express_shipment_issues` table; Edit reuses `express_addresses` + `express_shipments` and records an activity entry in `express_status_history`. Status-gated server-side (409 if past `in_transit`).

**Tech Stack:** Next.js 16 App Router · React 19 · TanStack Query · react-hook-form + Zod · Supabase (Postgres + RLS) · shadcn/Radix · Tailwind · sonner (toasts) · flat JSON i18n (en/ko/mn).

**Spec:** [docs/superpowers/specs/2026-04-23-inbox-buttons-design.md](docs/superpowers/specs/2026-04-23-inbox-buttons-design.md)

---

## File map

**Delete/modify:**

- `express/src/components/staff/korea/InboxToolbar.tsx` — drop Saved views, wire Log issue
- `express/src/components/staff/korea/InboxDetail.tsx` — drop Print label, wire Edit
- `express/src/components/staff/korea/ActivityFeed.tsx` — render issue entries
- `express/src/components/staff/korea/ShipmentListCard.tsx` — red dot for unresolved issues
- `express/src/hooks/useStaffShipmentList.ts` — include open_issues_count
- `express/src/lib/i18n/dictionaries/{en,ko,mn}.json` — add/remove keys
- `express/src/types/express.ts` — add `ExpressShipmentIssue`, `IssueCategory`

**Create:**

- `express/supabase/migrations/015_express_shipment_issues.sql`
- `express/src/app/api/express/shipments/[id]/issues/route.ts`
- `express/src/app/api/express/shipments/[id]/issues/[issueId]/resolve/route.ts`
- `express/src/app/api/express/shipments/[id]/route.ts` (PATCH)
- `express/src/hooks/useShipmentIssues.ts`
- `express/src/hooks/useShipmentUpdate.ts`
- `express/src/components/staff/korea/LogIssueModal.tsx`
- `express/src/components/staff/korea/IssueTimelineEntry.tsx`
- `express/src/components/staff/korea/EditShipmentModal.tsx`
- `express/src/components/staff/korea/editSchema.ts`

---

## Phase 1 — Removals

### Task 1: Remove Saved views button

**Files:**

- Modify: `express/src/components/staff/korea/InboxToolbar.tsx`
- Modify: `express/src/lib/i18n/dictionaries/{en,ko,mn}.json`

- [ ] **Step 1: Remove the `<PillButton>` block and now-unused import**

In `express/src/components/staff/korea/InboxToolbar.tsx`, delete lines 63–70 (the whole Saved views `<PillButton>`). Remove `ChevronDown` from the `lucide-react` import on line 5 if no other usage remains.

- [ ] **Step 2: Remove the i18n key from all three dictionaries**

Remove `"staff.inbox.savedViews": ...` line from each of:

- `express/src/lib/i18n/dictionaries/en.json`
- `express/src/lib/i18n/dictionaries/ko.json`
- `express/src/lib/i18n/dictionaries/mn.json`

- [ ] **Step 3: Typecheck + lint**

```bash
cd express && npx tsc --noEmit && npx eslint src/components/staff/korea/InboxToolbar.tsx
```

Expected: exit 0 both.

- [ ] **Step 4: Commit**

```bash
git add express/src/components/staff/korea/InboxToolbar.tsx express/src/lib/i18n/dictionaries/
git commit -m "feat(express/inbox): remove stub Saved views button"
```

---

### Task 2: Remove Print label button

**Files:**

- Modify: `express/src/components/staff/korea/InboxDetail.tsx`
- Modify: `express/src/lib/i18n/dictionaries/{en,ko,mn}.json`

- [ ] **Step 1: Remove the Print label `<button>` block**

In `express/src/components/staff/korea/InboxDetail.tsx`, delete the button at lines 157–162:

```tsx
<button
  type="button"
  className="inline-flex h-9 cursor-pointer items-center rounded-full border border-line bg-transparent px-4 font-sans text-[12px] font-medium tracking-[0.01em] text-text transition-colors hover:border-text"
>
  {t("staff.inbox.printLabel")}
</button>
```

- [ ] **Step 2: Remove i18n key from all three dictionaries**

Remove `"staff.inbox.printLabel": ...` line from each of `en.json`, `ko.json`, `mn.json`. Keep `"staff.intake.scan.printLabel"` — that's used in the intake wizard.

- [ ] **Step 3: Typecheck + lint**

```bash
cd express && npx tsc --noEmit && npx eslint src/components/staff/korea/InboxDetail.tsx
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add express/src/components/staff/korea/InboxDetail.tsx express/src/lib/i18n/dictionaries/
git commit -m "feat(express/inbox): remove stub Print label button"
```

---

## Phase 2 — Log issue (backend)

### Task 3: Create `express_shipment_issues` table + RLS

**Files:**

- Create: `express/supabase/migrations/015_express_shipment_issues.sql`

- [ ] **Step 1: Write the migration**

Create `express/supabase/migrations/015_express_shipment_issues.sql`:

```sql
-- Staff-logged issues against a shipment: wrong address, unreachable
-- customer, damage, delays, etc. Resolvable by any staff member. Used
-- to decorate the inbox list (unresolved red-dot) and the activity
-- timeline in the shipment detail panel.

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

CREATE POLICY "Staff can read all issues"
  ON express_shipment_issues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM express_staff
      WHERE express_staff.user_id = auth.uid()
        AND express_staff.is_active = TRUE
    )
  );

CREATE POLICY "Staff can insert issues"
  ON express_shipment_issues FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM express_staff
      WHERE express_staff.user_id = auth.uid()
        AND express_staff.is_active = TRUE
    )
  );

CREATE POLICY "Staff can update issues"
  ON express_shipment_issues FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM express_staff
      WHERE express_staff.user_id = auth.uid()
        AND express_staff.is_active = TRUE
    )
  );

COMMENT ON TABLE express_shipment_issues IS
  'Staff-logged issues against a shipment. Append-only except for resolve fields.';
```

- [ ] **Step 2: Apply the migration**

```bash
cd express && npx supabase db push
```

Expected: "Applied migration 015_express_shipment_issues.sql".

- [ ] **Step 3: Verify in psql**

```bash
npx supabase db psql -c "\d express_shipment_issues"
```

Expected: table with 10 columns, 2 indexes, 3 policies.

- [ ] **Step 4: Commit**

```bash
git add express/supabase/migrations/015_express_shipment_issues.sql
git commit -m "feat(express/issues): add express_shipment_issues table + RLS"
```

---

### Task 4: Add TypeScript types for issues

**Files:**

- Modify: `express/src/types/express.ts`

- [ ] **Step 1: Add types at the bottom of the file**

Append to `express/src/types/express.ts`:

```ts
export const ISSUE_CATEGORIES = [
  "wrong_address",
  "unreachable",
  "damaged",
  "delayed",
  "customer_change",
  "other",
] as const;

export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];

export interface ExpressShipmentIssue {
  id: string;
  shipment_id: string;
  category: IssueCategory;
  note: string;
  created_by: string;
  created_at: string;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
}
```

- [ ] **Step 2: Typecheck**

```bash
cd express && npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add express/src/types/express.ts
git commit -m "feat(express/issues): add ExpressShipmentIssue + IssueCategory types"
```

---

### Task 5: Create issues API routes

**Files:**

- Create: `express/src/app/api/express/shipments/[id]/issues/route.ts`
- Create: `express/src/app/api/express/shipments/[id]/issues/[issueId]/resolve/route.ts`

- [ ] **Step 1: Write the POST /issues route**

Create `express/src/app/api/express/shipments/[id]/issues/route.ts`:

```ts
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { ISSUE_CATEGORIES, type IssueCategory } from "@/types/express";

/**
 * Log an issue against a shipment.
 *
 * POST /api/express/shipments/[id]/issues
 *   - Auth: any active express_staff row.
 *   - Body: { category: IssueCategory, note: string (1..2000) }
 *   - Returns: the inserted issue row.
 */

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: shipmentId } = await context.params;

  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const admin = createAdminClient();
  const { data: staff } = await admin
    .from("express_staff")
    .select("role,is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();
  if (!staff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { category?: unknown; note?: unknown };
  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const category = body.category as IssueCategory;
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (!ISSUE_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (note.length < 1 || note.length > 2000) {
    return NextResponse.json({ error: "Note must be 1..2000 characters" }, { status: 400 });
  }

  const { data: shipment, error: shipErr } = await admin
    .from("express_shipments")
    .select("id")
    .eq("id", shipmentId)
    .single();
  if (shipErr || !shipment) {
    return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  }

  const { data: issue, error: insErr } = await admin
    .from("express_shipment_issues")
    .insert({
      shipment_id: shipmentId,
      category,
      note,
      created_by: user.id,
    })
    .select()
    .single();
  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }
  return NextResponse.json({ issue });
}
```

- [ ] **Step 2: Write the POST /issues/[issueId]/resolve route**

Create `express/src/app/api/express/shipments/[id]/issues/[issueId]/resolve/route.ts`:

```ts
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Resolve an open issue.
 *
 * POST /api/express/shipments/[id]/issues/[issueId]/resolve
 *   - Auth: any active express_staff row.
 *   - Body (optional): { resolution_note?: string (0..2000) }
 *   - 409 if already resolved.
 */

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; issueId: string }> },
) {
  const { id: shipmentId, issueId } = await context.params;

  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const admin = createAdminClient();
  const { data: staff } = await admin
    .from("express_staff")
    .select("is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();
  if (!staff) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let resolutionNote = "";
  try {
    const body = (await request.json().catch(() => ({}))) as {
      resolution_note?: unknown;
    };
    if (typeof body.resolution_note === "string") {
      resolutionNote = body.resolution_note.trim();
    }
  } catch {
    // no body — fine
  }
  if (resolutionNote.length > 2000) {
    return NextResponse.json({ error: "Resolution note too long" }, { status: 400 });
  }

  const { data: existing, error: fetchErr } = await admin
    .from("express_shipment_issues")
    .select("id,resolved_at")
    .eq("id", issueId)
    .eq("shipment_id", shipmentId)
    .single();
  if (fetchErr || !existing) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }
  if (existing.resolved_at) {
    return NextResponse.json({ error: "Issue already resolved" }, { status: 409 });
  }

  const { data: issue, error: updErr } = await admin
    .from("express_shipment_issues")
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
      resolution_note: resolutionNote || null,
    })
    .eq("id", issueId)
    .select()
    .single();
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }
  return NextResponse.json({ issue });
}
```

- [ ] **Step 3: Typecheck + lint**

```bash
cd express && npx tsc --noEmit && npx eslint src/app/api/express/shipments
```

Expected: exit 0.

- [ ] **Step 4: Smoke-test with curl (optional but recommended)**

With the dev server running and a logged-in staff cookie:

```bash
curl -X POST http://localhost:3002/api/express/shipments/<REAL_ID>/issues \
  -H "Content-Type: application/json" \
  -d '{"category":"wrong_address","note":"Needs street number"}' \
  -H "Cookie: <paste auth cookie>"
```

Expected: `{"issue":{...}}` with status 200 and a new row visible in Supabase Studio.

- [ ] **Step 5: Commit**

```bash
git add express/src/app/api/express/shipments/[id]/issues
git commit -m "feat(express/issues): POST issue + resolve API routes"
```

---

## Phase 3 — Log issue (frontend)

### Task 6: Add i18n keys for issues

**Files:**

- Modify: `express/src/lib/i18n/dictionaries/{en,ko,mn}.json`

- [ ] **Step 1: Add the English keys**

In `express/src/lib/i18n/dictionaries/en.json`, immediately before `"address.korea":` add:

```json
  "staff.inbox.issues.modal.title": "Log an issue",
  "staff.inbox.issues.modal.category": "Category",
  "staff.inbox.issues.modal.note": "Note",
  "staff.inbox.issues.modal.notePlaceholder": "Briefly describe the issue",
  "staff.inbox.issues.modal.submit": "Log issue",
  "staff.inbox.issues.modal.cancel": "Cancel",
  "staff.inbox.issues.resolve.title": "Resolve issue",
  "staff.inbox.issues.resolve.note": "Resolution note (optional)",
  "staff.inbox.issues.resolve.confirm": "Mark resolved",
  "staff.inbox.issues.timeline.openedBy": "Opened by {name}",
  "staff.inbox.issues.timeline.resolvedBy": "Resolved by {name}",
  "staff.inbox.issues.badge.unresolved": "{count} unresolved issue(s)",
  "staff.inbox.issues.category.wrong_address": "Wrong address",
  "staff.inbox.issues.category.unreachable": "Can't reach customer",
  "staff.inbox.issues.category.damaged": "Damaged",
  "staff.inbox.issues.category.delayed": "Delayed",
  "staff.inbox.issues.category.customer_change": "Customer requested change",
  "staff.inbox.issues.category.other": "Other",
  "staff.inbox.issues.logged": "Issue logged",
  "staff.inbox.issues.resolved": "Issue resolved",
```

- [ ] **Step 2: Add the Korean keys**

In `express/src/lib/i18n/dictionaries/ko.json`, in the same position:

```json
  "staff.inbox.issues.modal.title": "이슈 기록",
  "staff.inbox.issues.modal.category": "분류",
  "staff.inbox.issues.modal.note": "메모",
  "staff.inbox.issues.modal.notePlaceholder": "이슈를 간단히 설명하세요",
  "staff.inbox.issues.modal.submit": "이슈 기록",
  "staff.inbox.issues.modal.cancel": "취소",
  "staff.inbox.issues.resolve.title": "이슈 해결",
  "staff.inbox.issues.resolve.note": "해결 메모 (선택)",
  "staff.inbox.issues.resolve.confirm": "해결 처리",
  "staff.inbox.issues.timeline.openedBy": "{name} 기록",
  "staff.inbox.issues.timeline.resolvedBy": "{name} 해결",
  "staff.inbox.issues.badge.unresolved": "미해결 이슈 {count}건",
  "staff.inbox.issues.category.wrong_address": "잘못된 주소",
  "staff.inbox.issues.category.unreachable": "고객 연락 불가",
  "staff.inbox.issues.category.damaged": "파손",
  "staff.inbox.issues.category.delayed": "지연",
  "staff.inbox.issues.category.customer_change": "고객 변경 요청",
  "staff.inbox.issues.category.other": "기타",
  "staff.inbox.issues.logged": "이슈 기록됨",
  "staff.inbox.issues.resolved": "이슈 해결됨",
```

- [ ] **Step 3: Add the Mongolian keys**

In `express/src/lib/i18n/dictionaries/mn.json`, in the same position:

```json
  "staff.inbox.issues.modal.title": "Асуудал бүртгэх",
  "staff.inbox.issues.modal.category": "Ангилал",
  "staff.inbox.issues.modal.note": "Тайлбар",
  "staff.inbox.issues.modal.notePlaceholder": "Асуудлыг товч тайлбарлана уу",
  "staff.inbox.issues.modal.submit": "Бүртгэх",
  "staff.inbox.issues.modal.cancel": "Цуцлах",
  "staff.inbox.issues.resolve.title": "Асуудлыг шийдвэрлэх",
  "staff.inbox.issues.resolve.note": "Шийдлийн тайлбар (сонголтоор)",
  "staff.inbox.issues.resolve.confirm": "Шийдэгдсэн болгох",
  "staff.inbox.issues.timeline.openedBy": "{name} бүртгэсэн",
  "staff.inbox.issues.timeline.resolvedBy": "{name} шийдвэрлэсэн",
  "staff.inbox.issues.badge.unresolved": "{count} шийдэгдээгүй асуудал",
  "staff.inbox.issues.category.wrong_address": "Буруу хаяг",
  "staff.inbox.issues.category.unreachable": "Үйлчлүүлэгчтэй холбогдож чадаагүй",
  "staff.inbox.issues.category.damaged": "Гэмтсэн",
  "staff.inbox.issues.category.delayed": "Хойшилсон",
  "staff.inbox.issues.category.customer_change": "Үйлчлүүлэгчийн өөрчлөлт",
  "staff.inbox.issues.category.other": "Бусад",
  "staff.inbox.issues.logged": "Асуудал бүртгэгдлээ",
  "staff.inbox.issues.resolved": "Асуудал шийдэгдлээ",
```

- [ ] **Step 4: Commit**

```bash
git add express/src/lib/i18n/dictionaries/
git commit -m "feat(express/issues): add i18n keys for issue modal + timeline"
```

---

### Task 7: Create useShipmentIssues hooks

**Files:**

- Create: `express/src/hooks/useShipmentIssues.ts`

- [ ] **Step 1: Write the hooks**

Create `express/src/hooks/useShipmentIssues.ts`:

```ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import type { ExpressShipmentIssue, IssueCategory } from "@/types/express";

export function useShipmentIssues(shipmentId: string | undefined) {
  return useQuery<ExpressShipmentIssue[]>({
    queryKey: ["shipment-issues", shipmentId],
    enabled: !!shipmentId,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("express_shipment_issues")
        .select("*")
        .eq("shipment_id", shipmentId!)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as ExpressShipmentIssue[];
    },
  });
}

export function useCreateShipmentIssue(shipmentId: string) {
  const qc = useQueryClient();
  return useMutation<ExpressShipmentIssue, Error, { category: IssueCategory; note: string }>({
    mutationFn: async ({ category, note }) => {
      const res = await fetch(`/api/express/shipments/${shipmentId}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, note }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "Failed to log issue");
      return payload.issue as ExpressShipmentIssue;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shipment-issues", shipmentId] });
      qc.invalidateQueries({ queryKey: queryKeys.shipments.all });
    },
  });
}

export function useResolveShipmentIssue(shipmentId: string) {
  const qc = useQueryClient();
  return useMutation<ExpressShipmentIssue, Error, { issueId: string; resolution_note?: string }>({
    mutationFn: async ({ issueId, resolution_note }) => {
      const res = await fetch(`/api/express/shipments/${shipmentId}/issues/${issueId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution_note: resolution_note ?? "" }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "Failed to resolve");
      return payload.issue as ExpressShipmentIssue;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shipment-issues", shipmentId] });
      qc.invalidateQueries({ queryKey: queryKeys.shipments.all });
    },
  });
}
```

- [ ] **Step 2: Typecheck + lint**

```bash
cd express && npx tsc --noEmit && npx eslint src/hooks/useShipmentIssues.ts
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add express/src/hooks/useShipmentIssues.ts
git commit -m "feat(express/issues): hooks for fetching, creating, resolving issues"
```

---

### Task 8: Create LogIssueModal component

**Files:**

- Create: `express/src/components/staff/korea/LogIssueModal.tsx`

- [ ] **Step 1: Write the modal**

Create `express/src/components/staff/korea/LogIssueModal.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateShipmentIssue } from "@/hooks/useShipmentIssues";
import { ISSUE_CATEGORIES, type IssueCategory } from "@/types/express";

type Props = {
  shipmentId: string;
  open: boolean;
  onClose: () => void;
};

export function LogIssueModal({ shipmentId, open, onClose }: Props) {
  const t = useTranslations();
  const [category, setCategory] = useState<IssueCategory>("wrong_address");
  const [note, setNote] = useState("");
  const create = useCreateShipmentIssue(shipmentId);

  if (!open) return null;

  const canSubmit = note.trim().length > 0 && !create.isPending;

  async function handleSubmit() {
    try {
      await create.mutateAsync({ category, note: note.trim() });
      toast.success(t("staff.inbox.issues.logged"));
      setNote("");
      setCategory("wrong_address");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    }
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--ink)_55%,transparent)] p-4 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-issue-title"
        className="w-full max-w-[480px] rounded-ec border border-line bg-chrome p-7 shadow-[0_24px_60px_rgba(0,0,0,0.22)]"
      >
        <h3 id="log-issue-title" className="font-serif text-2xl font-light tracking-[-0.02em]">
          {t("staff.inbox.issues.modal.title")}
        </h3>

        <div className="mt-5 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">
              {t("staff.inbox.issues.modal.category")}
            </label>
            <Select value={category} onValueChange={(v) => setCategory(v as IssueCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ISSUE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`staff.inbox.issues.category.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="issue-note"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim"
            >
              {t("staff.inbox.issues.modal.note")}
            </label>
            <textarea
              id="issue-note"
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("staff.inbox.issues.modal.notePlaceholder")}
              maxLength={2000}
              className="min-h-24 w-full resize-y rounded-ec border border-line bg-transparent px-[14px] py-3 font-sans text-sm text-text outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-[10px]">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 cursor-pointer items-center rounded-full border border-line bg-transparent px-[16px] font-mono text-[12px] font-medium text-text transition-colors hover:border-text"
          >
            {t("staff.inbox.issues.modal.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex h-9 cursor-pointer items-center gap-[6px] rounded-full border border-transparent bg-text px-[16px] font-mono text-[12px] font-medium text-bg transition-colors hover:bg-amber hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {create.isPending && <Loader2 size={12} className="animate-spin" />}
            {t("staff.inbox.issues.modal.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

```bash
cd express && npx tsc --noEmit && npx eslint src/components/staff/korea/LogIssueModal.tsx
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add express/src/components/staff/korea/LogIssueModal.tsx
git commit -m "feat(express/issues): LogIssueModal component"
```

---

### Task 9: Wire up "Log issue" toolbar button

**Files:**

- Modify: `express/src/components/staff/korea/InboxToolbar.tsx`

- [ ] **Step 1: Add props so the toolbar can receive the selected shipment**

At the top of `InboxToolbar.tsx`, change the component signature to accept a selected shipment id. Replace:

```tsx
export function InboxToolbar() {
```

with:

```tsx
type Props = { selectedShipmentId: string | null };

export function InboxToolbar({ selectedShipmentId }: Props) {
```

- [ ] **Step 2: Add state + import for the modal**

Add these imports at the top:

```tsx
import { LogIssueModal } from "./LogIssueModal";
```

Inside the component, add state after the existing `const [exporting, setExporting] = useState(false);`:

```tsx
const [issueOpen, setIssueOpen] = useState(false);
```

- [ ] **Step 3: Replace the disabled Log issue button**

Replace the existing disabled Log issue `<PillButton>` (currently the third PillButton) with:

```tsx
<PillButton
  variant="primary"
  onClick={() => setIssueOpen(true)}
  disabled={!selectedShipmentId}
  title={selectedShipmentId ? undefined : t("staff.selectToView")}
>
  <Plus size={12} className="mr-[6px]" />
  {t("staff.inbox.logIssue")}
</PillButton>
```

- [ ] **Step 4: Render the modal at the bottom of the returned JSX**

Right before the closing `</div>` of the outermost `<div className="flex flex-wrap items-center gap-2">`, ADD the modal OUTSIDE that wrapper. Wrap the whole component's return in a fragment. Final structure:

```tsx
return (
  <>
    <div className="flex flex-wrap items-center gap-2">{/* ...existing PillButtons... */}</div>
    {selectedShipmentId && (
      <LogIssueModal
        shipmentId={selectedShipmentId}
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
      />
    )}
  </>
);
```

- [ ] **Step 5: Find the parent that renders `<InboxToolbar />` and pass selectedShipmentId**

```bash
cd express && grep -rn "<InboxToolbar" src/
```

Open the parent file (likely `src/app/[locale]/(staff)/korea/inbox/page.tsx` or a layout/client component). Locate where the selected shipment id lives (typically a `selectedId` or query-string state). Update the invocation:

```tsx
<InboxToolbar selectedShipmentId={selectedId} />
```

If the selected id isn't present at that level, lift it up or use nuqs (already a dependency) to share via URL — the cleanest approach is to read it from the URL search param where the list already syncs it.

- [ ] **Step 6: Typecheck + lint**

```bash
cd express && npx tsc --noEmit && npx eslint src/components/staff/korea/InboxToolbar.tsx
```

Expected: exit 0.

- [ ] **Step 7: Manual smoke test**

Run `npm run dev`, log in as a staff user, navigate to the Korea inbox, select a shipment, click "Log issue", fill the form, submit. Confirm:

- Toast "Issue logged" fires.
- Modal closes.
- New row in `express_shipment_issues` in Supabase Studio.

- [ ] **Step 8: Commit**

```bash
git add express/src/components/staff/korea/InboxToolbar.tsx \
  $(git ls-files -m src/app src/components/staff/korea)
git commit -m "feat(express/issues): wire Log issue toolbar button to modal"
```

---

### Task 10: IssueTimelineEntry + ActivityFeed integration

**Files:**

- Create: `express/src/components/staff/korea/IssueTimelineEntry.tsx`
- Modify: `express/src/components/staff/korea/ActivityFeed.tsx`

- [ ] **Step 1: Write IssueTimelineEntry component**

Create `express/src/components/staff/korea/IssueTimelineEntry.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n/client";
import { useResolveShipmentIssue } from "@/hooks/useShipmentIssues";
import type { ExpressShipmentIssue } from "@/types/express";

type Props = {
  shipmentId: string;
  issue: ExpressShipmentIssue;
};

function formatTs(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

export function IssueTimelineEntry({ shipmentId, issue }: Props) {
  const t = useTranslations();
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const resolve = useResolveShipmentIssue(shipmentId);
  const isResolved = !!issue.resolved_at;

  async function handleResolve() {
    try {
      await resolve.mutateAsync({
        issueId: issue.id,
        resolution_note: resolutionNote.trim() || undefined,
      });
      toast.success(t("staff.inbox.issues.resolved"));
      setResolveOpen(false);
      setResolutionNote("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    }
  }

  return (
    <>
      <div className="font-mono text-[11px] tabular-nums tracking-[0.04em] text-text-dim">
        {formatTs(issue.created_at)}
      </div>
      <div className="mt-[6px] flex items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-line px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.1em] text-text-dim">
          {t(`staff.inbox.issues.category.${issue.category}`)}
        </span>
        {!isResolved && (
          <button
            type="button"
            onClick={() => setResolveOpen(true)}
            className="font-mono text-[11px] uppercase tracking-[0.1em] text-amber underline-offset-2 hover:underline"
          >
            {t("staff.inbox.issues.resolve.confirm")}
          </button>
        )}
      </div>
      <div
        className={`mt-1 text-[13px] leading-[1.5] ${
          isResolved ? "text-text-dim line-through" : "text-text"
        }`}
      >
        {issue.note}
      </div>
      {isResolved && issue.resolution_note && (
        <div className="mt-1 text-[12px] italic leading-[1.5] text-text-dim">
          {issue.resolution_note}
        </div>
      )}

      {resolveOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setResolveOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--ink)_55%,transparent)] p-4 backdrop-blur-sm"
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-[420px] rounded-ec border border-line bg-chrome p-7 shadow-[0_24px_60px_rgba(0,0,0,0.22)]"
          >
            <h3 className="font-serif text-xl font-light tracking-[-0.02em]">
              {t("staff.inbox.issues.resolve.title")}
            </h3>
            <label className="mt-4 block font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">
              {t("staff.inbox.issues.resolve.note")}
            </label>
            <textarea
              rows={3}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              maxLength={2000}
              className="mt-2 min-h-20 w-full resize-y rounded-ec border border-line bg-transparent px-[14px] py-3 font-sans text-sm text-text outline-none"
            />
            <div className="mt-5 flex justify-end gap-[10px]">
              <button
                type="button"
                onClick={() => setResolveOpen(false)}
                className="inline-flex h-9 cursor-pointer items-center rounded-full border border-line bg-transparent px-[16px] font-mono text-[12px] font-medium text-text transition-colors hover:border-text"
              >
                {t("staff.inbox.issues.modal.cancel")}
              </button>
              <button
                type="button"
                onClick={handleResolve}
                disabled={resolve.isPending}
                className="inline-flex h-9 cursor-pointer items-center gap-[6px] rounded-full border border-transparent bg-text px-[16px] font-mono text-[12px] font-medium text-bg transition-colors hover:bg-amber hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resolve.isPending && <Loader2 size={12} className="animate-spin" />}
                {t("staff.inbox.issues.resolve.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Integrate into ActivityFeed**

In `express/src/components/staff/korea/ActivityFeed.tsx`, add at the top:

```tsx
import { useShipmentIssues } from "@/hooks/useShipmentIssues";
import { IssueTimelineEntry } from "./IssueTimelineEntry";
```

In the component body, fetch issues alongside the existing activity entries:

```tsx
const { data: issues = [] } = useShipmentIssues(shipmentId);
```

Merge issue entries into the timeline. At the point where `entries.map(...)` renders existing items, produce a combined sorted list. Replace the existing render block (roughly lines 16–58) with:

```tsx
type TimelineItem =
  | { kind: "activity"; id: string; created_at: string; el: React.ReactNode }
  | { kind: "issue"; id: string; created_at: string; el: React.ReactNode };

const activityItems: TimelineItem[] = entries.map((entry) => ({
  kind: "activity",
  id: entry.id,
  created_at: entry.created_at,
  el: (
    <>
      <div className="font-mono text-[11px] tabular-nums tracking-[0.04em] text-text-dim">
        {formatTimestamp(entry.created_at)}
      </div>
      <div className="mt-[6px] font-serif text-[16px] italic tracking-[-0.01em]">
        {entry.actorName}
      </div>
      <div className="mt-1 text-[13px] leading-[1.5] text-text">
        {entry.message ?? t(`status.${entry.new_status}`)}
      </div>
    </>
  ),
}));

const issueItems: TimelineItem[] = issues.map((issue) => ({
  kind: "issue",
  id: `issue-${issue.id}`,
  created_at: issue.created_at,
  el: <IssueTimelineEntry shipmentId={shipmentId} issue={issue} />,
}));

const merged = [...activityItems, ...issueItems].sort(
  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
);

return (
  <ol className="mt-5 space-y-5">
    {isLoading ? (
      /* keep existing skeleton markup from current file */
    ) : merged.length === 0 ? (
      <li className="font-mono text-[11px] text-text-dim">
        {t("staff.inbox.activityEmpty")}
      </li>
    ) : (
      merged.map((item, i) => (
        <li
          key={item.id}
          className={`pb-5 ${
            i < merged.length - 1 ? "border-b border-dashed border-line" : ""
          }`}
        >
          {item.el}
        </li>
      ))
    )}
  </ol>
);
```

When re-inserting the skeleton markup, copy whatever `ActivityFeed.tsx` currently has for its `isLoading` case verbatim.

- [ ] **Step 3: Typecheck + lint**

```bash
cd express && npx tsc --noEmit && npx eslint src/components/staff/korea/ActivityFeed.tsx src/components/staff/korea/IssueTimelineEntry.tsx
```

Expected: exit 0.

- [ ] **Step 4: Manual smoke test**

Log an issue on a shipment (via Task 9 flow) and verify it appears in the activity timeline interleaved by timestamp. Click Resolve, confirm strikethrough + resolution note render. No console errors.

- [ ] **Step 5: Commit**

```bash
git add express/src/components/staff/korea/IssueTimelineEntry.tsx \
  express/src/components/staff/korea/ActivityFeed.tsx
git commit -m "feat(express/issues): render issues inside activity timeline"
```

---

### Task 11: Red-dot badge on inbox list rows

**Files:**

- Modify: `express/src/hooks/useStaffShipmentList.ts`
- Modify: `express/src/components/staff/korea/ShipmentListCard.tsx`

- [ ] **Step 1: Extend the SELECT in useStaffShipmentList**

Open `express/src/hooks/useStaffShipmentList.ts` and find the `.select(...)` call near line 58–60. Append `open_issues:express_shipment_issues!shipment_id(id)` to the existing select string so the result includes unresolved issues:

```ts
.select(
  "*,korea_address:express_addresses!korea_address_id(kr_city,kr_province,recipient_name),mongolia_address:express_addresses!mongolia_address_id(mn_city,recipient_name),open_issues:express_shipment_issues!shipment_id(id,resolved_at)",
)
```

Then, after fetching, map the row's `open_issues` into a derived count: filter client-side where `resolved_at === null`. Within the same file, wherever rows are returned to callers, add:

```ts
const withBadge = data.map((row) => ({
  ...row,
  open_issues_count:
    (row as { open_issues?: Array<{ resolved_at: string | null }> }).open_issues?.filter(
      (i) => i.resolved_at === null,
    ).length ?? 0,
}));
```

Return `withBadge` from the query function. Update the TypeScript return type to include `open_issues_count: number`.

(Rationale: Supabase PostgREST nested-relation filtering is finicky; pulling the resolved_at column and counting client-side is deterministic and avoids a brittle query-param format.)

- [ ] **Step 2: Add the red-dot badge in ShipmentListCard**

Open `express/src/components/staff/korea/ShipmentListCard.tsx` and find the JSX block that renders the shipment number (around line 59–61):

```tsx
<span className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-dim">
  {shipment.shipment_number}
</span>
```

Replace with:

```tsx
<span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-text-dim">
  {shipment.open_issues_count > 0 && (
    <span
      aria-label={t("staff.inbox.issues.badge.unresolved", {
        count: String(shipment.open_issues_count),
      })}
      className="inline-block size-[6px] shrink-0 rounded-full bg-rust"
    />
  )}
  {shipment.shipment_number}
</span>
```

If `t` isn't already imported in this file, add `import { useTranslations } from "@/lib/i18n/client";` and `const t = useTranslations();` at the top of the component.

Update the `shipment` prop type / interface in this file to include `open_issues_count: number`.

- [ ] **Step 3: Typecheck + lint**

```bash
cd express && npx tsc --noEmit && npx eslint src/hooks/useStaffShipmentList.ts src/components/staff/korea/ShipmentListCard.tsx
```

Expected: exit 0.

- [ ] **Step 4: Manual smoke test**

In the inbox list, the shipment with a newly-logged issue should show a small red dot next to its shipment number. Resolving the issue removes the dot (after the query invalidates + refetches).

- [ ] **Step 5: Commit**

```bash
git add express/src/hooks/useStaffShipmentList.ts \
  express/src/components/staff/korea/ShipmentListCard.tsx
git commit -m "feat(express/issues): red-dot badge for unresolved issues on list rows"
```

---

## Phase 4 — Edit shipment

### Task 12: PATCH /api/express/shipments/[id] route

**Files:**

- Create: `express/src/app/api/express/shipments/[id]/route.ts`

- [ ] **Step 1: Write the route**

Create `express/src/app/api/express/shipments/[id]/route.ts`:

```ts
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Edit a shipment's recipient, Korea pickup address, and pickup time.
 *
 * PATCH /api/express/shipments/[id]
 *   - Auth: active `korea_admin` staff.
 *   - Body (at least one field required): {
 *       recipient_name?: string,
 *       recipient_phone?: string,
 *       korea_address?: { kr_province?, kr_city?, kr_street?, kr_building?, kr_detail? },
 *       pickup_scheduled_at?: string | null
 *     }
 *   - 409 if shipment.status is `in_transit` or later.
 */

const LOCKED_STATUSES = new Set([
  "in_transit",
  "arrived_mongolia",
  "ready",
  "out_for_delivery",
  "ready_for_pickup",
  "completed",
]);

function isStr(v: unknown): v is string {
  return typeof v === "string";
}
function isStrOrNull(v: unknown): v is string | null {
  return v === null || typeof v === "string";
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const admin = createAdminClient();
  const { data: staff } = await admin
    .from("express_staff")
    .select("role,is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();
  if (!staff || staff.role !== "korea_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    recipient_name?: unknown;
    recipient_phone?: unknown;
    korea_address?: unknown;
    pickup_scheduled_at?: unknown;
  };
  try {
    body = (await request.json()) ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { data: shipment, error: shipErr } = await admin
    .from("express_shipments")
    .select("id,status,korea_address_id,pickup_scheduled_at")
    .eq("id", id)
    .single();
  if (shipErr || !shipment) {
    return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  }
  if (LOCKED_STATUSES.has(shipment.status)) {
    return NextResponse.json(
      { error: "Shipment is locked for edits after transit" },
      { status: 409 },
    );
  }

  // Build address update patch
  const addrPatch: Record<string, string | null> = {};
  if (isStr(body.recipient_name)) {
    addrPatch.recipient_name = body.recipient_name.trim();
  }
  if (isStr(body.recipient_phone)) {
    addrPatch.recipient_phone = body.recipient_phone.trim();
  }
  const k = body.korea_address as Record<string, unknown> | undefined;
  if (k && typeof k === "object") {
    if (isStr(k.kr_province)) addrPatch.kr_province = k.kr_province.trim();
    if (isStr(k.kr_city)) addrPatch.kr_city = k.kr_city.trim();
    if (isStr(k.kr_street)) addrPatch.kr_street = k.kr_street.trim();
    if (isStr(k.kr_building)) addrPatch.kr_building = k.kr_building.trim();
    if (isStr(k.kr_detail)) addrPatch.kr_detail = k.kr_detail.trim() || null;
  }

  // Build shipment patch
  const shipPatch: Record<string, string | null> = {};
  if (isStrOrNull(body.pickup_scheduled_at)) {
    shipPatch.pickup_scheduled_at =
      body.pickup_scheduled_at === null ? null : new Date(body.pickup_scheduled_at).toISOString();
  }

  const changed: string[] = [];

  if (Object.keys(addrPatch).length > 0) {
    const { error: updErr } = await admin
      .from("express_addresses")
      .update(addrPatch)
      .eq("id", shipment.korea_address_id);
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }
    changed.push(...Object.keys(addrPatch));
  }

  if (Object.keys(shipPatch).length > 0) {
    const { error: updErr } = await admin.from("express_shipments").update(shipPatch).eq("id", id);
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }
    changed.push(...Object.keys(shipPatch));
  }

  if (changed.length === 0) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  // Activity entry: mirror current status, use note to mark it an edit.
  await admin.from("express_status_history").insert({
    shipment_id: id,
    previous_status: shipment.status,
    new_status: shipment.status,
    changed_by: user.id,
    staff_role: "korea_admin",
    note: `Edited: ${changed.join(", ")}`,
  });

  return NextResponse.json({ ok: true, changed });
}
```

- [ ] **Step 2: Typecheck + lint**

```bash
cd express && npx tsc --noEmit && npx eslint src/app/api/express/shipments/[id]/route.ts
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add express/src/app/api/express/shipments/[id]/route.ts
git commit -m "feat(express/edit): PATCH /shipments/[id] with status gate"
```

---

### Task 13: Edit Zod schema + useShipmentUpdate hook

**Files:**

- Create: `express/src/components/staff/korea/editSchema.ts`
- Create: `express/src/hooks/useShipmentUpdate.ts`

- [ ] **Step 1: Write the Zod schema**

Create `express/src/components/staff/korea/editSchema.ts`:

```ts
import { z } from "zod";

export const editShipmentSchema = z.object({
  recipient_name: z.string().min(1, "error.required").max(100, "error.tooLong"),
  recipient_phone: z.string().min(7, "error.phoneShort").max(30, "error.tooLong"),
  kr_province: z.string().min(1, "error.required").max(50, "error.tooLong"),
  kr_city: z.string().min(1, "error.required").max(50, "error.tooLong"),
  kr_street: z.string().min(1, "error.required").max(200, "error.tooLong"),
  kr_building: z.string().min(1, "error.required").max(100, "error.tooLong"),
  kr_detail: z.string().max(200, "error.tooLong").optional().or(z.literal("")),
  // datetime-local value (YYYY-MM-DDTHH:mm) or empty string for clear
  pickup_scheduled_at: z.string().optional().or(z.literal("")),
});

export type EditShipmentInput = z.infer<typeof editShipmentSchema>;
```

- [ ] **Step 2: Write the hook**

Create `express/src/hooks/useShipmentUpdate.ts`:

```ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { EditShipmentInput } from "@/components/staff/korea/editSchema";

type PatchBody = {
  recipient_name?: string;
  recipient_phone?: string;
  korea_address?: {
    kr_province?: string;
    kr_city?: string;
    kr_street?: string;
    kr_building?: string;
    kr_detail?: string;
  };
  pickup_scheduled_at?: string | null;
};

export function buildPatch(input: EditShipmentInput, initial: EditShipmentInput): PatchBody {
  const p: PatchBody = {};
  const addr: PatchBody["korea_address"] = {};
  if (input.recipient_name !== initial.recipient_name) {
    p.recipient_name = input.recipient_name;
  }
  if (input.recipient_phone !== initial.recipient_phone) {
    p.recipient_phone = input.recipient_phone;
  }
  if (input.kr_province !== initial.kr_province) {
    addr.kr_province = input.kr_province;
  }
  if (input.kr_city !== initial.kr_city) addr.kr_city = input.kr_city;
  if (input.kr_street !== initial.kr_street) addr.kr_street = input.kr_street;
  if (input.kr_building !== initial.kr_building) {
    addr.kr_building = input.kr_building;
  }
  if ((input.kr_detail ?? "") !== (initial.kr_detail ?? "")) {
    addr.kr_detail = input.kr_detail ?? "";
  }
  if (Object.keys(addr).length > 0) p.korea_address = addr;
  if ((input.pickup_scheduled_at ?? "") !== (initial.pickup_scheduled_at ?? "")) {
    p.pickup_scheduled_at = input.pickup_scheduled_at ? input.pickup_scheduled_at : null;
  }
  return p;
}

export function useShipmentUpdate(shipmentId: string) {
  const qc = useQueryClient();
  return useMutation<{ ok: true; changed: string[] }, Error, PatchBody>({
    mutationFn: async (patch) => {
      const res = await fetch(`/api/express/shipments/${shipmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "Failed to update");
      return payload;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.shipments.all });
    },
  });
}
```

- [ ] **Step 3: Typecheck + lint**

```bash
cd express && npx tsc --noEmit && npx eslint src/hooks/useShipmentUpdate.ts src/components/staff/korea/editSchema.ts
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add express/src/hooks/useShipmentUpdate.ts \
  express/src/components/staff/korea/editSchema.ts
git commit -m "feat(express/edit): Zod schema + useShipmentUpdate hook"
```

---

### Task 14: Add i18n keys for edit

**Files:**

- Modify: `express/src/lib/i18n/dictionaries/{en,ko,mn}.json`

- [ ] **Step 1: Add the English keys**

In `express/src/lib/i18n/dictionaries/en.json`, near the other `staff.inbox.*` keys:

```json
  "staff.inbox.edit.title": "Edit shipment",
  "staff.inbox.edit.recipient": "Recipient name",
  "staff.inbox.edit.phone": "Phone",
  "staff.inbox.edit.pickupTime": "Scheduled pickup",
  "staff.inbox.edit.pickupTimeClear": "Clear",
  "staff.inbox.edit.save": "Save changes",
  "staff.inbox.edit.cancel": "Cancel",
  "staff.inbox.edit.saved": "Shipment updated",
  "staff.inbox.edit.noChanges": "Nothing changed",
  "staff.inbox.edit.lockedAfterTransit": "Locked — shipment already in transit",
```

- [ ] **Step 2: Add the Korean keys**

In `express/src/lib/i18n/dictionaries/ko.json`:

```json
  "staff.inbox.edit.title": "배송 수정",
  "staff.inbox.edit.recipient": "수령인 이름",
  "staff.inbox.edit.phone": "전화번호",
  "staff.inbox.edit.pickupTime": "픽업 예정",
  "staff.inbox.edit.pickupTimeClear": "초기화",
  "staff.inbox.edit.save": "변경사항 저장",
  "staff.inbox.edit.cancel": "취소",
  "staff.inbox.edit.saved": "배송이 수정되었습니다",
  "staff.inbox.edit.noChanges": "변경사항 없음",
  "staff.inbox.edit.lockedAfterTransit": "운송 중인 배송은 수정할 수 없습니다",
```

- [ ] **Step 3: Add the Mongolian keys**

In `express/src/lib/i18n/dictionaries/mn.json`:

```json
  "staff.inbox.edit.title": "Илгээмжийг засах",
  "staff.inbox.edit.recipient": "Хүлээн авагчийн нэр",
  "staff.inbox.edit.phone": "Утас",
  "staff.inbox.edit.pickupTime": "Авах хугацаа",
  "staff.inbox.edit.pickupTimeClear": "Арилгах",
  "staff.inbox.edit.save": "Хадгалах",
  "staff.inbox.edit.cancel": "Цуцлах",
  "staff.inbox.edit.saved": "Илгээмж шинэчлэгдлээ",
  "staff.inbox.edit.noChanges": "Өөрчлөлт алга",
  "staff.inbox.edit.lockedAfterTransit": "Тээвэрлэлт эхэлсэн тул засварлах боломжгүй",
```

- [ ] **Step 4: Commit**

```bash
git add express/src/lib/i18n/dictionaries/
git commit -m "feat(express/edit): add i18n keys for edit modal"
```

---

### Task 15: EditShipmentModal component

**Files:**

- Create: `express/src/components/staff/korea/EditShipmentModal.tsx`

- [ ] **Step 1: Write the modal**

Create `express/src/components/staff/korea/EditShipmentModal.tsx`:

```tsx
"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { useTranslations } from "@/lib/i18n/client";
import { Field, FieldInput } from "@/components/shipment/Field";
import {
  KoreaAddressPicker,
  type PickedKoreaRegion,
} from "@/components/address/KoreaAddressPicker";
import { editShipmentSchema, type EditShipmentInput } from "./editSchema";
import { useShipmentUpdate, buildPatch } from "@/hooks/useShipmentUpdate";
import type { ExpressShipment, ExpressAddress } from "@/types/express";

type Props = {
  shipment: ExpressShipment & { korea_address?: ExpressAddress | null };
  open: boolean;
  onClose: () => void;
};

function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

export function EditShipmentModal({ shipment, open, onClose }: Props) {
  const t = useTranslations();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ko";
  const update = useShipmentUpdate(shipment.id);

  const initial: EditShipmentInput = useMemo(() => {
    const a = shipment.korea_address;
    return {
      recipient_name: a?.recipient_name ?? "",
      recipient_phone: a?.recipient_phone ?? "",
      kr_province: a?.kr_province ?? "",
      kr_city: a?.kr_city ?? "",
      kr_street: a?.kr_street ?? "",
      kr_building: a?.kr_building ?? "",
      kr_detail: a?.kr_detail ?? "",
      pickup_scheduled_at: isoToDatetimeLocal(shipment.pickup_scheduled_at),
    };
  }, [shipment]);

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<EditShipmentInput>({
    resolver: zodResolver(editShipmentSchema),
    defaultValues: initial,
    mode: "onSubmit",
  });

  if (!open) return null;

  function handlePickerChange({ kr_province, kr_city }: PickedKoreaRegion) {
    setValue("kr_province", kr_province, { shouldDirty: true, shouldValidate: true });
    setValue("kr_city", kr_city, { shouldDirty: true, shouldValidate: true });
  }

  const onSubmit = handleSubmit(async (values) => {
    const patch = buildPatch(values, initial);
    if (Object.keys(patch).length === 0) {
      toast.message(t("staff.inbox.edit.noChanges"));
      return;
    }
    try {
      await update.mutateAsync(patch);
      toast.success(t("staff.inbox.edit.saved"));
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    }
  });

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--ink)_55%,transparent)] p-4 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-shipment-title"
        className="max-h-[90vh] w-full max-w-[640px] overflow-y-auto rounded-ec border border-line bg-chrome p-7 shadow-[0_24px_60px_rgba(0,0,0,0.22)]"
      >
        <h3 id="edit-shipment-title" className="font-serif text-2xl font-light tracking-[-0.02em]">
          {t("staff.inbox.edit.title")}
        </h3>

        <form onSubmit={onSubmit} className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            label={t("staff.inbox.edit.recipient")}
            htmlFor="edit.recipient_name"
            error={errors.recipient_name?.message}
          >
            <FieldInput id="edit.recipient_name" {...register("recipient_name")} />
          </Field>

          <Field
            label={t("staff.inbox.edit.phone")}
            htmlFor="edit.recipient_phone"
            error={errors.recipient_phone?.message}
          >
            <FieldInput id="edit.recipient_phone" {...register("recipient_phone")} />
          </Field>

          <div className="col-span-full">
            <KoreaAddressPicker locale={locale} onChange={handlePickerChange} />
            <input type="hidden" {...register("kr_province")} />
            <input type="hidden" {...register("kr_city")} />
          </div>

          <Field
            label={t("address.kr.street")}
            htmlFor="edit.kr_street"
            error={errors.kr_street?.message}
          >
            <FieldInput id="edit.kr_street" {...register("kr_street")} />
          </Field>

          <Field
            label={t("address.kr.building")}
            htmlFor="edit.kr_building"
            error={errors.kr_building?.message}
          >
            <FieldInput id="edit.kr_building" {...register("kr_building")} inputMode="numeric" />
          </Field>

          <Field label={t("address.kr.detail")} htmlFor="edit.kr_detail" fullWidth>
            <FieldInput id="edit.kr_detail" {...register("kr_detail")} />
          </Field>

          <Field
            label={t("staff.inbox.edit.pickupTime")}
            htmlFor="edit.pickup_scheduled_at"
            fullWidth
          >
            <input
              id="edit.pickup_scheduled_at"
              type="datetime-local"
              {...register("pickup_scheduled_at")}
              className="border-0 border-b border-b-line bg-transparent px-[2px] py-2 font-sans text-[15px] text-text outline-none transition-colors focus:border-b-amber"
            />
          </Field>

          <div className="col-span-full mt-2 flex justify-end gap-[10px]">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 cursor-pointer items-center rounded-full border border-line bg-transparent px-[16px] font-mono text-[12px] font-medium text-text transition-colors hover:border-text"
            >
              {t("staff.inbox.edit.cancel")}
            </button>
            <button
              type="submit"
              disabled={!isDirty || update.isPending}
              className="inline-flex h-9 cursor-pointer items-center gap-[6px] rounded-full border border-transparent bg-text px-[16px] font-mono text-[12px] font-medium text-bg transition-colors hover:bg-amber hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              {update.isPending && <Loader2 size={12} className="animate-spin" />}
              {t("staff.inbox.edit.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

```bash
cd express && npx tsc --noEmit && npx eslint src/components/staff/korea/EditShipmentModal.tsx
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add express/src/components/staff/korea/EditShipmentModal.tsx
git commit -m "feat(express/edit): EditShipmentModal component"
```

---

### Task 16: Wire up Edit button with status-aware disable

**Files:**

- Modify: `express/src/components/staff/korea/InboxDetail.tsx`

- [ ] **Step 1: Add imports + state**

At the top of `InboxDetail.tsx`, add:

```tsx
import { useState } from "react";
import { EditShipmentModal } from "./EditShipmentModal";
```

Inside the `InboxDetail` function (before the return), add:

```tsx
const LOCKED_STATUSES = new Set([
  "in_transit",
  "arrived_mongolia",
  "ready",
  "out_for_delivery",
  "ready_for_pickup",
  "completed",
]);

const [editOpen, setEditOpen] = useState(false);
const canEdit = !LOCKED_STATUSES.has(shipment.status);
```

- [ ] **Step 2: Replace the inert Edit button with a wired one**

Find the Edit button block (the one with label `{t("common.edit")}` — previously around line 151–156 before Task 2's print-label delete shifted lines). Replace its markup with:

```tsx
<button
  type="button"
  onClick={() => setEditOpen(true)}
  disabled={!canEdit}
  title={!canEdit ? t("staff.inbox.edit.lockedAfterTransit") : undefined}
  className="inline-flex h-9 cursor-pointer items-center rounded-full border border-line bg-transparent px-4 font-sans text-[12px] font-medium tracking-[0.01em] text-text transition-colors hover:border-text disabled:cursor-not-allowed disabled:opacity-50"
>
  {t("common.edit")}
</button>
```

- [ ] **Step 3: Mount the modal at the end of the returned JSX**

Just before the root closing `</div>` of `InboxDetail`, add:

```tsx
<EditShipmentModal shipment={shipment} open={editOpen} onClose={() => setEditOpen(false)} />
```

- [ ] **Step 4: Typecheck + lint**

```bash
cd express && npx tsc --noEmit && npx eslint src/components/staff/korea/InboxDetail.tsx
```

Expected: exit 0.

- [ ] **Step 5: Manual smoke test**

Log in as `korea_admin`, open a shipment in `request_created` status: Edit button enabled. Click it, change recipient name, Save. Detail refreshes with new name. Activity timeline shows "Edited: recipient_name". Try on an `in_transit` shipment: button disabled with tooltip.

- [ ] **Step 6: Commit**

```bash
git add express/src/components/staff/korea/InboxDetail.tsx
git commit -m "feat(express/edit): wire Edit button with status-aware disable"
```

---

## Phase 5 — Final verification

### Task 17: Full end-to-end verification

- [ ] **Step 1: Repo-wide typecheck**

```bash
cd express && npx tsc --noEmit
```

Expected: exit 0, no type errors anywhere.

- [ ] **Step 2: Repo-wide lint (just this feature's files)**

```bash
npx eslint src/components/staff/korea \
  src/app/api/express/shipments \
  src/hooks/useShipmentIssues.ts \
  src/hooks/useShipmentUpdate.ts \
  src/hooks/useStaffShipmentList.ts \
  src/types/express.ts
```

Expected: 0 errors. Pre-existing data-table warnings are unrelated.

- [ ] **Step 3: Browser walk-through (all four changes)**

With the dev server running:

1. Korea inbox toolbar has **only** Export pickups + Log issue (no Saved views).
2. Shipment detail header has **only** Edit + Approve (no Print label).
3. Select a shipment → Log issue modal opens → category + note → submit. Toast "Issue logged", modal closes.
4. Activity timeline shows the new issue with category chip. Click Resolve → note → confirm. Entry becomes strikethrough + "Resolved by …" line.
5. Inbox list row for that shipment shows a red dot while the issue is unresolved. Dot disappears after resolve.
6. Edit button on a `request_created` shipment opens modal with current values populated. Change recipient name + pickup time. Save. Toast "Shipment updated". Detail panel reflects new values. Activity timeline shows new entry with note `Edited: recipient_name, pickup_scheduled_at`.
7. Edit button on an `in_transit` shipment is disabled with tooltip.

- [ ] **Step 4: Locale check**

Switch to `ko` locale in the URL. All new labels render in Korean. Switch to `mn`. All new labels render in Mongolian.

- [ ] **Step 5: Permissions check**

Sign in as a non-staff user. Hit `POST /api/express/shipments/<id>/issues` via curl → 403. Hit `PATCH /api/express/shipments/<id>` → 403.

- [ ] **Step 6: Final commit (only if anything was touched fixing step 1–5 issues)**

```bash
git commit -m "fix(express/inbox): polish from end-to-end verification"
```

- [ ] **Step 7: Ready for review**

Branch has a clean commit sequence. Open a PR against `main`.

---

## Rollback

If anything goes sideways after the PR merges:

1. `git revert` the merge commit.
2. Roll back the migration:

```sql
DROP TABLE IF EXISTS express_shipment_issues;
```

The removed buttons + UI restore automatically via the revert. Edit + issues features fail gracefully (routes return 500 when the table is gone — unrelated shipment creation is unaffected).
