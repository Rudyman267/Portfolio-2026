"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = { label: string; href: string };

// Home-page section anchors for now — the standalone pages come later.
// (Figma 25:144 nav: Work Play Me Resume Contact)
export const DEFAULT_NAV: NavItem[] = [
  { label: "Work", href: "/#work" },
  { label: "Play", href: "/#play" },
  { label: "Me", href: "/#me" },
  { label: "Resume", href: "/#resume" },
  { label: "Contact", href: "/#contact" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav({
  items,
  className,
  onNavigate,
}: {
  items: NavItem[];
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className={className}>
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href as Route}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "transition-colors duration-[var(--duration-fast)] hover:text-fg",
              active ? "text-fg" : "text-muted",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
