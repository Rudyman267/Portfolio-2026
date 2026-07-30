"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { hardNavigate } from "@/components/motion/routeTransitionBridge";
import { scrollToWorks } from "@/components/sections/worksAnchor";

/** Path part of an href (drops any #hash), for same-route detection. */
function pathOf(href: string) {
  return href.split("#")[0] || "/";
}

export type NavItem = { label: string; href: string };

// Home-page section anchors for now — standalone pages replace them as they
// are built (Me → /about). (Figma 25:144 nav: Work Play Me Resume Contact)
export const DEFAULT_NAV: NavItem[] = [
  // Work + Play are REAL PAGES now. They used to be `/#work` / `/#play`
  // in-page anchors — `#work` glided into the home hero's pinned works chapter
  // and `#play` resolved to nothing at all. Both indexes exist, so the nav
  // should go to them.
  { label: "Work", href: "/work" },
  { label: "Play", href: "/play" },
  { label: "Me", href: "/about" },
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
            onClick={(e) => {
              // Cross-route → HARD load (fresh Lenis/ScrollTrigger + Loader), so
              // the destination loads exactly like a refresh. Same-route (incl.
              // an on-page #hash anchor) keeps default SPA behaviour.
              if (pathOf(item.href) !== pathname) {
                e.preventDefault();
                hardNavigate(item.href);
              } else if (item.href === "/#work") {
                // the works chapter lives INSIDE the hero pin — no #work
                // element exists on the motion path; glide to its offset.
                e.preventDefault();
                scrollToWorks();
              }
              onNavigate?.();
            }}
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
