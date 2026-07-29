import { Site, Agent, Report, Observation, ReportSection, ReportTemplate } from '../types/report.types';
import type { FlightContext } from '../types/report.types';
import type { GalleryImage } from '../components/reports/MediaGallery';
import { templateSectionToKind } from '../types/report.types';
import { assetUrl } from '@/exhibit/asset-url';

// ─── Pilot context helpers ───────────────────────────────────────────

function buildCombinedContext(contexts: FlightContext[]): string {
  if (!contexts.length) return '';
  const blocks = contexts
    .filter((c) => c.text.trim() || Object.keys(c.imageNotes).length > 0)
    .map((ctx, i) => {
      const parts: string[] = [`**Flight ${i + 1} (${ctx.captureMode}):**`];
      if (ctx.text.trim()) parts.push(ctx.text.trim());
      const entries = Object.entries(ctx.imageNotes);
      if (entries.length) {
        parts.push('**Per-image notes:**');
        entries.forEach(([key, note]) => parts.push(`- ${key}: ${note}`));
      }
      return parts.join('\n');
    });
  return blocks.join('\n\n');
}

const DOWNGRADE_KW = ['authorized', 'contractor', 'expected', 'scheduled', 'approved', 'known', 'confirmed', 'signed in', 'routine'];
const UPGRADE_KW = ['concern', 'escalate', 'unusual', 'incident', 'suspicious', 'unfamiliar', 'unauthorized', 'unknown', 'worse'];

function extractRelevantSentence(context: string, obs: Observation): string | null {
  const keywords = obs.title.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
  const sentences = context.split(/[.!?\n]+/).map((s) => s.trim()).filter(Boolean);
  for (const s of sentences) {
    const lower = s.toLowerCase();
    if (keywords.some((kw) => lower.includes(kw))) return s;
  }
  return null;
}

function applyContextToObservations(observations: Observation[], combinedContext: string): Observation[] {
  if (!combinedContext) return observations;
  return observations.map((obs) => {
    const relevant = extractRelevantSentence(combinedContext, obs);
    if (!relevant) return obs;

    let severity = obs.severity;
    let status = obs.status;
    const lower = relevant.toLowerCase();
    const hasDowngrade = DOWNGRADE_KW.some((kw) => lower.includes(kw));
    const hasUpgrade = UPGRADE_KW.some((kw) => lower.includes(kw));

    if (hasDowngrade && !hasUpgrade) {
      if (severity === 'critical') severity = 'moderate';
      else if (severity === 'high') severity = 'low';
      else if (severity === 'moderate') severity = 'low';
      status = 'resolved';
    } else if (hasUpgrade && !hasDowngrade) {
      if (severity === 'low') severity = 'moderate';
      else if (severity === 'moderate') severity = 'high';
    }

    return {
      ...obs,
      severity,
      status,
      pilotContext: relevant,
      aiDescription: `_Pilot noted: "${relevant}"_\n\n${obs.aiDescription}`,
    };
  });
}


// ─── DEMO SITE ───────────────────────────────────────────────────────

export const DEMO_SITE: Site = {
  id: 'demo-site-skybase-alpha',
  name: 'Skybase Alpha',
  description: 'High-security industrial facility with 4 perimeter sectors under 24/7 drone patrol. Active construction zone on the north side, controlled access via east and west gates.',
  location: '18.5623°N, 73.6959°E · Pune, Maharashtra',
  timezone: 'Asia/Kolkata (IST)',
  operatingHours: '24/7 — Day shift 06:00-18:00, Night shift 18:00-06:00',
  siteType: 'Industrial facility',
  assets: [
    { id: 'asset-demo-1', name: 'East gate', type: 'Access point', description: 'Primary vehicle entry. Two unauthorized access attempts in the past month.' },
    { id: 'asset-demo-2', name: 'West gate', type: 'Access point', description: 'Pedestrian entry, badge reader. Lighting gap between waypoints 8-12.' },
    { id: 'asset-demo-3', name: 'North perimeter', type: 'Barrier', description: 'Construction-adjacent fence. Increased activity expected.' },
    { id: 'asset-demo-4', name: 'South perimeter', type: 'Barrier', description: 'Known deterioration near waypoint 15 — tracked since March 2026.' },
    { id: 'asset-demo-5', name: 'Northern loading bay', type: 'Operations area', description: 'Authorized construction crew equipment only.' },
    { id: 'asset-demo-6', name: 'Main warehouse', type: 'Building', description: 'Central storage. Roof inspection due next month.' },
  ],
  context: 'Skybase Alpha is a high-security industrial facility operating 24/7 with drone patrols covering 4 perimeter sectors. Key context: (1) The east gate has had 2 unauthorized access attempts in the past month — any unregistered vehicles near this gate should be flagged as high severity. (2) The south boundary fence has a known deterioration issue near waypoint 15 that has been worsening over the past 3 weeks. (3) A construction crew has been authorized to use the northern loading bay for the past 3 weeks — their equipment is expected and should be classified as low severity with a note confirming authorization. (4) Night patrols should pay special attention to the west perimeter where lighting coverage has gaps between waypoints 8-12.',
  imageUrl: null,
  createdAt: '2026-01-15T00:00:00Z',
  updatedAt: '2026-04-10T00:00:00Z',
};

// ─── DEMO AGENT ──────────────────────────────────────────────────────

export const DEMO_AGENT: Agent = {
  id: 'demo-agent-night-watch',
  name: 'Night surveillance agent',
  description: 'Optimized for low-light patrol conditions. Monitors thermal signatures, activity patterns, and perimeter integrity during night shift operations.',
  domain: 'surveillance',
  status: 'active',
  icon: 'fa-solid fa-moon',
  reportCount: 47,
  createdAt: '2026-02-10T00:00:00Z',
  updatedAt: '2026-04-14T00:00:00Z',
  config: {
    detectionEvents: [
      { id: 'demo-evt-1', name: 'Thermal anomaly', description: 'Detect human-sized heat signatures in restricted areas', enabled: true, defaultSeverity: 'high', compareHistorical: true },
      { id: 'demo-evt-2', name: 'Movement detection', description: 'Track movement patterns in low-visibility conditions', enabled: true, defaultSeverity: 'moderate', compareHistorical: false },
      { id: 'demo-evt-3', name: 'Vehicle detection', description: 'Identify and classify vehicles within the patrol zone', enabled: true, defaultSeverity: 'high', compareHistorical: true },
      { id: 'demo-evt-4', name: 'Perimeter breach', description: 'Identify gaps, cuts, or damage in fencing', enabled: true, defaultSeverity: 'critical', compareHistorical: true },
      { id: 'demo-evt-5', name: 'Wildlife', description: 'Classify wildlife vs human thermal signatures', enabled: true, defaultSeverity: 'low', compareHistorical: false },
      { id: 'demo-evt-6', name: 'Lighting failure', description: 'Detect unlit sectors or lamp failures', enabled: true, defaultSeverity: 'moderate', compareHistorical: false },
    ],
    analysisDepth: 'detailed',
    tone: 'operational',
    autoGenerate: true,
    defaultTemplateId: 'tpl-verkos-standard',
  },
};

// ─── DEMO GALLERY IMAGES (24 images: 10 with detections, 14 supporting) ─

export const DEMO_GALLERY_IMAGES: GalleryImage[] = [
  { id: 'demo-img-1', url: assetUrl('/demo/east-gate-raw.jpg'), thumbnailUrl: assetUrl('/demo/east-gate-raw.jpg'), flightId: 'demo-flight-1', flightName: 'Night sweep — Full perimeter', timestamp: '18:14:22', droneName: 'M4TD-NightOps', dockName: 'Dock 3', siteId: 'demo-site-skybase-alpha', siteName: 'Skybase Alpha', hasDetection: true, detectionLabel: 'Vehicle (unregistered)', detectionConfidence: 98, filename: 'east_gate_1814.jpg', gpsLat: '18.5624°N', gpsLng: '73.6961°E', altitudeM: 18, gimbalPitch: -35, resolution: '4000x3000', fileSizeMB: 0.3, pilotNote: 'White pickup not on today\'s access register. Possibly visitor for construction crew but no entry logged.' },
  { id: 'demo-img-2', url: assetUrl('/demo/east-gate-annotated.jpg'), thumbnailUrl: assetUrl('/demo/east-gate-annotated.jpg'), flightId: 'demo-flight-1', flightName: 'Night sweep — Full perimeter', timestamp: '18:14:22', droneName: 'M4TD-NightOps', dockName: 'Dock 3', siteId: 'demo-site-skybase-alpha', siteName: 'Skybase Alpha', hasDetection: true, detectionLabel: 'Vehicle (bounding box)', detectionConfidence: 98, filename: 'east_gate_1814_annotated.jpg', gpsLat: '18.5624°N', gpsLng: '73.6961°E', altitudeM: 18, gimbalPitch: -35, resolution: '4000x3000', fileSizeMB: 0.3, pilotNote: '' },
  { id: 'demo-img-3', url: assetUrl('/demo/south-fence-raw.jpg'), thumbnailUrl: assetUrl('/demo/south-fence-raw.jpg'), flightId: 'demo-flight-2', flightName: 'South sector thermal sweep', timestamp: '19:47:03', droneName: 'M4TD-NightOps', dockName: 'Dock 3', siteId: 'demo-site-skybase-alpha', siteName: 'Skybase Alpha', hasDetection: true, detectionLabel: 'Fence deformation', detectionConfidence: 92, filename: 'south_fence_1947.jpg', gpsLat: '18.5601°N', gpsLng: '73.6958°E', altitudeM: 12, gimbalPitch: -45, resolution: '4000x3000', fileSizeMB: 0.3, pilotNote: 'Gap has widened since last patrol. Estimated 0.6m now vs 0.4m two weeks ago. Needs urgent ground inspection.' },
  { id: 'demo-img-4', url: assetUrl('/demo/south-fence-annotated.jpg'), thumbnailUrl: assetUrl('/demo/south-fence-annotated.jpg'), flightId: 'demo-flight-2', flightName: 'South sector thermal sweep', timestamp: '19:47:03', droneName: 'M4TD-NightOps', dockName: 'Dock 3', siteId: 'demo-site-skybase-alpha', siteName: 'Skybase Alpha', hasDetection: true, detectionLabel: 'Perimeter breach (ongoing)', detectionConfidence: 92, filename: 'south_fence_1947_annotated.jpg', gpsLat: '18.5601°N', gpsLng: '73.6958°E', altitudeM: 12, gimbalPitch: -45, resolution: '4000x3000', fileSizeMB: 0.3, pilotNote: '' },
  { id: 'demo-img-5', url: assetUrl('/demo/west-thermal.jpg'), thumbnailUrl: assetUrl('/demo/west-thermal.jpg'), flightId: 'demo-flight-3', flightName: 'West perimeter thermal', timestamp: '21:33:18', droneName: 'M4TD-NightOps', dockName: 'Dock 3', siteId: 'demo-site-skybase-alpha', siteName: 'Skybase Alpha', hasDetection: true, detectionLabel: 'Thermal signature (human-sized)', detectionConfidence: 91, filename: 'west_thermal_2133.jpg', gpsLat: '18.5615°N', gpsLng: '73.6940°E', altitudeM: 30, gimbalPitch: -60, resolution: '640x480', fileSizeMB: 0.1, pilotNote: 'Stationary thermal hit in the dark zone between WP8 and WP12. Too large for wildlife, too still for movement. Sending ground team.' },
  { id: 'demo-img-6', url: assetUrl('/demo/west-visual.jpg'), thumbnailUrl: assetUrl('/demo/west-visual.jpg'), flightId: 'demo-flight-3', flightName: 'West perimeter thermal', timestamp: '21:33:19', droneName: 'M4TD-NightOps', dockName: 'Dock 3', siteId: 'demo-site-skybase-alpha', siteName: 'Skybase Alpha', hasDetection: false, detectionLabel: null, detectionConfidence: null, filename: 'west_visual_2133.jpg', gpsLat: '18.5615°N', gpsLng: '73.6940°E', altitudeM: 30, gimbalPitch: -60, resolution: '4000x3000', fileSizeMB: 0.3, pilotNote: '' },
  { id: 'demo-img-7', url: assetUrl('/demo/wildlife-thermal.jpg'), thumbnailUrl: assetUrl('/demo/wildlife-thermal.jpg'), flightId: 'demo-flight-3', flightName: 'West perimeter thermal', timestamp: '21:41:55', droneName: 'M4TD-NightOps', dockName: 'Dock 3', siteId: 'demo-site-skybase-alpha', siteName: 'Skybase Alpha', hasDetection: true, detectionLabel: 'Wildlife (deer, multiple)', detectionConfidence: 85, filename: 'south_wildlife_2141.jpg', gpsLat: '18.5598°N', gpsLng: '73.6965°E', altitudeM: 30, gimbalPitch: -45, resolution: '640x480', fileSizeMB: 0.1, pilotNote: 'Same deer as usual. They never approach the fence. Routine.' },
  { id: 'demo-img-8', url: assetUrl('/demo/loading-bay-raw.jpg'), thumbnailUrl: assetUrl('/demo/loading-bay-raw.jpg'), flightId: 'demo-flight-4', flightName: 'Yard check — construction staging', timestamp: '23:02:44', droneName: 'M4TD-NightOps', dockName: 'Dock 3', siteId: 'demo-site-skybase-alpha', siteName: 'Skybase Alpha', hasDetection: true, detectionLabel: 'Construction equipment (authorized)', detectionConfidence: 98, filename: 'loading_bay_2302.jpg', gpsLat: '18.5640°N', gpsLng: '73.6972°E', altitudeM: 22, gimbalPitch: -40, resolution: '4000x3000', fileSizeMB: 0.3, pilotNote: 'Cement mixers and forklift — all matched to approved contractor list. No concerns.' },
  { id: 'demo-img-9', url: assetUrl('/demo/loading-bay-annotated.jpg'), thumbnailUrl: assetUrl('/demo/loading-bay-annotated.jpg'), flightId: 'demo-flight-4', flightName: 'Yard check — construction staging', timestamp: '23:02:44', droneName: 'M4TD-NightOps', dockName: 'Dock 3', siteId: 'demo-site-skybase-alpha', siteName: 'Skybase Alpha', hasDetection: true, detectionLabel: 'Vehicle inventory (3 units)', detectionConfidence: 98, filename: 'loading_bay_2302_annotated.jpg', gpsLat: '18.5640°N', gpsLng: '73.6972°E', altitudeM: 22, gimbalPitch: -40, resolution: '4000x3000', fileSizeMB: 0.3, pilotNote: '' },
  { id: 'demo-img-10', url: assetUrl('/demo/north-lighting.jpg'), thumbnailUrl: assetUrl('/demo/north-lighting.jpg'), flightId: 'demo-flight-5', flightName: 'Final sweep — Full perimeter', timestamp: '01:17:30', droneName: 'M4TD-NightOps', dockName: 'Dock 3', siteId: 'demo-site-skybase-alpha', siteName: 'Skybase Alpha', hasDetection: true, detectionLabel: 'Lighting failure (2 lamps)', detectionConfidence: 94, filename: 'north_lighting_0117.jpg', gpsLat: '18.5645°N', gpsLng: '73.6960°E', altitudeM: 25, gimbalPitch: -30, resolution: '4000x3000', fileSizeMB: 0.3, pilotNote: 'Two overhead lamps at north gate out. Creates a 40m shadow zone. Maintenance ticket needed.' },
  ...Array.from({ length: 14 }, (_, i) => ({
    id: `demo-img-${11 + i}`,
    url: assetUrl(`/demo/patrol-frame-${i + 11}.jpg`),
    thumbnailUrl: assetUrl(`/demo/patrol-frame-${i + 11}.jpg`),
    flightId: `demo-flight-${(i % 5) + 1}`,
    flightName: ['Night sweep — Full perimeter', 'South sector thermal sweep', 'West perimeter thermal', 'Yard check — construction staging', 'Final sweep — Full perimeter'][i % 5],
    timestamp: `${18 + Math.floor(i / 2)}:${String((i * 7) % 60).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}`,
    droneName: 'M4TD-NightOps',
    dockName: 'Dock 3',
    siteId: 'demo-site-skybase-alpha',
    siteName: 'Skybase Alpha',
    hasDetection: false,
    detectionLabel: null,
    detectionConfidence: null,
    filename: `patrol_frame_${11 + i}.jpg`,
    gpsLat: `18.56${20 + i}°N`,
    gpsLng: `73.69${55 + i}°E`,
    altitudeM: 20 + (i % 8),
    gimbalPitch: -30 - (i % 30),
    resolution: '4000x3000',
    fileSizeMB: 0.3,
    pilotNote: '',
  })),
];

// ─── DEMO OBSERVATIONS ───────────────────────────────────────────────

export const DEMO_OBSERVATIONS: Observation[] = [
  {
    id: 'demo-obs-1',
    number: 1,
    title: 'Unauthorized white pickup truck near east gate',
    severity: 'high',
    status: 'requires_action',
    confidence: 98,
    timestamp: '18:14',
    aiDescription: 'A white Ford F-150 was detected stationary approximately 12 metres from the eastern perimeter gate at 18:14:22. The vehicle\'s license plate is partially obscured by the capture angle, and cross-referencing against today\'s site access register returned no match. Per pilot context, this appears to be an unlogged visitor — possibly associated with the construction crew but without the required entry documentation. Given the east gate\'s history of two unauthorized access attempts in the past month, this observation is flagged for immediate verification.',
    pilotContext: 'White pickup not on today\'s access register. Possibly visitor for construction crew but no entry logged. Should be cross-checked against CCTV.',
    rawImageUrl: assetUrl('/demo/east-gate-raw.jpg'),
    annotatedImageUrl: assetUrl('/demo/east-gate-annotated.jpg'),
    images: [
      { id: 'demo-img-1', url: assetUrl('/demo/east-gate-raw.jpg'), label: 'Raw capture', timestamp: '18:14:22' },
      { id: 'demo-img-2', url: assetUrl('/demo/east-gate-annotated.jpg'), label: 'AI annotated', timestamp: '18:14:22', confidence: 98 },
    ],
    imageCaption: 'East gate approach — 18:14:22 · altitude 18m · M4TD-NightOps',
  },
  {
    id: 'demo-obs-2',
    number: 2,
    title: 'South perimeter fence — deterioration worsening',
    severity: 'high',
    status: 'requires_action',
    confidence: 92,
    timestamp: '19:47',
    aiDescription: 'Chain-link deformation along the southern boundary has progressed significantly since the March 2026 baseline. The estimated ground-level gap now measures approximately 0.6 metres, up from 0.4 metres recorded two weeks ago — a 50% increase. The deformation pattern remains consistent with progressive mechanical stress rather than forced entry, but the gap is now large enough for unauthorized passage.',
    pilotContext: 'Gap has widened since last patrol. Estimated 0.6m now vs 0.4m two weeks ago. Needs urgent ground inspection.',
    rawImageUrl: assetUrl('/demo/south-fence-raw.jpg'),
    annotatedImageUrl: assetUrl('/demo/south-fence-annotated.jpg'),
    images: [
      { id: 'demo-img-3', url: assetUrl('/demo/south-fence-raw.jpg'), label: 'Raw capture', timestamp: '19:47:03' },
      { id: 'demo-img-4', url: assetUrl('/demo/south-fence-annotated.jpg'), label: 'AI annotated', timestamp: '19:47:03', confidence: 92 },
    ],
    imageCaption: 'South boundary fence — 19:47:03 · altitude 12m · M4TD-NightOps',
  },
  {
    id: 'demo-obs-3',
    number: 3,
    title: 'Unidentified thermal signature — west perimeter dark zone',
    severity: 'critical',
    status: 'requires_action',
    confidence: 91,
    timestamp: '21:33',
    aiDescription: 'A concentrated thermal signature was detected approximately 15 metres inside the western perimeter, between waypoints 8 and 12. The thermal profile is consistent with a single human-sized heat source in a stationary position, persisting across 4 consecutive capture frames. This area has documented lighting coverage gaps and no scheduled activity after 20:00. Ground team dispatched for physical verification.',
    pilotContext: 'Stationary thermal hit in the dark zone between WP8 and WP12. Too large for wildlife, too still for movement. Sending ground team.',
    rawImageUrl: assetUrl('/demo/west-thermal.jpg'),
    annotatedImageUrl: assetUrl('/demo/west-visual.jpg'),
    images: [
      { id: 'demo-img-5', url: assetUrl('/demo/west-thermal.jpg'), label: 'Thermal capture', timestamp: '21:33:18', confidence: 91 },
      { id: 'demo-img-6', url: assetUrl('/demo/west-visual.jpg'), label: 'Visual capture', timestamp: '21:33:19' },
    ],
    imageCaption: 'West perimeter WP10 — 21:33:18 · altitude 30m · M4TD-NightOps · thermal+visual',
  },
  {
    id: 'demo-obs-4',
    number: 4,
    title: 'Wildlife activity — south tree line (routine)',
    severity: 'low',
    status: 'acknowledged',
    confidence: 85,
    timestamp: '21:41',
    aiDescription: 'Multiple small thermal signatures detected moving along the southern tree line in a dispersed pattern consistent with deer activity. Signatures maintain natural movement vectors parallel to the fence line with no approach toward perimeter infrastructure. Matches the previous 12 night-shift patrols and is logged as routine wildlife presence. No action required.',
    pilotContext: 'Same deer as usual. They never approach the fence. Routine.',
    rawImageUrl: assetUrl('/demo/wildlife-thermal.jpg'),
    annotatedImageUrl: null,
    images: [
      { id: 'demo-img-7', url: assetUrl('/demo/wildlife-thermal.jpg'), label: 'Thermal capture', timestamp: '21:41:55', confidence: 85 },
    ],
    imageCaption: 'South tree line — 21:41:55 · altitude 30m · M4TD-NightOps · thermal',
  },
  {
    id: 'demo-obs-5',
    number: 5,
    title: 'Construction equipment — staging verified',
    severity: 'low',
    status: 'resolved',
    confidence: 98,
    timestamp: '23:02',
    aiDescription: 'Two cement mixer trucks and one forklift identified in the northern loading bay at 23:02:44. All vehicles are stationary and match the registered equipment of the approved construction contractor staging on site for the past 3 weeks. Configuration matches the baseline pattern observed across the previous 15 patrol cycles. No action required.',
    pilotContext: 'Cement mixers and forklift — all matched to approved contractor list. No concerns.',
    rawImageUrl: assetUrl('/demo/loading-bay-raw.jpg'),
    annotatedImageUrl: assetUrl('/demo/loading-bay-annotated.jpg'),
    images: [
      { id: 'demo-img-8', url: assetUrl('/demo/loading-bay-raw.jpg'), label: 'Raw capture', timestamp: '23:02:44' },
      { id: 'demo-img-9', url: assetUrl('/demo/loading-bay-annotated.jpg'), label: 'AI annotated', timestamp: '23:02:44', confidence: 98 },
    ],
    imageCaption: 'Northern loading bay — 23:02:44 · altitude 22m · M4TD-NightOps',
  },
  {
    id: 'demo-obs-6',
    number: 6,
    title: 'Lighting failure — north gate sector',
    severity: 'moderate',
    status: 'requires_action',
    confidence: 94,
    timestamp: '01:17',
    aiDescription: 'Two overhead perimeter lamps at the north gate are non-operational, creating an approximately 40-metre shadow zone along the access corridor. Failure appears recent as prior patrol (6 hours earlier) showed both lamps functional. The shadow zone overlaps with a primary pedestrian access path and degrades thermal detection accuracy in that sector. Recommend maintenance ticket within 24 hours.',
    pilotContext: 'Two overhead lamps at north gate out. Creates a 40m shadow zone. Maintenance ticket needed.',
    rawImageUrl: assetUrl('/demo/north-lighting.jpg'),
    annotatedImageUrl: null,
    images: [
      { id: 'demo-img-10', url: assetUrl('/demo/north-lighting.jpg'), label: 'Visual capture', timestamp: '01:17:30', confidence: 94 },
    ],
    imageCaption: 'North gate approach — 01:17:30 · altitude 25m · M4TD-NightOps',
  },
];

// ─── DEMO REPORT BUILDER ─────────────────────────────────────────────

export function buildDemoReport(template: ReportTemplate, flightContexts?: FlightContext[]): Report {
  const reportId = `demo-report-${Date.now()}`;

  const contexts = flightContexts ?? [];
  const combinedContext = buildCombinedContext(contexts);
  const observations = applyContextToObservations(DEMO_OBSERVATIONS, combinedContext);

  const baseExecutiveSummary = 'Night shift patrol covering Skybase Alpha on April 14-15, 2026 completed all 5 scheduled flights across the 12-hour window. AI analysis identified 25 detections across 663 captured frames; 4 findings require immediate follow-up. A critical thermal anomaly in the western perimeter dark zone is under active ground investigation. Confirmed progression of south fence deterioration now exceeds intervention threshold. One unauthorized vehicle flagged at east gate for verification. Night operations status: active investigation, elevated risk posture until west perimeter thermal signature is resolved.';
  const executiveSummary = combinedContext
    ? `**Pilot pre-flight notes:**\n> ${combinedContext.split('\n').join('\n> ')}\n\n${baseExecutiveSummary}`
    : baseExecutiveSummary;

  const sections: ReportSection[] = template.sections
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order)
    .map((tplSec, idx) => {
      const kind = templateSectionToKind(tplSec.name);
      let content = '';
      if (kind === 'executive_summary') content = executiveSummary;
      else if (kind === 'perimeter_status') content = 'Overall perimeter integrity is compromised on two fronts and requires active response. The south boundary fence deformation has progressed to a 0.6m ground gap that exceeds the 0.5m intervention threshold. The west perimeter dark zone (WP8-WP12) is under active investigation following a persistent thermal signature. East gate unauthorized vehicle is flagged for verification but does not constitute a confirmed breach. Northern loading bay is operating within expected authorized parameters.';
      else if (kind === 'compliance') content = 'Patrol conducted in accordance with Skybase Alpha night shift operating procedures. All five scheduled flights completed. AI detection pipeline operated nominally with 98.2% uptime. Human review applied to all high-severity findings prior to this report. Report ready for distribution.';
      else if (kind === 'custom') content = `Content for ${tplSec.name} section.`;
      return {
        id: `demo-rs-${idx}`,
        templateSectionId: tplSec.id,
        kind,
        name: tplSec.name,
        content,
        order: tplSec.order,
        enabled: true,
      };
    });

  return {
    id: reportId,
    title: 'Night Shift Summary — Skybase Alpha — Apr 14',
    profile: 'shift_summary',
    status: 'draft_ready',
    siteName: 'Skybase Alpha',
    date: '2026-04-14',
    author: 'K. Nair',
    missionCount: 5,
    executiveSummary,
    observations,
    shortTermRecommendations: [
      'Dispatch ground security to west perimeter WP8-WP12 for physical verification of thermal signature — TOP PRIORITY',
      'Cross-reference white pickup truck (east gate, 18:14) against today\'s CCTV and site access register',
      'Submit maintenance ticket for north gate lighting failure — two lamps require replacement',
      'Schedule ground inspection of south boundary fence within 12 hours; gap now exceeds intervention threshold',
      'Increase patrol frequency for north gate sector until lighting is restored',
    ],
    longTermRecommendations: [
      'Install permanent thermal sensors in west perimeter dark zone (WP8-WP12) to eliminate lighting-dependent coverage',
      'Establish automated monthly fence integrity scoring using baseline AI comparison for all perimeter sections',
      'Evaluate supplementary lighting upgrade for north gate access corridor',
      'Update wildlife baseline signature library to further reduce false-positive thermal alerts on south tree line',
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    agentId: 'demo-agent-night-watch',
    agentName: 'Night surveillance agent',
    templateId: template.id,
    flightIds: ['demo-flight-1', 'demo-flight-2', 'demo-flight-3', 'demo-flight-4', 'demo-flight-5'],
    droneName: 'M4TD-NightOps',
    missionName: null,
    sections,
    isDemo: true,
    flightContextSnapshot: contexts.length ? contexts : undefined,
  } as Report;
}

// ─── DEMO POLISHED AI RESPONSES ──────────────────────────────────────

export const DEMO_POLISHED_RESPONSES = {
  executive_summary: 'Night shift patrol at Skybase Alpha on April 14-15, 2026 completed all five scheduled flights across the 12-hour operating window. AI analysis of 663 captured frames identified 25 detection events, of which 4 require immediate operational response. The shift is currently in an elevated risk posture pending ground verification of a critical thermal signature detected in the western perimeter dark zone. Additionally, progression of south fence deterioration has exceeded the established intervention threshold, requiring ground repair. A single unauthorized vehicle observation at the east gate is flagged for CCTV cross-reference. All routine patrol objectives — construction yard verification, wildlife classification, lighting inspection — completed with no anomalies beyond a maintenance-scale lighting failure at the north gate. Full findings and recommended actions follow.',
  perimeter_status: 'Perimeter integrity is actively compromised on two fronts and requires immediate operational response. The south boundary chain-link fence has deteriorated to a 0.6-metre ground-level gap, exceeding the 0.5-metre intervention threshold established in the March 2026 baseline — this sector can no longer be classified as secure until ground repair is complete and re-inspected. The western perimeter dark zone between waypoints 8 and 12 is under active investigation following a persistent thermal signature consistent with a stationary human-sized heat source; ground team verification is pending and fixed camera coverage should be enabled for this sector until resolution. The east gate observation of an unregistered vehicle is flagged for verification but does not currently constitute a confirmed breach. The northern loading bay continues operating within expected authorized parameters.',
  compliance: 'This patrol was conducted in accordance with Skybase Alpha night shift operating procedures as defined in the facility security operations manual. All five scheduled flights were completed within the 12-hour operating window without deviation. The Verkos DAA detection pipeline operated nominally with 98.2% uptime across the shift. Human review was applied to all high-severity findings prior to report finalization; pilot authorization has been verified and logged. Report content meets the requirements for distribution to the site security operations lead, the site manager, and the enterprise compliance officer.',
  recommendations_immediate: [
    'PRIORITY 1: Dispatch ground security team to west perimeter WP8-WP12 for physical verification of thermal signature. Enable continuous monitoring on fixed cameras covering this sector.',
    'Cross-reference white pickup truck (east gate, 18:14:22) against CCTV feeds and site access register for the 17:00-19:00 window.',
    'Submit maintenance work order for north gate lighting — two overhead lamps require replacement before the next night shift begins.',
    'Schedule ground inspection of south boundary fence within the next 12 hours; the 0.6m gap now exceeds intervention threshold.',
    'Temporarily increase patrol frequency at the north gate sector until lighting is fully restored.',
  ],
  recommendations_long: [
    'Install permanent thermal sensors in west perimeter dark zone (WP8-WP12) to eliminate coverage dependency on ambient lighting conditions.',
    'Establish automated monthly fence integrity scoring using baseline AI comparison for all perimeter sections; flag any progression above 10% for priority review.',
    'Evaluate a supplementary lighting upgrade for the north gate access corridor, including redundant lamp configurations.',
    'Update the wildlife baseline signature library to further reduce false-positive thermal alerts on the south tree line.',
    'Consider expanding night shift patrol frequency from 5 flights to 6 flights to reduce gap between end-of-shift sweeps.',
  ],
  observations: {
    1: 'A white Ford F-150 pickup truck was detected in a stationary position approximately 12 metres from the eastern perimeter gate at 18:14:22. The vehicle\'s license plate is partially obscured by the capture angle; cross-referencing against today\'s site access register returned no match. Per the pilot\'s first-hand assessment, this appears to be an unlogged visitor — possibly associated with the construction contractor but without required entry documentation. Given the east gate\'s documented history of two unauthorized access attempts in the past month, this observation is elevated to high-severity and flagged for immediate CCTV cross-reference.',
    2: 'Progressive chain-link deformation along the southern boundary perimeter has reached a critical intervention point. Comparison against the March 2026 AI baseline shows the ground-level gap has increased from 0.4 metres to approximately 0.6 metres over a two-week interval — a 50% progression that exceeds the established 0.5-metre intervention threshold. The deformation pattern remains consistent with progressive mechanical stress rather than forced entry, but the gap is now sufficient for unauthorized pedestrian passage. Repair scheduling within 12 hours is recommended.',
    3: 'A concentrated thermal signature was detected approximately 15 metres inside the western perimeter, between waypoints 8 and 12, at 21:33:18. The thermal profile is consistent with a single human-sized heat source in a stationary position, persisting across 4 consecutive capture frames spanning roughly 60 seconds. This area has documented lighting coverage gaps and no scheduled authorized activity after 20:00. The signature size and persistence rule out typical wildlife movement patterns. Ground team has been dispatched for physical verification per pilot direction.',
    4: 'Multiple small thermal signatures were detected moving along the southern tree line in a dispersed pattern consistent with deer activity. Signature intensity, movement vector, and spacing all match the wildlife baseline established across the previous 12 night-shift patrols at this location. No approach toward perimeter infrastructure was detected, and per pilot observation this is routine seasonal wildlife presence with no operational impact.',
    5: 'Two cement mixer trucks and one forklift were identified stationary in the northern loading bay at 23:02:44. All three vehicles match the registered equipment of the approved construction contractor currently staging on site for the past 3 weeks. The equipment configuration is consistent with the baseline pattern observed across the previous 15 patrol cycles. Per pilot verification, all vehicles were confirmed against the approved contractor access register with no discrepancies.',
    6: 'Two overhead perimeter lamps at the north gate sector are non-operational, creating an approximately 40-metre shadow zone along the primary pedestrian access corridor. Comparison against the previous patrol cycle (6 hours prior) confirms the failure is recent. The shadow zone overlaps a controlled access path and measurably degrades thermal detection accuracy in this sector until lighting is restored. A maintenance work order for lamp replacement is recommended within 24 hours.',
  } as Record<number, string>,
};

// ─── DEMO FLIGHTS (for the wizard) ───────────────────────────────────

export interface DemoFlightRow {
  id: string;
  date: string;
  time: string;
  drone: string;
  dock: string;
  durationSec: number;
  imageCount: number;
  detectionCount: number;
  aiDetections: number;
  pilotNotes: number;
  highestSeverity: 'critical' | 'high' | 'moderate' | 'low';
  missionName: string;
  siteId: string;
}

export const DEMO_WIZARD_FLIGHTS: DemoFlightRow[] = [
  { id: 'demo-flight-1', date: 'Today', time: '18:00', drone: 'M4TD-NightOps', dock: 'Dock 3', durationSec: 780, imageCount: 164, detectionCount: 7, aiDetections: 2, pilotNotes: 1, highestSeverity: 'high', missionName: 'Night sweep — Full perimeter', siteId: 'demo-site-skybase-alpha' },
  { id: 'demo-flight-2', date: 'Today', time: '19:45', drone: 'M4TD-NightOps', dock: 'Dock 3', durationSec: 540, imageCount: 98, detectionCount: 3, aiDetections: 1, pilotNotes: 1, highestSeverity: 'high', missionName: 'South sector thermal sweep', siteId: 'demo-site-skybase-alpha' },
  { id: 'demo-flight-3', date: 'Today', time: '21:30', drone: 'M4TD-NightOps', dock: 'Dock 3', durationSec: 720, imageCount: 142, detectionCount: 6, aiDetections: 2, pilotNotes: 2, highestSeverity: 'critical', missionName: 'West perimeter thermal', siteId: 'demo-site-skybase-alpha' },
  { id: 'demo-flight-4', date: 'Today', time: '23:00', drone: 'M4TD-NightOps', dock: 'Dock 3', durationSec: 420, imageCount: 88, detectionCount: 4, aiDetections: 1, pilotNotes: 1, highestSeverity: 'low', missionName: 'Yard check — construction staging', siteId: 'demo-site-skybase-alpha' },
  { id: 'demo-flight-5', date: 'Today', time: '01:15', drone: 'M4TD-NightOps', dock: 'Dock 3', durationSec: 810, imageCount: 171, detectionCount: 5, aiDetections: 1, pilotNotes: 1, highestSeverity: 'moderate', missionName: 'Final sweep — Full perimeter', siteId: 'demo-site-skybase-alpha' },
  { id: 'demo-flight-6', date: 'Yesterday', time: '06:15', drone: 'M4TD', dock: 'Dock 1', durationSec: 765, imageCount: 187, detectionCount: 14, aiDetections: 3, pilotNotes: 2, highestSeverity: 'high', missionName: 'Morning patrol — East perimeter', siteId: 'demo-site-skybase-alpha' },
  { id: 'demo-flight-7', date: 'Yesterday', time: '10:30', drone: 'M4TD', dock: 'Dock 1', durationSec: 892, imageCount: 203, detectionCount: 9, aiDetections: 2, pilotNotes: 1, highestSeverity: 'moderate', missionName: 'Mid-morning — South sector', siteId: 'demo-site-skybase-alpha' },
  { id: 'demo-flight-8', date: 'Yesterday', time: '14:00', drone: 'M4TD', dock: 'Dock 1', durationSec: 1140, imageCount: 243, detectionCount: 11, aiDetections: 2, pilotNotes: 0, highestSeverity: 'moderate', missionName: 'Midday patrol — Full perimeter', siteId: 'demo-site-skybase-alpha' },
  { id: 'demo-flight-9', date: '3 days ago', time: '22:00', drone: 'M4TD-NightOps', dock: 'Dock 3', durationSec: 848, imageCount: 156, detectionCount: 6, aiDetections: 1, pilotNotes: 1, highestSeverity: 'high', missionName: 'Night patrol — Full perimeter', siteId: 'demo-site-skybase-alpha' },
  { id: 'demo-flight-10', date: '3 days ago', time: '11:42', drone: 'HETTY M3DT', dock: 'Dock 2', durationSec: 312, imageCount: 48, detectionCount: 5, aiDetections: 2, pilotNotes: 3, highestSeverity: 'critical', missionName: 'Emergency response — North gate', siteId: 'demo-site-skybase-alpha' },
  { id: 'demo-flight-11', date: '5 days ago', time: '07:00', drone: 'M4TD', dock: 'Dock 1', durationSec: 690, imageCount: 142, detectionCount: 4, aiDetections: 1, pilotNotes: 0, highestSeverity: 'low', missionName: 'Morning patrol — West perimeter', siteId: 'demo-site-skybase-alpha' },
  { id: 'demo-flight-12', date: '5 days ago', time: '15:30', drone: 'M4TD', dock: 'Dock 1', durationSec: 725, imageCount: 167, detectionCount: 7, aiDetections: 1, pilotNotes: 1, highestSeverity: 'moderate', missionName: 'Afternoon inspection — Tank farm', siteId: 'demo-site-skybase-alpha' },
];

// ─── SCOPED OBSERVATIONS BY FLIGHT ───────────────────────────────────

export function observationsForFlights(flightIds: string[]): typeof DEMO_OBSERVATIONS {
  const FLIGHT_TO_OBSERVATIONS: Record<string, number[]> = {
    'demo-flight-1': [1],
    'demo-flight-2': [2],
    'demo-flight-3': [3, 4],
    'demo-flight-4': [5],
    'demo-flight-5': [6],
    'demo-flight-6': [1],
    'demo-flight-7': [2],
    'demo-flight-8': [5],
    'demo-flight-9': [3],
    'demo-flight-10': [1, 3],
    'demo-flight-11': [],
    'demo-flight-12': [2, 6],
  };

  const collectedNumbers = new Set<number>();
  flightIds.forEach(fid => {
    (FLIGHT_TO_OBSERVATIONS[fid] || []).forEach(n => collectedNumbers.add(n));
  });

  return DEMO_OBSERVATIONS.filter(o => collectedNumbers.has(o.number));
}
