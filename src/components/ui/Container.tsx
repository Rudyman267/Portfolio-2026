import { cn } from "@/lib/utils";
import { createElement, type ElementType, type ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
  /** "content" = reading width (default), "wide" = roomier sections. */
  width?: "content" | "wide";
  as?: ElementType;
};

/** Centered, gutter-aware content wrapper. */
export function Container({
  children,
  className,
  width = "content",
  as: Tag = "div",
}: ContainerProps) {
  // createElement instead of <Tag> JSX: R3F's global JSX augmentation makes a
  // generic ElementType tag collapse its props to `never` (TS2745).
  return createElement(
    Tag,
    {
      className: cn(
        "mx-auto w-full px-[var(--gutter)]",
        width === "content"
          ? "max-w-[var(--container-content)]"
          : "max-w-[var(--container-wide)]",
        className,
      ),
    },
    children,
  );
}
