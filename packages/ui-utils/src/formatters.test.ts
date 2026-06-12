// Unit tests for the shared formatters. These cover the hot paths exercised
// by every app — pricing display, phone normalization, slug generation —
// because a silent regression in any of them affects every checkout, every
// product card, every form.
//
// Run with: pnpm -F @repo/ui-utils test

import { describe, expect, it } from "vitest";

import {
  formatOrderNumber,
  formatPhone,
  formatPhoneE164,
  formatPrice,
  generateSlug,
  getDiscountPercentage,
  stripPhonePrefix,
  truncateText,
} from "./formatters";

describe("formatPrice", () => {
  it("appends the currency symbol", () => {
    expect(formatPrice(15000)).toBe("15,000 ₮");
  });

  it("supports an explicit currency override", () => {
    expect(formatPrice(15000, " USD")).toBe("15,000 USD");
  });

  it("uses Mongolian thousands separator", () => {
    expect(formatPrice(1234567)).toBe("1,234,567 ₮");
  });
});

describe("getDiscountPercentage", () => {
  it("returns rounded percentage when there is a real discount", () => {
    expect(getDiscountPercentage(10000, 7500)).toBe(25);
  });

  it("returns null when there is no discount", () => {
    expect(getDiscountPercentage(10000, null)).toBeNull();
  });

  it("returns null when discount price is not lower than price", () => {
    expect(getDiscountPercentage(10000, 12000)).toBeNull();
    expect(getDiscountPercentage(10000, 10000)).toBeNull();
  });
});

describe("formatPhone", () => {
  it("formats an 8-digit Mongolian number as XXXX-XXXX", () => {
    expect(formatPhone("99887766")).toBe("9988-7766");
  });

  it("returns the input unchanged when not 8 digits", () => {
    expect(formatPhone("123")).toBe("123");
    expect(formatPhone("9988776655")).toBe("9988776655");
  });

  it("strips non-digits before formatting", () => {
    expect(formatPhone("9988-7766")).toBe("9988-7766");
    expect(formatPhone("(998) 877-66")).toBe("9988-7766");
  });
});

describe("stripPhonePrefix", () => {
  it("removes +976 prefix", () => {
    expect(stripPhonePrefix("+97699887766")).toBe("99887766");
  });

  it("removes 976 prefix without plus sign", () => {
    expect(stripPhonePrefix("97699887766")).toBe("99887766");
  });

  it("leaves non-prefixed numbers untouched", () => {
    expect(stripPhonePrefix("99887766")).toBe("99887766");
  });
});

describe("formatPhoneE164", () => {
  it("prefixes local digits with the locale country code", () => {
    expect(formatPhoneE164("99123456")).toBe("+97699123456");
  });

  it("is idempotent on an already-E.164 number", () => {
    expect(formatPhoneE164("+97699123456")).toBe("+97699123456");
  });

  it("normalizes a country-coded number without plus", () => {
    expect(formatPhoneE164("97699123456")).toBe("+97699123456");
  });

  it("strips spaces and dashes", () => {
    expect(formatPhoneE164("9912-3456")).toBe("+97699123456");
    expect(formatPhoneE164("+976 9912 3456")).toBe("+97699123456");
  });
});

describe("formatOrderNumber", () => {
  it("prefixes the order number with #", () => {
    expect(formatOrderNumber("ABC12345")).toBe("#ABC12345");
  });
});

describe("truncateText", () => {
  it("returns the input when shorter than max", () => {
    expect(truncateText("hello", 10)).toBe("hello");
  });

  it("truncates and appends ellipsis when too long", () => {
    expect(truncateText("hello world", 5)).toBe("hello...");
  });
});

describe("generateSlug", () => {
  it("lowercases and replaces non-alphanumeric runs with hyphens", () => {
    expect(generateSlug("Hello World")).toBe("hello-world");
  });

  it("preserves Cyrillic characters", () => {
    expect(generateSlug("Шинэ бараа")).toBe("шинэ-бараа");
  });

  it("trims leading and trailing hyphens", () => {
    expect(generateSlug("  hello  ")).toBe("hello");
    expect(generateSlug("---abc---")).toBe("abc");
  });
});
