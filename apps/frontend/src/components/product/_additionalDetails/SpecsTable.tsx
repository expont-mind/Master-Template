import type { Spec } from "./specs";

interface SpecsTableProps {
  specs: Spec[];
  /** Wider label column on desktop (120px vs 90px on mobile). */
  desktop?: boolean;
}

/**
 * Two-column "label / value" grid used inside the expandable spec
 * section. Identical rows on mobile and desktop except for the label
 * column width.
 */
export function SpecsTable({ specs, desktop = false }: SpecsTableProps) {
  const gridCols = desktop
    ? "grid-cols-[120px_1fr]"
    : "grid-cols-[90px_1fr] sm:grid-cols-[120px_1fr]";
  return (
    <div className="border-t border-border">
      {specs.map((spec) => (
        <div
          key={spec.label}
          className={`grid ${gridCols} items-center border-b border-border min-h-[56px]`}
        >
          <p className="p-2 border-r h-full flex items-center border-border bg-surface text-text-primary text-sm font-normal font-manrope">
            {spec.label}
          </p>
          <p className="p-2 text-text-primary text-sm font-normal font-manrope leading-5">
            {spec.value}
          </p>
        </div>
      ))}
    </div>
  );
}
