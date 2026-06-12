export type ProfileView =
  | { type: "orders" }
  | { type: "address" }
  | { type: "phone" }
  | { type: "point" }
  | { type: "wishlist" }
  | { type: "coupon" }
  | { type: "personal" }
  | { type: "connections" }
  | { type: "settings" }
  | { type: "help" }
  | { type: "branches" }
  | { type: "faq" }
  | { type: "address-edit"; addressId?: string };

// Tab names whose param maps 1:1 to a view of the same name with no extra fields.
const SIMPLE_TAB_VIEWS = new Set<ProfileView["type"]>([
  "address",
  "phone",
  "point",
  "personal",
  "connections",
  "coupon",
  "settings",
  "help",
  "branches",
  "faq",
]);

export type ViewResolution =
  | { kind: "view"; view: ProfileView }
  | { kind: "redirect"; href: string };

/**
 * Pure resolver: given the URL params, returns either the new view to
 * render or a redirect to issue. The component is responsible for the
 * `router.push` side-effect when redirecting.
 */
export function resolveProfileView(params: {
  tabParam: string | null;
  actionParam: string | null;
  idParam: string | null;
}): ViewResolution {
  const { tabParam, actionParam, idParam } = params;

  if (tabParam === "address" && actionParam === "new") {
    return { kind: "view", view: { type: "address-edit" } };
  }
  if (tabParam === "address" && actionParam === "edit" && idParam) {
    return {
      kind: "view",
      view: { type: "address-edit", addressId: idParam },
    };
  }
  if (tabParam === "wishlist") {
    return { kind: "redirect", href: "/wishlist" };
  }
  if (tabParam && SIMPLE_TAB_VIEWS.has(tabParam as ProfileView["type"])) {
    return {
      kind: "view",
      view: { type: tabParam } as ProfileView,
    };
  }
  return { kind: "view", view: { type: "orders" } };
}
