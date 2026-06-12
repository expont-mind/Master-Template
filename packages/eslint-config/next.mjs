// Baseline Next.js config. Apps that haven't been migrated to /strict yet use this.
// Mirrors the original eslint.config.mjs files that lived inside each app pre-monorepo.
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

import { designTokenConfigs } from "./design-tokens.mjs";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  ...designTokenConfigs(),
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "dist/**", ".turbo/**"]),
]);
