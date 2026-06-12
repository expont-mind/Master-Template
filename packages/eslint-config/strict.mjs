// Strict config for the master template.
//
// Philosophy:
//   - ERROR rules catch real bugs (hooks misuse, missing key, missing alt).
//   - WARN rules raise smells without blocking work (large files, complex
//     functions, missing aria-labels on borderline interactive elements).
//   - Generated files (database.ts, *.config.*) are exempt from size rules.
//
// To opt an app in: import this module from `eslint.config.mjs`.
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import noRelativeImportPaths from "eslint-plugin-no-relative-import-paths";
import prettier from "eslint-config-prettier";

import { designTokenConfigs } from "./design-tokens.mjs";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  ...designTokenConfigs(),

  // Main strict ruleset.
  // Note: jsx-a11y plugin is already loaded by eslint-config-next/core-web-vitals,
  // so we only register the additional plugins here. jsx-a11y RULES are
  // configured below.
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    plugins: {
      import: importPlugin,
      "unused-imports": unusedImports,
      "no-relative-import-paths": noRelativeImportPaths,
    },
    rules: {
      // ─── ERROR: real bugs / discipline gates ───────────────────────────
      "no-console": ["error", { allow: ["warn", "error"] }],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "react/jsx-key": "error",
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/role-supports-aria-props": "error",
      "import/no-duplicates": "error",
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling", "index"],
            "object",
            "type",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "unused-imports/no-unused-imports": "error",
      // Delegate unused-vars to unused-imports plugin (auto-fixable + supports
      // the `^_` ignore pattern). Avoids duplicate warnings on every offender.
      "@typescript-eslint/no-unused-vars": "off",
      "no-relative-import-paths/no-relative-import-paths": [
        "error",
        { allowSameFolder: true, rootDir: "src", prefix: "@" },
      ],

      // ─── React 19 new rules — promoted to ERROR ─────────────────────────
      // After component decomp cleanup these rules became actionable. They
      // catch real bugs (cascading renders, state mutation, ref misuse).
      "react-hooks/set-state-in-effect": "error",
      "react-hooks/immutability": "error",
      "react-hooks/static-components": "error",
      "react-hooks/refs": "error",
      "react-hooks/purity": "error",

      // ─── Size / complexity — promoted to ERROR ──────────────────────────
      // The codebase has been decomposed to fit these limits. Any new code
      // exceeding them is a smell that gets caught at build time.
      "max-lines": [
        "error",
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
      "max-lines-per-function": [
        "error",
        { max: 150, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      complexity: ["error", 12],

      // ─── React / a11y — promoted to ERROR ───────────────────────────────
      "react/no-array-index-key": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "jsx-a11y/label-has-associated-control": "error",
      "jsx-a11y/no-redundant-roles": "error",
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/no-static-element-interactions": "error",

      // Next.js default warn → error. Forces use of next/image for perf.
      "@next/next/no-img-element": "error",
    },
  },

  // Exemptions for generated / configuration files
  {
    files: [
      "**/types/database.ts",
      "**/database.ts",
      "**/*.config.{ts,js,mjs,cjs}",
      "**/next.config.*",
      "**/tailwind.config.*",
      "**/postcss.config.*",
      "**/eslint.config.*",
      "**/migrations/**",
      "**/seed_*.{ts,js,sql}",
    ],
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
      complexity: "off",
    },
  },

  // Server actions and route handlers often need higher complexity ceilings
  {
    files: [
      "**/actions.ts",
      "**/actions/**/*.ts",
      "**/api/**/route.ts",
      "**/lib/queries/**/*.ts",
    ],
    rules: {
      "max-lines-per-function": [
        "error",
        { max: 250, skipBlankLines: true, skipComments: true },
      ],
    },
  },

  // Loading skeleton components legitimately use array index as React key —
  // the placeholder array is static, no reorder/insert/delete happens.
  {
    files: ["**/loading.tsx", "**/*Skeleton.tsx", "**/skeleton.tsx"],
    rules: {
      "react/no-array-index-key": "off",
    },
  },

  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "dist/**",
    ".turbo/**",
    "**/database.ts",
  ]),
]);
