// Frontend uses the strict ESLint config — template-grade discipline.
// Plus relax max-lines/complexity for legacy files that the refactor plan
// (Phase 4) will address. Once those are split, this override can shrink.
import { designTokenConfigs } from "@repo/eslint-config/design-tokens";
import config from "@repo/eslint-config/strict";

export default [
  ...config,
  // Storefront links must go through the typed ROUTES factory. Frontend-only:
  // admin's /products/* are its own admin routes, unrelated to the storefront.
  ...designTokenConfigs({ routeFactory: true }),
];
