// Config for non-Next.js workspace packages (utility/config libraries).
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default defineConfig([
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,js,mjs}"],
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  prettier,
  globalIgnores(["dist/**", ".turbo/**", "node_modules/**"]),
]);
