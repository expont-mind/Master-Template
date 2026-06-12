// Typed token references for use in TS (e.g. when a component prop is a token name).
// The actual computed values live in brand.css / tokens.css.
export const THEME_TOKENS = {
  colors: {
    brandPrimary: "var(--color-brand-primary)",
    brandPrimaryHover: "var(--color-brand-primary-hover)",
    brandPrimaryActive: "var(--color-brand-primary-active)",
    brandPrimaryForeground: "var(--color-brand-primary-foreground)",
    brandSecondary: "var(--color-brand-secondary)",
    brandSecondaryForeground: "var(--color-brand-secondary-foreground)",
    brandAccent: "var(--color-brand-accent)",
    brandAccentForeground: "var(--color-brand-accent-foreground)",
    textPrimary: "var(--color-text-primary)",
    textSecondary: "var(--color-text-secondary)",
    textMuted: "var(--color-text-muted)",
    surface: "var(--color-surface)",
    border: "var(--color-border)",
    overlay: "var(--color-overlay)",
  },
  radius: {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    xl: "var(--radius-xl)",
    full: "var(--radius-full)",
  },
} as const;

export type ThemeColorToken = keyof typeof THEME_TOKENS.colors;
export type ThemeRadiusToken = keyof typeof THEME_TOKENS.radius;
