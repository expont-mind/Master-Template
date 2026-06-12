import { defineConfig } from "vitest/config";

// Vitest config for @repo/ui-utils.
// Apps that consume this package can mirror this config — see the root
// README's "Testing" section.
export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
