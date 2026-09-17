"use client";

import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none";

    const variantStyles: Record<string, string> = {
      default:
        "bg-[var(--accent)] text-white shadow hover:bg-[var(--accent-deep)]",
      destructive:
        "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500",
      outline:
        "border border-[var(--line)] bg-transparent hover:bg-[var(--panel)] text-[var(--ink)] shadow-sm",
      secondary:
        "bg-neutral-100 dark:bg-neutral-800 text-[var(--ink)] shadow-sm hover:bg-neutral-200 dark:hover:bg-neutral-700",
      ghost:
        "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[var(--ink)]",
      link:
        "text-[var(--accent)] underline-offset-4 hover:underline",
    };

    const sizeStyles: Record<string, string> = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-10 rounded-md px-8",
      icon: "h-9 w-9 p-0",
    };

    const combinedClasses = `${baseStyles} ${variantStyles[variant] || variantStyles.default} ${
      sizeStyles[size] || sizeStyles.default
    } ${className}`.trim();

    return <button ref={ref} className={combinedClasses} {...props} />;
  }
);

Button.displayName = "Button";
