import { cn } from "@/lib/utils/cn";

export interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
  lines = 1,
}: SkeletonProps) {
  const baseStyles = "skeleton";

  const variantStyles = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const style = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };

  if (lines > 1 && variant === "text") {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseStyles,
              variantStyles.text,
              i === lines - 1 && "w-3/4", // Last line is shorter
              className,
            )}
            style={i !== lines - 1 ? style : { ...style, width: "75%" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      style={style}
    />
  );
}

// Common skeleton compositions
export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <Skeleton className="aspect-square w-full" variant="rectangular" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" className="w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton variant="text" className="w-20" />
          <Skeleton variant="circular" width={36} height={36} />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Gallery */}
      <div className="space-y-4">
        <Skeleton className="aspect-square w-full" variant="rectangular" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-20" variant="rectangular" />
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="space-y-6">
        <Skeleton variant="text" className="h-8 w-3/4" />
        <Skeleton variant="text" className="h-6 w-1/4" />
        <Skeleton variant="text" lines={3} className="w-full" />
        <div className="flex gap-4">
          <Skeleton className="h-12 w-32" variant="rectangular" />
          <Skeleton className="h-12 flex-1" variant="rectangular" />
        </div>
      </div>
    </div>
  );
}
