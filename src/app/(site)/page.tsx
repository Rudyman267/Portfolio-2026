import { Hero } from "@/components/sections/Hero";
import { WorksIndexStatic } from "@/components/sections/WorksJourney";
import { HomeDarkBody } from "@/app/(site)/HomeDarkBody";

export default async function HomePage() {
  // The work showcase lives INSIDE the hero's pinned journey now (project-node
  // beats over the tunnel — WorksJourney.tsx). WorksIndexStatic is the
  // reduced-motion fallback so the case studies stay reachable without the
  // scrub. Contact lives in the full-viewport Footer finale (site layout).
  // Dark wrapper: the whole home experience is the near-black canvas (hero
  // tunnel → footer). The page body's default background is warm near-white,
  // and on touch the hero's pin-spacer could briefly under-cover as the pin
  // released — flashing that white at the bottom. Painting the home root
  // #06080c means any pin/spacer gap shows the dark canvas instead. Scoped to
  // this page, so the light /work index and other routes are untouched.
  return (
    <div className="bg-[#06080c]">
      <HomeDarkBody />
      <Hero />
      <WorksIndexStatic />
    </div>
  );
}
