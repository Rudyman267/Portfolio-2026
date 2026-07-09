import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Small pill label for categories / tech tags. */
export function Tag({
  children,
  className,
  active,
}: {
  children: ReactNode;
  className?: string;
  active?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-full)] border px-3 py-1 text-[var(--step--1)] leading-none transition-colors",
        active
          ? "border-fg bg-fg text-bg"
          : "border-border bg-surface text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
