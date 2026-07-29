/**
 * EXHIBIT BOOTSTRAP — runs once before the router mounts.
 *
 * Order matters:
 *   1. Seed flight contexts FIRST. `enterDemoMode()` reads
 *      `flightContexts['demo-flight-1'..5]` to build its report — if they are
 *      missing the demo report ships with no pilot context at all.
 *   2. Seed the empty base collections (sites / reports / drafts).
 *   3. Then turn demo mode on, which layers in the demo site, agent, gallery
 *      and headline report and flips every AI/flight code path to its offline
 *      branch.
 */

import { useReportStore } from '@/store/report.store';
import { startIconSwap } from './icon-swap';
import {
  EXTRA_SITES,
  SEED_FLIGHT_CONTEXTS,
  buildExtraReports,
  buildSeedDrafts,
  buildSeedGallery,
} from './seed-data';

let done = false;

export function bootstrapExhibit(): void {
  if (done) return;
  done = true;

  // FontAwesome Pro is not loaded — swap its <i> tags for inline lucide SVGs.
  startIconSwap();

  const store = useReportStore.getState();

  // 1 — flight contexts (merge; never clobber anything a visitor has typed)
  useReportStore.setState((s) => {
    const contexts = { ...s.flightContexts };
    for (const c of SEED_FLIGHT_CONTEXTS) {
      if (!contexts[c.flightId]) contexts[c.flightId] = c;
    }
    return { flightContexts: contexts };
  });

  // 2 — base collections the app ships empty
  const template = store.templates[0];

  useReportStore.setState((s) => {
    const haveSite = new Set(s.sites.map((x) => x.id));
    const haveReport = new Set(s.reports.map((x) => x.id));
    const haveImage = new Set(s.galleryImages.map((x) => x.id));

    const extraReports = template ? buildExtraReports(template) : [];

    return {
      sites: [...s.sites, ...EXTRA_SITES.filter((x) => !haveSite.has(x.id))],
      reports: [...s.reports, ...extraReports.filter((r) => !haveReport.has(r.id))],
      drafts: s.drafts.length ? s.drafts : buildSeedDrafts(),
      // media for flights 6-12, which the app's demo gallery does not cover
      galleryImages: [
        ...s.galleryImages,
        ...buildSeedGallery().filter((g) => !haveImage.has(g.id)),
      ],
      currentOrgId: null, // stays null so nothing tries to sync to Supabase
    };
  });

  // 3 — demo mode last, so its records sit at the top of each list
  useReportStore.getState().enterDemoMode();
}
