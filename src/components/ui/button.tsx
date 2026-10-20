import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-soft hover:bg-brand-700 hover:shadow-lift focus-visible:outline-brand-600",
  secondary:
    "bg-white text-ink-900 shadow-soft ring-1 ring-inset ring-ink-200 hover:bg-ink-50 hover:ring-ink-300 focus-visible:outline-ink-400",
  ghost: "text-ink-700 hover:bg-ink-100 focus-visible:outline-ink-400",
  accent:
    "bg-amber-400 text-ink-900 shadow-soft hover:bg-amber-300 hover:shadow-lift focus-visible:outline-white",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-7 text-base",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 active:scale-[0.97]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-60",
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size };

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}

type LinkButtonProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function LinkButton({ variant, size, className, ...props }: LinkButtonProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
