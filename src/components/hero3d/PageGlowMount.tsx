"use client";

import dynamic from "next/dynamic";

/**
 * Client boundary for PageGlow.
 *
 * `next/dynamic` with `ssr: false` is NOT allowed in a Server Component (Next
 * 16 errors at build time), and /work + /play are server components because
 * they fetch site settings. So the dynamic import lives here instead — three +
 * the WebGL field stay out of the server bundle and off SSR, and the pages just
 * render <PageGlowMount />.
 */
const PageGlow = dynamic(
  () => import("@/components/hero3d/PageGlow").then((m) => m.PageGlow),
  { ssr: false },
);

export function PageGlowMount() {
  return <PageGlow />;
}
