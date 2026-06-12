// Re-export shim. The canonical source is now @repo/ui-utils.
// Admin previously used the short-form relativetime ("X мин"), now named
// formatRelativeTimeShort. The original formatRelativeTime is re-exported as
// an alias to preserve behavior for any existing callers in admin.
export {
  parseAsUTC,
  formatRelativeTimeShort as formatRelativeTime,
  formatRelativeTimeShort,
} from "@repo/ui-utils/formatters";
