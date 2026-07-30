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
import { NowPlaying } from "@/components/audio/NowPlaying";

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
  // When the footer (the closing scene) is on screen, its own Index column
  // already lists the nav — so the header nav collapses to just the Rudyman
  // brand to avoid duplicating it.
  const [atFooter, setAtFooter] = useState(false);

  // Dark-theme pages: the SOLID header inverts (page-hex bar, white nav)
  // instead of falling back to the white bar. /about is a full-dark route, and
  // so is every case study (/work/<slug>) — without this they fell through to
  // the white bar, so the nav sat as bare text over dark scrolling copy.
  // NOTE `/work` (the index) is now dark too — it runs the PageGlow particle
  // field on a #06080c canvas. It used to be a light page, hence the old regex
  // matching only `/work/<slug>`.
  const darkPage =
    pathname === "/about" ||
    pathname === "/work" ||
    pathname === "/play" ||
    /^\/work\/[^/]+$/.test(pathname ?? "");
  // The mobile menu panel needs a dark fill on every dark-canvas route — that
  // includes the HOME page (dark hero) even though its header bar itself starts
  // transparent-over-hero (so `darkPage` above excludes it). Without this the
  // home menu opened white over the dark hero.
  const darkMenu = darkPage || pathname === "/";

  useEffect(() => {
    const zones = Array.from(
      document.querySelectorAll<HTMLElement>("[data-header-dark]"),
    );
    // the closing footer scene (Footer.tsx id="contact") — nav hides once any
    // part of it is on screen.
    const footer = document.getElementById("contact");
    if (!zones.length) {
      setOverHero(false);
    }
    const update = () => {
      // transparent while ANY dark section overlaps the header strip
      if (zones.length) {
        setOverHero(
          zones.some((z) => {
            const r = z.getBoundingClientRect();
            return r.top < 80 && r.bottom > 16;
          }),
        );
      }
      // desktop nav collapses to the brand once the footer enters the
      // viewport (the mobile hamburger stays — see below)
      if (footer) {
        const r = footer.getBoundingClientRect();
        setAtFooter(r.top < window.innerHeight && r.bottom > 0);
      } else {
        setAtFooter(false);
      }
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

        {/* desktop nav row hides over the footer (its Index column already
            lists these links) — only the Rudyman brand stays. The mobile
            hamburger menu STAYS in all cases. */}
        {!atFooter && (
          <Nav
            items={nav}
            className="hidden items-center gap-8 text-[14px] font-semibold tracking-[-0.42px] sm:flex"
          />
        )}

        {/* ── MUSIC TOGGLE (mobile) ──
            Sits NEXT TO the hamburger, not inside the menu. It has to be
            reachable mid-scroll without opening a panel, and on a phone the
            case studies have no sticky rail to host it — the header is the only
            element that is always on screen. `compact` drops the title/artist
            (no room), leaving just the waveform, which is already the on/off
            indicator; the aria-label still names the track.
            Mobile only: at `sm:` and up the fuller widget appears in the
            case-study rail and the footer. */}
        <div className="flex items-center gap-1 sm:hidden">
          <NowPlaying compact />
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] hover:bg-white/10"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </Container>

      {/* Mobile menu panel — rendered as a FIXED top-layer overlay, NOT a child
          in the sticky header's flow. On the home page the hero is PINNED
          (position:fixed on touch) and, together with the header's -mb-16
          negative margin, the old in-flow panel opened behind the pinned hero
          canvas — so the links were invisible/untappable (the "hamburger does
          nothing on home; renders behind the page" bug). A fixed overlay at
          z-[110] (above the hero's z-20 and the sticky header's z-50, below the
          loader's z-100 curtain only during load) can never be covered. */}
      <div
        ref={panelRef}
        className={cn(
          "fixed inset-x-0 top-16 z-[110] overflow-hidden sm:hidden",
          "border-t",
          // `hero-dark` scope on the dark panel so the Nav's text-fg/text-muted
          // tokens invert to white/grey (the panel sits OUTSIDE any dark section,
          // so without this the links render in the light theme's near-black and
          // vanish on the #06080c fill).
          darkMenu
            ? "hero-dark border-white/10 bg-[#06080c]"
            : "border-black/10 bg-white",
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
