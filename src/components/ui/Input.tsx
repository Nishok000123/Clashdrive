import React, { forwardRef, useState } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = "", onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            className={`block text-xs font-bold uppercase tracking-wider select-none transition-colors duration-200 ${
              focused
                ? "text-brand-500 dark:text-brand-400"
                : "text-surface-650 dark:text-surface-700"
            }`}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500 flex items-center justify-center pointer-events-none select-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full bg-surface-100/40 dark:bg-surface-200/20 border rounded-2xl px-4 py-3.5 text-sm text-surface-900 placeholder:text-surface-500/70 focus:outline-none transition-all duration-200 shadow-sm ${
              focused
                ? "border-brand-500/60 ring-[3px] ring-brand-500/10 shadow-md shadow-brand-500/5"
                : "border-surface-300/80 dark:border-surface-300/10"
            } ${icon ? "pl-11" : ""} ${
              error ? "border-danger focus:border-danger focus:ring-danger/10" : ""
            } ${className}`}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-danger font-medium mt-1 animate-spring-slide-up select-none">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
