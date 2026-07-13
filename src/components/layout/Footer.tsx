"use client";

import Link from "next/link";
import type { Route } from "next";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ArrowUp } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { Magnetic } from "@/components/motion/Magnetic";
import { scrollToTop } from "@/components/motion/lenisBridge";
import { DEFAULT_NAV, type NavItem } from "@/components/layout/Nav";
import { hardNavigate } from "@/components/motion/routeTransitionBridge";

// Ambient particle/energy-blob glow behind the footer — a whisper of the hero
// ecosystem (same palette/shapes/motion). Client-only; skips itself on
// reduced-motion / touch / no-WebGL2, so ssr:false is safe here.
const FooterGlow = dynamic(
  () => import("@/components/hero3d/FooterGlow").then((m) => m.FooterGlow),
  { ssr: false },
);

export type SocialLink = { label: string; href: string };

/**
 * Footer — the closing scene. A full-viewport dark finale that bookends the
 * hero: same `.hero-dark` token scope, same coordinates/labels vocabulary,
 * header inverts over it (data-header-dark). Absorbs the contact CTA — this IS
 * `/#contact`.
 *
 * Centerpiece: a full-bleed "RUDYMAN" wordmark spanning edge to edge at the
 * bottom of the viewport, baseline cropped by the fold. Its letters rise out
 * of a mask, scrubbed to the arrival scroll; the content above fades up once,
 * staggered. Reduced motion: everything renders settled.
 */

/** Live local time — the classic studio-footer detail. Client-only to avoid
 *  hydration mismatch (renders a placeholder until mounted). */
function LocalTime({ label = "Pune, IN", timeZone = "Asia/Kolkata" }) {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-GB", {
          timeZone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timeZone]);

  return (
    <span className="tabular-nums">
      {label} — {time ?? "--:--:--"}
    </span>
  );
}

const WORDMARK = "RUDYMAN";

export function Footer({
  brand = "Rudyman",
  email,
  socials = [],
  note,
  resumeUrl,
  nav = DEFAULT_NAV,
}: {
  brand?: string;
  email?: string;
  socials?: SocialLink[];
  note?: string;
  resumeUrl?: string;
  nav?: NavItem[];
}) {
  const root = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const year = "2026";

  // Connect column = Sanity socials (when present) else placeholder profiles,
  // with the résumé appended. Placeholders are replaced from Site Settings.
  // TODO(content): fill real profile URLs in Sanity Site Settings → socials.
  const PLACEHOLDER_SOCIALS: SocialLink[] = [
    { label: "LinkedIn", href: "https://www.linkedin.com/" },
    { label: "Twitter / X", href: "https://x.com/" },
    { label: "Read.cv", href: "https://read.cv/" },
  ];
  const connectLinks: SocialLink[] = [
    ...(socials.length > 0 ? socials : PLACEHOLDER_SOCIALS),
    ...(resumeUrl ? [{ label: "Résumé", href: resumeUrl }] : []),
  ];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const footer = root.current;
        if (!footer) return;

        // giant wordmark: per-letter masked rise, scrubbed to arrival — the
        // name assembles as you land on the final screen, settling right as
        // the page bottoms out.
        gsap.fromTo(
          footer.querySelectorAll("[data-wordmark-letter]"),
          { yPercent: 110 },
          {
            yPercent: 0,
            ease: "power3.out",
            stagger: 0.06,
            scrollTrigger: {
              trigger: footer,
              start: "top 75%",
              end: "bottom bottom",
              scrub: 0.6,
            },
          },
        );

        // content above: one gentle staggered rise, played once on entry
        gsap.fromTo(
          footer.querySelectorAll("[data-footer-item]"),
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.07,
            ease: "power3.out",
            scrollTrigger: {
              trigger: footer,
              start: "top 60%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });
    },
    { scope: root },
  );

  return (
    <footer
      ref={root}
      id="contact"
      data-header-dark
      className="hero-dark relative flex min-h-dvh flex-col overflow-hidden"
    >
      {/* ambient hero-DNA particles rising from below the fold, behind ALL text */}
      <FooterGlow />

      {/* top row — bookends the hero's labels */}
      <div className="relative z-[1] flex items-start justify-between px-[var(--gutter)] pt-24 text-[13px] font-medium tracking-wide text-fg/60">
        <span data-footer-item>( Contact )</span>
        <span data-footer-item>18.5544° N , 73.7759°</span>
      </div>

      {/* middle — the ask + the channels */}
      <div className="relative z-[1] flex flex-1 flex-col justify-center gap-14 px-[var(--gutter)] py-16 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        <div className="max-w-3xl">
          <h2
            data-footer-item
            className="text-[clamp(1.75rem,3.4vw,3rem)] font-bold leading-[1.05] tracking-[-0.02em]"
          >
            Let&rsquo;s build something
            <br />
            that ships.
          </h2>
          {note && (
            <p
              data-footer-item
              className="mt-5 max-w-md text-[15px] font-medium leading-relaxed text-fg/55"
            >
              {note}
            </p>
          )}
          {email && (
            <div data-footer-item className="mt-10">
              <Magnetic strength={0.15}>
                <a
                  href={`mailto:${email}`}
                  className="group inline-flex items-baseline gap-3 text-[clamp(1.15rem,2.4vw,2.1rem)] font-semibold tracking-[-0.01em]"
                >
                  <span className="relative">
                    {email}
                    {/* underline sweep */}
                    <span className="absolute -bottom-1 left-0 h-px w-full origin-right scale-x-0 bg-fg transition-transform duration-500 ease-out group-hover:origin-left group-hover:scale-x-100" />
                  </span>
                  <ArrowUpRight
                    className="shrink-0 self-center transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                    size={22}
                  />
                </a>
              </Magnetic>
            </div>
          )}
        </div>

        {/* link columns — two balanced columns (Index / Connect) */}
        <div className="grid grid-cols-2 gap-x-16 text-[15px] sm:gap-x-24">
          <div data-footer-item>
            <p className="mb-5 text-[12px] font-bold uppercase tracking-widest text-fg/40">
              Index
            </p>
            <ul className="space-y-3 font-medium">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href as Route}
                    onClick={(e) => {
                      const target = item.href.split("#")[0] || "/";
                      if (target !== pathname) {
                        e.preventDefault();
                        hardNavigate(item.href);
                      }
                    }}
                    className="group inline-flex items-center gap-1.5 text-fg/70 transition-colors hover:text-fg"
                  >
                    {item.label}
                    <ArrowUpRight
                      size={14}
                      className="opacity-0 -translate-x-1 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div data-footer-item>
            <p className="mb-5 text-[12px] font-bold uppercase tracking-widest text-fg/40">
              Connect
            </p>
            <ul className="space-y-3 font-medium">
              {connectLinks.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group inline-flex items-center gap-1.5 text-fg/70 transition-colors hover:text-fg"
                  >
                    {s.label}
                    <ArrowUpRight
                      size={14}
                      className="opacity-0 -translate-x-1 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* meta row — © / local time / back to top */}
      <div className="relative z-[1] flex items-center justify-between px-[var(--gutter)] pb-6 text-[13px] font-medium text-fg/50">
        <span data-footer-item>
          © {year} {brand}. All rights reserved.
        </span>
        <span data-footer-item className="max-sm:hidden">
          <LocalTime />
        </span>
        <span data-footer-item>
          <Magnetic strength={0.3}>
            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Back to top"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-fg/25 text-fg/80 transition-colors hover:border-fg/70 hover:text-fg"
            >
              <ArrowUp size={17} />
            </button>
          </Magnetic>
        </span>
      </div>

      {/* THE wordmark — full bleed, edge to edge, baseline cropped by the fold */}
      <div
        aria-hidden="true"
        className="relative z-[1] flex select-none justify-between px-[2vw] leading-[0.76] tracking-[-0.03em]"
      >
        {WORDMARK.split("").map((letter, i) => (
          <span
            key={i}
            className="block overflow-hidden transition-transform duration-300 ease-out hover:-translate-y-2"
          >
            <span
              data-wordmark-letter
              className="block -mb-[0.16em] font-bold text-fg [font-size:clamp(4.5rem,17.5vw,21rem)]"
            >
              {letter}
            </span>
          </span>
        ))}
      </div>
    </footer>
  );
}
