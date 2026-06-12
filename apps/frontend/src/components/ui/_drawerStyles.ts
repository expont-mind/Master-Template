// Pure presentational helpers for Drawer. No React imports — keeps the
// component lean and makes complexity warnings disappear.

export type DrawerPosition = "left" | "right";
export type DrawerSize = "sm" | "md" | "lg" | "full";

const SIZE_STYLES: Record<DrawerSize, string> = {
  sm: "w-80",
  md: "w-96",
  lg: "w-[480px]",
  full: "w-full",
};

const POSITION_STYLES: Record<DrawerPosition, string> = {
  left: "left-0 animate-in slide-in-from-left duration-300",
  right: "right-0 animate-in slide-in-from-right duration-300",
};

export function drawerSizeClass(size: DrawerSize): string {
  return SIZE_STYLES[size];
}

export function drawerPositionClass(position: DrawerPosition): string {
  return POSITION_STYLES[position];
}
