import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

function buildInputClasses(opts: {
  error?: string;
  hasLeftIcon: boolean;
  hasRightIcon: boolean;
  extraClass?: string;
}): string {
  return cn(
    "block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 transition-colors",
    "placeholder:text-zinc-400",
    "focus:outline-none focus:ring-2 focus:ring-offset-0",
    "disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500",
    "dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500",
    opts.error
      ? "border-red-500 focus:border-red-500 focus:ring-red-200 dark:border-red-400 dark:focus:ring-red-900"
      : "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-200 dark:border-zinc-700 dark:focus:border-zinc-500 dark:focus:ring-zinc-800",
    opts.hasLeftIcon ? "pl-10" : undefined,
    opts.hasRightIcon ? "pr-10" : undefined,
    opts.extraClass,
  );
}

function InputHelperText({ error, helperText }: { error?: string; helperText?: string }) {
  if (!error && !helperText) return null;
  return (
    <p className={cn("mt-1.5 text-sm", error ? "text-red-600 dark:text-red-400" : "text-zinc-500")}>
      {error ?? helperText}
    </p>
  );
}

function InputAffix({ side, icon }: { side: "left" | "right"; icon: ReactNode }) {
  if (!icon) return null;
  const position = side === "left" ? "left-0 pl-3" : "right-0 pr-3";
  const pointer = side === "left" ? "pointer-events-none" : "";
  return (
    <div className={cn("absolute inset-y-0 flex items-center text-zinc-400", position, pointer)}>
      {icon}
    </div>
  );
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type = "text", label, error, helperText, leftIcon, rightIcon, id, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <InputAffix side="left" icon={leftIcon} />
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={buildInputClasses({
              error,
              hasLeftIcon: Boolean(leftIcon),
              hasRightIcon: Boolean(rightIcon),
              extraClass: className,
            })}
            {...props}
          />
          <InputAffix side="right" icon={rightIcon} />
        </div>
        <InputHelperText error={error} helperText={helperText} />
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
