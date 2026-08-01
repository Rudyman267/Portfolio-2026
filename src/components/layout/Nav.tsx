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

/**
 * Hrefs that are NOT internal routes and must open natively rather than through
 * the SPA hard-nav: `mailto:`/`tel:` hand off to the OS mail/phone app,
 * `http(s)` and static files (the résumé PDF) open in a new tab. Without this
 * the onClick below would `preventDefault` + `hardNavigate` them and a
 * `mailto:` would silently do nothing.
 */
export function isExternalHref(href: string) {
  return /^(mailto:|tel:|https?:\/\/)/.test(href) || /\.pdf(\?|#|$)/i.test(href);
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
  // Contact opens a pre-addressed email — the footer's big email link is the
  // same address. Resume will point at /riddhiman-deb-resume.pdf once that PDF
  // is added to /public; kept as a no-op anchor until then so it can never 404
  // on the live site.
  { label: "Resume", href: "/#resume" },
  { label: "Contact", href: "mailto:riddhimandeb12@gmail.com" },
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
        // mailto:/tel:/external/PDF → real <a>, opened by the browser/OS. The
        // Contact item is a `mailto:` (opens a pre-addressed email); the résumé
        // is a PDF (opens in a new tab).
        if (isExternalHref(item.href)) {
          const newTab = !/^(mailto:|tel:)/.test(item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={() => onNavigate?.()}
              {...(newTab
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className={cn(
                "transition-colors duration-[var(--duration-fast)] hover:text-fg",
                "text-muted",
              )}
            >
              {item.label}
            </a>
          );
        }
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
