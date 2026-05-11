import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

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
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              "block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 transition-colors",
              "placeholder:text-zinc-400",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              "disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500",
              "dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500",
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-200 dark:border-red-400 dark:focus:ring-red-900"
                : "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-200 dark:border-zinc-700 dark:focus:border-zinc-500 dark:focus:ring-zinc-800",
              leftIcon ? "pl-10" : undefined,
              rightIcon ? "pr-10" : undefined,
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400">
              {rightIcon}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <p
            className={cn(
              "mt-1.5 text-sm",
              error ? "text-red-600 dark:text-red-400" : "text-zinc-500",
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
