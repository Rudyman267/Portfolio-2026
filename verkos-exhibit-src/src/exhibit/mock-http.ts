/**
 * EXHIBIT SHIM — offline HTTP client.
 *
 * The real app talks to live FlytBase services through an axios instance handed
 * out by `useHttp()`. This exhibit ships as a static build on a portfolio site
 * with no backend, so that instance is replaced by this router: it matches the
 * request URL against known endpoints and resolves canned data in the exact
 * shape the caller destructures.
 *
 * Rules:
 *  - NEVER throw and NEVER hit the network. Unknown endpoints resolve to an
 *    empty-but-valid envelope so a screen renders empty rather than crashing.
 *  - Small artificial latency so loading states are actually visible — the
 *    point of the exhibit is to show the product's behaviour, including how it
 *    handles waiting.
 */

import { DEMO_WIZARD_FLIGHTS, DEMO_GALLERY_IMAGES, DEMO_SITE } from '@/data/demo-scenario';
import { assetUrl } from './asset-url';

const ORG_ID = 'demo-org-verkos';

/** Artificial latency (ms) so spinners/skeletons render for a beat. */
const LATENCY = 260;

function delay<T>(value: T, ms = LATENCY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function ok<T>(data: T) {
  return delay({ data, status: 200, statusText: 'OK', headers: {}, config: {} });
}

// ─── Flights ─────────────────────────────────────────────────────────

/** Turn the demo flight rows into the FlightLog shape the flights API returns. */
function buildFlightLogs() {
  const dayOffset: Record<string, number> = {
    Today: 0,
    Yesterday: 1,
    '3 days ago': 3,
    '5 days ago': 5,
  };

  return DEMO_WIZARD_FLIGHTS.map((f) => {
    const offset = dayOffset[f.date] ?? 0;
    const [hh, mm] = f.time.split(':').map(Number);
    const start = new Date();
    start.setDate(start.getDate() - offset);
    start.setHours(hh, mm, 0, 0);
    const end = new Date(start.getTime() + f.durationSec * 1000);

    return {
      flight_id: f.id,
      task_id: f.id,
      site_details: { site_id: f.siteId, site_name: DEMO_SITE.name },
      drone_details: {
        drone_id: `drone-${f.drone.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        drone_name: f.drone,
        drone_model: f.drone.includes('M3DT') ? 'Matrice 3DT' : 'Matrice 4TD',
      },
      docking_station: {
        docking_station_name: f.dock,
        docking_station_id: `dock-${f.dock.replace(/\s+/g, '-').toLowerCase()}`,
      },
      missions: [
        {
          mission_name: f.missionName,
          mission_id: `mission-${f.id}`,
          type: 'path',
          mission_start_time: start.toISOString(),
          mission_end_time: end.toISOString(),
        },
      ],
      timestamp: start.toISOString(),
      total_media: f.imageCount,
      uploaded_media: f.imageCount,
      fb_media_count: f.imageCount,
      media_metadata_count: f.imageCount,
    };
  }).sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
}

// ─── Media ───────────────────────────────────────────────────────────

/** Media files for one flight, drawn from the demo gallery. */
function buildMediaForFlight(taskId: string) {
  const images = DEMO_GALLERY_IMAGES.filter((g) => g.flightId === taskId);
  const pool = images.length ? images : DEMO_GALLERY_IMAGES.slice(0, 4);

  return pool.map((g, i) => ({
    media_id: g.id,
    flight_id: taskId,
    task_id: taskId,
    file_name: g.filename,
    file_type: 0, // image
    file_extension: 'jpg',
    data_url: assetUrl(g.url),
    thumbnail_url: assetUrl(g.thumbnailUrl || g.url),
    capture_timestamp: new Date(Date.now() - i * 60_000).toISOString(),
    location: {
      lat: parseFloat(String(g.gpsLat)) || 18.5623,
      long: parseFloat(String(g.gpsLng)) || 73.6959,
      alt: g.altitudeM ?? 20,
    },
    lens_type: null,
    tag_ids: [],
  }));
}

// ─── Sites (FlytBase-side representation) ────────────────────────────

/**
 * The sites endpoint returns ISite records — a different shape from the app's
 * own `Site` type. These stand in for "sites that exist in FlytBase", which is
 * what the Import-from-FlytBase flow pulls.
 *
 * ⚠️ ID CONVENTION: `mergeApiAndLocalSites` (src/utils/map-api-site.ts) looks up
 * each API site's enriched local twin as `site-fb-${apiSite._id}`. These `_id`s
 * are therefore chosen so the seeded EXTRA_SITES merge into ONE entry each —
 * mismatched ids render every site twice in the list and the wizard.
 * `westfield-hub` deliberately has no local twin: it stands for a site that
 * exists in FlytBase but has not been enriched with context yet.
 */
function buildApiSites() {
  const rows = [
    { id: 'northgate-solar', name: 'Northgate Solar Array', lat: 17.9784, lng: 73.8412 },
    { id: 'harbour-terminal', name: 'Harbour Terminal 4', lat: 18.9402, lng: 72.8347 },
    { id: 'meridian-dc', name: 'Meridian Data Centre Campus', lat: 12.9698, lng: 77.75 },
    { id: 'westfield-hub', name: 'Westfield Distribution Hub', lat: 19.2183, lng: 72.9781 },
  ];

  return rows.map((r, i) => ({
    _id: r.id,
    name: r.name,
    organization_id: ORG_ID,
    owner_id: 'demo-user',
    created_at: new Date(Date.now() - (90 - i * 12) * 86400_000).toISOString(),
    updated_by: 'demo-user',
    updated_at: new Date(Date.now() - (i + 1) * 86400_000).toISOString(),
    coordinates: { lat: r.lat, lng: r.lng, _id: `coord-${r.id}` },
    members: ['demo-user'],
    devices: [],
    missions: [
      { _id: `m-${r.id}-1`, name: 'Perimeter patrol' },
      { _id: `m-${r.id}-2`, name: 'Asset inspection' },
    ],
  }));
}

// ─── Forensic search + detections ────────────────────────────────────

/** Images that carry a detection, used to answer forensic text search. */
function detectionImages() {
  return DEMO_GALLERY_IMAGES.filter((g) => g.hasDetection);
}

function buildForensicResults(query: string, topK: number) {
  // Rank naively by token overlap with the detection label so different
  // detection events surface different frames — the wizard runs one query per
  // enabled event and de-dupes by media_id.
  const terms = query.toLowerCase().split(/\W+/).filter((t) => t.length > 3);

  const scored = detectionImages().map((g) => {
    const hay = `${g.detectionLabel ?? ''} ${g.flightName ?? ''} ${g.filename}`.toLowerCase();
    const hits = terms.reduce((n, t) => (hay.includes(t) ? n + 1 : n), 0);
    return { g, score: 0.55 + hits * 0.12 + (g.detectionConfidence ?? 80) / 1000 };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ g, score }) => ({
      id: `fs-${g.id}`,
      score: Math.min(score, 0.99),
      source_file: g.filename,
      source_type: 'image',
      media_id: g.id,
      flight_id: g.flightId,
      mission_id: `mission-${g.flightId}`,
      site_id: g.siteId,
      file_type: 'image',
      capture_timestamp: new Date().toISOString(),
      latitude: parseFloat(String(g.gpsLat)) || 18.5623,
      longitude: parseFloat(String(g.gpsLng)) || 73.6959,
      data_url: assetUrl(g.url),
      thumbnail_url: assetUrl(g.thumbnailUrl || g.url),
      download_url: null,
      detected_objects: g.detectionLabel ? [g.detectionLabel] : [],
      object_counts: g.detectionLabel ? { [g.detectionLabel]: 1 } : {},
      max_confidence: g.detectionLabel
        ? { [g.detectionLabel]: (g.detectionConfidence ?? 90) / 100 }
        : {},
      gimbal_yaw: 0,
      gimbal_pitch: g.gimbalPitch ?? -35,
    }));
}

/** Plausible bounding boxes, keyed to the frames that have baked-in detections. */
const BBOXES: Record<string, Array<{ bbox: [number, number, number, number]; class: string; conf: number }>> = {
  'demo-img-1': [{ bbox: [1520, 1180, 1180, 720], class: 'truck', conf: 0.98 }],
  'demo-img-2': [{ bbox: [1520, 1180, 1180, 720], class: 'truck', conf: 0.98 }],
  'demo-img-3': [{ bbox: [1180, 1420, 1460, 560], class: 'fence_damage', conf: 0.92 }],
  'demo-img-4': [{ bbox: [1180, 1420, 1460, 560], class: 'fence_damage', conf: 0.92 }],
  'demo-img-5': [{ bbox: [260, 180, 140, 190], class: 'person', conf: 0.91 }],
  'demo-img-7': [
    { bbox: [180, 250, 90, 70], class: 'deer', conf: 0.85 },
    { bbox: [320, 280, 85, 65], class: 'deer', conf: 0.81 },
  ],
  'demo-img-8': [
    { bbox: [820, 1240, 980, 690], class: 'truck', conf: 0.98 },
    { bbox: [1980, 1300, 900, 620], class: 'truck', conf: 0.96 },
    { bbox: [2980, 1420, 620, 500], class: 'forklift', conf: 0.93 },
  ],
  'demo-img-9': [
    { bbox: [820, 1240, 980, 690], class: 'truck', conf: 0.98 },
    { bbox: [1980, 1300, 900, 620], class: 'truck', conf: 0.96 },
    { bbox: [2980, 1420, 620, 500], class: 'forklift', conf: 0.93 },
  ],
  'demo-img-10': [{ bbox: [1420, 640, 720, 540], class: 'light_fixture', conf: 0.94 }],
};

function buildDetections(mediaId: string) {
  const objects = BBOXES[mediaId] ?? [];
  const img = DEMO_GALLERY_IMAGES.find((g) => g.id === mediaId);
  const isThermal = (img?.resolution ?? '').startsWith('640');

  return {
    organizationId: ORG_ID,
    mediaId,
    totalClips: 1,
    detection_resolution: (isThermal ? [640, 480] : [4000, 3000]) as [number, number],
    detection_model: 'verkos-daa-v2',
    detected_objects: objects.map((o) => o.class),
    detections: [{ t: 0, objects }],
  };
}

// ─── Router ──────────────────────────────────────────────────────────

function route(method: string, url: string, _body?: unknown) {
  const path = url.split('?')[0];

  // Flights list
  if (/(^|\/)v2\/flight$/.test(path)) {
    const logs = buildFlightLogs();
    return ok({
      flightLogs: logs,
      total: { value: logs.length, relation: 'eq' },
      page: '1',
      limit: String(logs.length),
    });
  }

  // Media for a flight/task folder
  const folder = path.match(/v2\/objects\/folder\/([^/]+)/);
  if (folder) {
    const taskId = folder[1];
    const files = buildMediaForFlight(taskId);
    return ok({
      media: [{ task_id: taskId, files, total_media: files.length }],
      page: 1,
      limit: 200,
    });
  }

  // Flat media listing
  if (/v2\/objects\/files/.test(path)) {
    const files = DEMO_GALLERY_IMAGES.slice(0, 40).map((g) => buildMediaForFlight(g.flightId)[0]).filter(Boolean);
    return ok({ media: [{ task_id: 'all', files, total_media: files.length }], page: 1, limit: 200 });
  }

  // Forensic detections for one media item
  const det = path.match(/ai-search\/search\/detections\/([^/]+)/);
  if (det) return ok(buildDetections(det[1]));

  // Forensic text search
  if (/ai-search\/search\/text/.test(path)) {
    const b = (_body ?? {}) as { query?: string; top_k?: number };
    const results = buildForensicResults(b.query ?? '', b.top_k ?? 10);
    return ok({
      query_type: 'text',
      query: b.query ?? '',
      total_results: results.length,
      results,
      search_time_ms: 180,
    });
  }

  // Sites — NOTE the endpoint is `sites/` (no leading slash) and the response
  // is a BARE ARRAY of ISite, not an envelope. Returning an object here makes
  // SitesList's `mergeApiAndLocalSites` throw "e is not iterable".
  if (/(^|\/)sites\/?$/.test(path)) {
    return ok(buildApiSites());
  }

  // User profile / org — keep the header populated.
  if (/user.*profile|profile.*user|\/me$/.test(path)) {
    return ok({
      user_id: 'demo-user',
      first_name: 'Kavya',
      last_name: 'Nair',
      email: 'k.nair@demo.verkos',
      organization_id: ORG_ID,
    });
  }

  if (/organization/.test(path)) {
    return ok({
      organization_id: ORG_ID,
      organization_name: 'Verkos Demo Org',
      name: 'Verkos Demo Org',
    });
  }

  if (/subscription/.test(path)) {
    return ok({ plan: 'enterprise', status: 'active', features: [] });
  }

  if (/feature-flag|featureFlag|flags/.test(path)) {
    return ok({ flags: {} });
  }

  // Unknown endpoint: valid-but-empty so callers render an empty state.
  return ok({} as Record<string, unknown>);
}

export interface MockHttpClient {
  get: <T = unknown>(url: string, config?: unknown) => Promise<{ data: T }>;
  post: <T = unknown>(url: string, body?: unknown, config?: unknown) => Promise<{ data: T }>;
  put: <T = unknown>(url: string, body?: unknown, config?: unknown) => Promise<{ data: T }>;
  patch: <T = unknown>(url: string, body?: unknown, config?: unknown) => Promise<{ data: T }>;
  delete: <T = unknown>(url: string, config?: unknown) => Promise<{ data: T }>;
  request: <T = unknown>(config: { url?: string; method?: string; data?: unknown }) => Promise<{ data: T }>;
  defaults: Record<string, unknown>;
  interceptors: {
    request: { use: () => number; eject: () => void };
    response: { use: () => number; eject: () => void };
  };
}

const noopInterceptor = { use: () => 0, eject: () => undefined };

export const mockHttpClient = {
  get: (url: string) => route('get', url),
  post: (url: string, body?: unknown) => route('post', url, body),
  put: (url: string, body?: unknown) => route('put', url, body),
  patch: (url: string, body?: unknown) => route('patch', url, body),
  delete: (url: string) => route('delete', url),
  request: (config: { url?: string; method?: string; data?: unknown }) =>
    route(config.method ?? 'get', config.url ?? '', config.data),
  defaults: { baseURL: '/', headers: {} },
  interceptors: { request: noopInterceptor, response: noopInterceptor },
} as unknown as MockHttpClient;

export function createHttpClient(): MockHttpClient {
  return mockHttpClient;
}
