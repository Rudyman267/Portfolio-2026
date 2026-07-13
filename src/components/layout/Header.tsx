"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Nav, DEFAULT_NAV, type NavItem } from "@/components/layout/Nav";
import { gsap, useGSAP, ease } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { hardNavigate } from "@/components/motion/routeTransitionBridge";

export function Header({
  brand = "Rudyman",
  nav = DEFAULT_NAV,
}: {
  brand?: string;
  nav?: NavItem[];
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // The home hero is dark; the header sits transparent (cream text) over it and
  // turns solid once scrolled past. Other pages have no dark hero, so we treat
  // "not over a hero" as the default solid state. Uses the hero's live bounding
  // rect (not offsetHeight) so it stays correct while ScrollTrigger pins the
  // hero, and re-arms on client navigation since the Header persists in layout.
  const pathname = usePathname();
  const [overHero, setOverHero] = useState(false);

  // Dark-theme pages: the SOLID header inverts (page-hex bar, white nav)
  // instead of falling back to the white bar. /about is a full-dark route.
  const darkPage = pathname === "/about";

  useEffect(() => {
    const zones = Array.from(
      document.querySelectorAll<HTMLElement>("[data-header-dark]"),
    );
    if (!zones.length) {
      setOverHero(false);
      return;
    }
    const update = () => {
      // transparent while ANY dark section overlaps the header strip
      setOverHero(
        zones.some((z) => {
          const r = z.getBoundingClientRect();
          return r.top < 80 && r.bottom > 16;
        }),
      );
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  // Animate the mobile menu height/opacity on open/close. revertOnUpdate reruns
  // the effect whenever `open` flips so the tween reflects the new state.
  useGSAP(
    () => {
      const panel = panelRef.current;
      if (!panel) return;

      if (open) {
        gsap.set(panel, { display: "block" });
        gsap.fromTo(
          panel,
          { height: 0, opacity: 0 },
          {
            height: "auto",
            opacity: 1,
            duration: 0.28,
            ease: ease.standard,
          },
        );
      } else {
        gsap.to(panel, {
          height: 0,
          opacity: 0,
          duration: 0.22,
          ease: ease.standard,
          onComplete: () => gsap.set(panel, { display: "none" }),
        });
      }
    },
    { dependencies: [open], scope: panelRef },
  );

  return (
    <header
      data-over-hero={overHero || undefined}
      data-solid-dark={(!overHero && darkPage) || undefined}
      className={cn(
        "sticky top-0 z-50 transition-colors duration-500",
        overHero
          ? "-mb-16 bg-transparent text-white"
          : darkPage
            ? "bg-[#06080c] text-white"
            : "bg-white text-black",
      )}
    >
      <Container width="wide" className="flex h-16 items-center justify-between">
        <Link
          href="/"
          onClick={(e) => {
            // returning home from another route → HARD load (loads like a
            // refresh via the Loader). Already home → default (no-op nav).
            if (pathname !== "/") {
              e.preventDefault();
              hardNavigate("/");
            }
          }}
          className="text-[14px] font-semibold tracking-[-0.42px]"
        >
          {brand}
        </Link>

        <Nav
          items={nav}
          className="hidden items-center gap-8 text-[14px] font-semibold tracking-[-0.42px] sm:flex"
        />

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] hover:bg-white/10"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </Container>

      <div
        ref={panelRef}
        className={cn(
          "overflow-hidden sm:hidden",
          darkPage ? "bg-[#06080c]" : "bg-white",
          "hidden", // starts closed; GSAP toggles display
        )}
      >
        <Container width="wide" className="py-4">
          <Nav
            items={nav}
            onNavigate={() => setOpen(false)}
            className="flex flex-col gap-4 text-[var(--step-1)]"
          />
        </Container>
      </div>
    </header>
  );
}
