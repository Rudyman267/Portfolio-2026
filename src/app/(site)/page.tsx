import { Hero } from "@/components/sections/Hero";
import { WorkGallery } from "@/components/sections/WorkGallery";

export default async function HomePage() {
  // WorkGallery falls back to placeholder projects while Sanity is empty;
  // it'll take a FEATURED_PROJECTS_QUERY result once content exists.
  // Contact lives in the full-viewport Footer finale (site layout) — /#contact.
  return (
    <>
      <Hero />
      <WorkGallery />
    </>
  );
}
