import { Hero } from "@/components/sections/Hero";
import { WorksIndexStatic } from "@/components/sections/WorksJourney";

export default async function HomePage() {
  // The work showcase lives INSIDE the hero's pinned journey now (project-node
  // beats over the tunnel — WorksJourney.tsx). WorksIndexStatic is the
  // reduced-motion fallback so the case studies stay reachable without the
  // scrub. Contact lives in the full-viewport Footer finale (site layout).
  return (
    <>
      <Hero />
      <WorksIndexStatic />
    </>
  );
}
