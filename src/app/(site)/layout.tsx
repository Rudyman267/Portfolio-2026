import type { ReactNode } from "react";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";
import { Loader } from "@/components/motion/Loader";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SanityLive } from "@/sanity/live";
import { sanityFetch } from "@/sanity/live";
import { SITE_SETTINGS_QUERY } from "@/sanity/queries";
import { DEFAULT_NAV, type NavItem } from "@/components/layout/Nav";
import { DisableDraftMode } from "@/components/DisableDraftMode";

export default async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { isEnabled: isDraft } = await draftMode();

  const { data: settings } = await sanityFetch({
    query: SITE_SETTINGS_QUERY,
    tags: ["siteSettings"],
  });

  const brand = settings?.title ?? "Rudyman";
  const nav: NavItem[] =
    settings?.nav?.length
      ? settings.nav.map((n) => ({ label: n?.label ?? "", href: n?.href ?? "/" }))
      : DEFAULT_NAV;
  const socials =
    settings?.socials?.map((s) => ({
      label: s?.label ?? "",
      href: s?.href ?? "#",
    })) ?? [];

  return (
    <SmoothScrollProvider>
      <Loader />
      <div className="flex min-h-dvh flex-col">
        <Header brand={brand} nav={nav} />
        <main className="flex-1">{children}</main>
        <Footer
          brand={brand}
          // TODO(content): served from Sanity Site Settings once filled in
          email={settings?.email ?? "riddhimandeb12@gmail.com"}
          socials={socials}
          resumeUrl={settings?.resumeUrl ?? undefined}
          nav={nav}
          note={
            settings?.footerText ??
            "AI-native Product Designer who ships code and design at breakthrough speed."
          }
        />
      </div>
      <SanityLive />
      {isDraft && (
        <>
          <VisualEditing />
          <DisableDraftMode />
        </>
      )}
    </SmoothScrollProvider>
  );
}
