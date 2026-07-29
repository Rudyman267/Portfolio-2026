import { ISite } from '@/libs/shared/api-modules/sites/types/sites.types';
import { Site } from '../types/report.types';

/**
 * Maps an API ISite to the local Site type used by UI components.
 * Uses `name` as the primary identifier/key for mapping.
 */
export const mapApiSiteToSite = (apiSite: ISite): Site => ({
  id: `site-fb-${apiSite._id}`,
  name: apiSite.name,
  description: '',
  location: apiSite.coordinates
    ? `${apiSite.coordinates.lat.toFixed(4)}, ${apiSite.coordinates.lng.toFixed(4)}`
    : '',
  timezone: '',
  operatingHours: '',
  siteType: apiSite.missions?.length ? 'Operational' : 'Configured',
  assets: [],
  context: '',
  imageUrl: null,
  createdAt: apiSite.created_at,
  updatedAt: apiSite.updated_at,
});

/**
 * Merges API sites with locally-stored sites.
 * Local sites with matching IDs (site-fb-*) get priority (they have enriched data from import).
 * Non-imported API sites appear as-is.
 * Manually-created local sites (no site-fb- prefix) are always included.
 */
export const mergeApiAndLocalSites = (
  apiSites: ISite[],
  localSites: Site[]
): Site[] => {
  const localById = new Map(localSites.map((s) => [s.id, s]));
  const merged: Site[] = [];
  const seen = new Set<string>();

  // API sites first — use local enriched version if available
  for (const apiSite of apiSites) {
    const localId = `site-fb-${apiSite._id}`;
    const local = localById.get(localId);
    merged.push(local ?? mapApiSiteToSite(apiSite));
    seen.add(localId);
  }

  // Add any manually-created local sites
  for (const local of localSites) {
    if (!seen.has(local.id)) {
      merged.push(local);
    }
  }

  return merged;
};
