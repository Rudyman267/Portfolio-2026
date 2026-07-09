import Link from "next/link";
import type { Route } from "next";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-full)] font-medium transition-colors duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-fg text-bg hover:bg-fg/90",
  secondary: "bg-surface text-fg border border-border hover:bg-surface-2",
  ghost: "text-fg hover:bg-surface-2",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[var(--step--1)]",
  md: "h-11 px-6 text-[var(--step-0)]",
};

function classes(variant: Variant, size: Size, className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonAsLink = {
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  external?: boolean;
};

/** Anchor-styled button (internal Link or external <a>). */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  external,
}: ButtonAsLink) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={classes(variant, size, className)}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href as Route} className={classes(variant, size, className)}>
      {children}
    </Link>
  );
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
};

/** Native button element. */
export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return <button className={classes(variant, size, className)} {...props} />;
}
