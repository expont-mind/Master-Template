// Admin uses the strict ESLint config — template-grade discipline.
import config from "@repo/eslint-config/strict";
import { defineConfig, globalIgnores } from "eslint/config";


// Admin-specific ignores beyond the shared strict config.
//
// scripts/**         CLI utilities — legitimate console.log usage, not bundled
// supabase/**        Edge functions + SQL seeds — ESLint can't parse SQL,
//                    and edge functions run on Deno (separate config)
export default defineConfig([
  ...config,
  globalIgnores(["scripts/**", "supabase/**"]),
]);
