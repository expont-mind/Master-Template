"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { resolveProfileView, type ProfileView } from "@/app/profile/_lib/viewFromParams";

interface UseProfileViewResult {
  view: ProfileView;
  setView: React.Dispatch<React.SetStateAction<ProfileView>>;
  tabParam: string | null;
  orderIdParam: string | null;
}

/**
 * Reads URL params and keeps the current `view` in sync. Handles the
 * `wishlist` tab as a redirect rather than a view.
 */
export function useProfileView(): UseProfileViewResult {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const actionParam = searchParams.get("action");
  const idParam = searchParams.get("id");
  const orderIdParam = searchParams.get("orderId");

  const [view, setView] = useState<ProfileView>({ type: "orders" });

  useEffect(() => {
    const resolution = resolveProfileView({ tabParam, actionParam, idParam });
    if (resolution.kind === "redirect") {
      router.push(resolution.href);
      return;
    }
    // Sync view to URL params; URL is the source of truth for which tab is open.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setView(resolution.view);
  }, [tabParam, actionParam, idParam, router]);

  return { view, setView, tabParam, orderIdParam };
}
