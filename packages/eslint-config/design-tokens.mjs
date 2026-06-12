// Design-token discipline, enforced.
//
// Three families of `no-restricted-syntax` entries:
//   1. Raw-hex / raw-rgba Tailwind utility classes (`text-[#020617]`) — every
//      brand or neutral color must flow through @repo/theme brand.css so a
//      rebrand is a one-file edit, not a 200-file find/replace. (All apps.)
//   2. Hand-built storefront product/category URLs — links must go through
//      the typed ROUTES factory in the FRONTEND app only (admin's own
//      /products/* admin routes are unrelated). Opt in via
//      `designTokenConfigs({ routeFactory: true })`.
//   3. `transition-all` inside layout chrome — interpolates background/color
//      during theme changes; transitions must list their properties.
//
// `no-restricted-syntax` does NOT merge across config objects, so each config
// object always re-declares the full selector list, and an app that opts into
// routeFactory appends `designTokenConfigs({ routeFactory: true })` AFTER the
// shared config so its objects win for matching files.

const HEX_CLASS_RE = String.raw`(accent|bg|text|border(-[lrtbxy])?|ring|from|to|via|fill|stroke|divide|outline|shadow|decoration|caret)-\[(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\()`;

const HEX_MESSAGE =
  "Raw hex/rgba utility class. Use a semantic token class wired to @repo/theme " +
  "brand.css instead (e.g. text-text-primary, bg-brand-primary, bg-overlay).";

const ROUTE_MESSAGE =
  "Hand-built product/category URL. Use ROUTES.PRODUCT(slug) / " +
  "ROUTES.CATEGORY(slug) from lib/utils/constants instead.";

const TRANSITION_MESSAGE =
  "transition-all in layout chrome interpolates colors during theme changes. " +
  "List the transitioned properties explicitly (transition-colors, " +
  "transition-[max-height,opacity], ...).";

export const tokenRestrictions = [
  { selector: `Literal[value=/${HEX_CLASS_RE}/]`, message: HEX_MESSAGE },
  { selector: `TemplateElement[value.raw=/${HEX_CLASS_RE}/]`, message: HEX_MESSAGE },
];

export const routeRestrictions = [
  { selector: String.raw`TemplateElement[value.raw=/\/products\/$/]`, message: ROUTE_MESSAGE },
  { selector: String.raw`TemplateElement[value.raw=/\/products\?category=$/]`, message: ROUTE_MESSAGE },
];

export const layoutChromeRestrictions = [
  { selector: "Literal[value=/transition-all/]", message: TRANSITION_MESSAGE },
  { selector: "TemplateElement[value.raw=/transition-all/]", message: TRANSITION_MESSAGE },
];

export function designTokenConfigs({ routeFactory = false } = {}) {
  const base = [
    ...tokenRestrictions,
    ...(routeFactory ? routeRestrictions : []),
  ];
  return [
    {
      files: ["**/*.{ts,tsx,js,jsx}"],
      rules: { "no-restricted-syntax": ["error", ...base] },
    },
    {
      files: ["**/components/layout/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-syntax": ["error", ...base, ...layoutChromeRestrictions],
      },
    },
  ];
}
