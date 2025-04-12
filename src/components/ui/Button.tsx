"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg";
}

function classNames(
  ...classes: (
    | string
    | boolean
    | undefined
    | null
    | { [key: string]: boolean }
  )[]
): string {
  return classes.filter(Boolean).join(" ");
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={classNames(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          variant === "default" &&
            "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500",
          variant === "outline" &&
            "border border-gray-300 bg-transparent hover:bg-gray-50 focus-visible:ring-gray-400",
          variant === "ghost" &&
            "bg-transparent hover:bg-gray-100 focus-visible:ring-gray-400",
          variant === "link" &&
            "bg-transparent underline-offset-4 hover:underline focus-visible:ring-indigo-500",
          size === "default" && "h-10 py-2 px-4",
          size === "sm" && "h-8 px-2 rounded-md text-sm",
          size === "lg" && "h-11 px-8 rounded-md",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
