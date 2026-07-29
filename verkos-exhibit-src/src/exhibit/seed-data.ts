/**
 * EXHIBIT SEED DATA — fills the gaps the app's own demo mode leaves empty.
 *
 * `enterDemoMode()` seeds one site, one agent, a gallery and a single report.
 * But the store's base mocks are empty arrays:
 *     mockSites = []   mockReports = []   mockDrafts = []
 * and `flightContexts` starts `{}`, so `enterDemoMode` looks up
 * demo-flight-1..5 contexts and finds none.
 *
 * Result without this file: Sites shows one entry, Reports one, Drafts is
 * blank, and flight detail pages have no pilot context. This authors the
 * missing records so every route a visitor opens is populated.
 */

import type {
  Site,
  Report,
  DraftReport,
  FlightContext,
  ReportTemplate,
  Observation,
} from '@/types/report.types';
import type { GalleryImage } from '@/components/reports/MediaGallery';
import {
  DEMO_SITE,
  DEMO_OBSERVATIONS,
  DEMO_WIZARD_FLIGHTS,
  buildDemoReport,
} from '@/data/demo-scenario';
import { assetUrl } from './asset-url';

// ─── Extra sites ─────────────────────────────────────────────────────

export const EXTRA_SITES: Site[] = [
  {
    id: 'site-fb-northgate-solar',
    name: 'Northgate Solar Array',
    description:
      'A 240-acre photovoltaic farm inspected twice weekly for panel damage, vegetation encroachment and inverter faults.',
    location: '17.9784°N, 73.8412°E · Satara, Maharashtra',
    timezone: 'Asia/Kolkata (IST)',
    operatingHours: 'Daylight inspection only — 07:00-17:30',
    siteType: 'Renewable energy',
    assets: [
      { id: 'asset-ns-1', name: 'Array block A', type: 'Panel block', description: '18 rows. Two panels flagged for microfracture in the last cycle.' },
      { id: 'asset-ns-2', name: 'Array block B', type: 'Panel block', description: 'Newest block, commissioned Feb 2026. No findings to date.' },
      { id: 'asset-ns-3', name: 'Inverter station 2', type: 'Equipment', description: 'Thermal hotspot recorded twice this quarter.' },
      { id: 'asset-ns-4', name: 'Access road perimeter', type: 'Barrier', description: 'Livestock intrusion through the western boundary is recurrent.' },
    ],
    context:
      'Northgate is a generation asset, so findings are graded on output impact rather than security risk. Vegetation growth along the southern rows is seasonal and expected between June and September. Inverter station 2 has a recurring thermal hotspot that maintenance has deferred twice — flag any recurrence as high severity.',
    imageUrl: null,
    createdAt: '2026-02-02T00:00:00Z',
    updatedAt: '2026-04-11T00:00:00Z',
  },
  {
    id: 'site-fb-harbour-terminal',
    name: 'Harbour Terminal 4',
    description:
      'Container terminal with round-the-clock cargo movement. Patrols cover the quay, stacking yard and gate complex.',
    location: '18.9402°N, 72.8347°E · Mumbai, Maharashtra',
    timezone: 'Asia/Kolkata (IST)',
    operatingHours: '24/7 — three shifts',
    siteType: 'Port / logistics',
    assets: [
      { id: 'asset-ht-1', name: 'Quay crane row', type: 'Equipment', description: 'Four gantry cranes. Collision-avoidance sensors under evaluation.' },
      { id: 'asset-ht-2', name: 'Stacking yard C', type: 'Operations area', description: 'High-value container block. Restricted after 22:00.' },
      { id: 'asset-ht-3', name: 'Gate complex', type: 'Access point', description: 'Primary truck ingress. Queue overflow onto the access road is common.' },
      { id: 'asset-ht-4', name: 'Bunker fuel store', type: 'Building', description: 'Hazardous storage — any thermal anomaly is critical severity.' },
    ],
    context:
      'Terminal 4 runs continuous cargo operations, so movement alone is not an anomaly — classification depends on zone and time. Stacking yard C is restricted after 22:00 and any presence there overnight is high severity. The bunker fuel store is a hazardous area where thermal anomalies are always critical. Truck queueing at the gate complex is routine and should not be flagged.',
    imageUrl: null,
    createdAt: '2026-01-28T00:00:00Z',
    updatedAt: '2026-04-13T00:00:00Z',
  },
  {
    id: 'site-fb-meridian-dc',
    name: 'Meridian Data Centre Campus',
    description:
      'Three-building colocation campus. Drone patrols cover roof plant, generator yard and the outer fence line.',
    location: '12.9698°N, 77.7500°E · Bengaluru, Karnataka',
    timezone: 'Asia/Kolkata (IST)',
    operatingHours: '24/7 — patrol every 4 hours',
    siteType: 'Data centre',
    assets: [
      { id: 'asset-md-1', name: 'Building A roof plant', type: 'Equipment', description: 'Chiller array. Thermal baseline established March 2026.' },
      { id: 'asset-md-2', name: 'Generator yard', type: 'Operations area', description: 'Six standby generators. Monthly load test every first Tuesday.' },
      { id: 'asset-md-3', name: 'Outer fence line', type: 'Barrier', description: 'Double fence with a 6m sterile corridor between layers.' },
      { id: 'asset-md-4', name: 'Loading dock', type: 'Access point', description: 'Deliveries by appointment only; no unscheduled access.' },
    ],
    context:
      'Meridian is a high-availability facility where thermal accuracy matters more than intrusion detection. The chiller array on Building A roof has an established thermal baseline — deviations above 8°C should be flagged. The sterile corridor between fence layers must be empty at all times; any object or signature inside it is critical. Generator load tests run the first Tuesday monthly and produce expected thermal and acoustic signatures.',
    imageUrl: null,
    createdAt: '2026-03-05T00:00:00Z',
    updatedAt: '2026-04-14T00:00:00Z',
  },
];

// ─── Flight contexts (pilot notes) for the demo night shift ──────────

function ctx(
  flightId: string,
  text: string,
  imageNotes: Record<string, string> = {},
  markedComplete = true,
): FlightContext {
  const words =
    text.trim().split(/\s+/).filter(Boolean).length +
    Object.values(imageNotes).reduce((a, n) => a + n.trim().split(/\s+/).filter(Boolean).length, 0);
  return {
    flightId,
    siteId: DEMO_SITE.id,
    text,
    imageNotes,
    wordCount: words,
    startedAt: new Date(Date.now() - 6 * 3600_000).toISOString(),
    lastEditedAt: new Date(Date.now() - 5 * 3600_000).toISOString(),
    markedComplete,
    source: 'typed',
    captureMode: 'retrospective',
  };
}

export const SEED_FLIGHT_CONTEXTS: FlightContext[] = [
  ctx(
    'demo-flight-1',
    'Standard opening sweep. Light was still going at launch so the first three waypoints are visual rather than thermal. Noticed a white pickup parked close to the east gate that I could not match to today\'s access register — worth cross-checking against the gate camera before this goes out.',
    { 'demo-img-1': 'White pickup, no plate visible from this angle. Not on the register.' },
  ),
  ctx(
    'demo-flight-2',
    'Flew the south sector lower than usual (12m) specifically to get a clean look at the fence run near waypoint 15. The gap is visibly wider than my last pass two weeks ago. I would call this urgent now rather than monitor-only.',
    { 'demo-img-3': 'Gap measured roughly 0.6m, was about 0.4m two weeks back.' },
  ),
  ctx(
    'demo-flight-3',
    'West perimeter is the dark stretch between waypoints 8 and 12 — lighting has been out there for a while. Picked up a stationary thermal signature about 15m inside the fence. Too big for the deer we normally get and it did not move across four frames. I called the ground team from the dock.',
    {
      'demo-img-5': 'Held position across four frames. Not wildlife behaviour.',
      'demo-img-7': 'The usual deer on the treeline. They never come near the fence.',
    },
  ),
  ctx(
    'demo-flight-4',
    'Yard check over the construction staging area. Two mixers and a forklift, all matching the contractor list that has been in place about three weeks. Nothing out of place — logging it so the pattern stays in the record.',
    { 'demo-img-8': 'All three vehicles matched to the approved contractor list.' },
  ),
  ctx(
    'demo-flight-5',
    'Closing sweep. Two overhead lamps at the north gate are out, which leaves roughly a 40m shadow across the pedestrian path. Needs a maintenance ticket before the next night shift.',
    { 'demo-img-10': 'Two lamps out, shadow zone across the access corridor.' },
  ),
];

// ─── Gallery media for the older flights ─────────────────────────────

/**
 * `DEMO_GALLERY_IMAGES` only covers demo-flight-1..5 (the headline night
 * shift). The seeded reports below reference flights 6-12, so without this
 * their media rail reads "0 files from 0 flights" and the image picker is
 * empty. This gives every remaining flight a plausible frame set drawn from
 * the same local patrol imagery.
 */
const DETECTIONS: Array<[string, number]> = [
  ['Vehicle (unregistered)', 96],
  ['Perimeter integrity', 91],
  ['Thermal anomaly', 88],
  ['Construction equipment (authorized)', 97],
  ['Lighting failure', 93],
  ['Wildlife', 84],
];

export function buildSeedGallery(): GalleryImage[] {
  const out: GalleryImage[] = [];
  const older = DEMO_WIZARD_FLIGHTS.slice(5); // demo-flight-6 .. -12

  older.forEach((f, fi) => {
    const perFlight = 6;
    for (let i = 0; i < perFlight; i++) {
      const frame = 11 + ((fi * perFlight + i) % 14);
      const detected = i < 2; // first two frames of each flight carry a hit
      const [label, conf] = DETECTIONS[(fi + i) % DETECTIONS.length];
      const [hh, mm] = f.time.split(':').map(Number);

      out.push({
        id: `seed-img-${f.id}-${i + 1}`,
        url: assetUrl(`/demo/patrol-frame-${frame}.jpg`),
        thumbnailUrl: assetUrl(`/demo/patrol-frame-${frame}.jpg`),
        flightId: f.id,
        flightName: f.missionName,
        timestamp: `${String(hh).padStart(2, '0')}:${String((mm + i * 7) % 60).padStart(2, '0')}:${String((i * 19) % 60).padStart(2, '0')}`,
        droneName: f.drone,
        dockName: f.dock,
        siteId: DEMO_SITE.id,
        siteName: DEMO_SITE.name,
        hasDetection: detected,
        detectionLabel: detected ? label : null,
        detectionConfidence: detected ? conf : null,
        filename: `${f.id.replace(/-/g, '_')}_frame_${i + 1}.jpg`,
        gpsLat: `18.56${20 + ((fi + i) % 40)}°N`,
        gpsLng: `73.69${50 + ((fi + i) % 40)}°E`,
        altitudeM: 18 + ((fi + i) % 12),
        gimbalPitch: -30 - ((fi + i) % 25),
        resolution: '4000x3000',
        fileSizeMB: 0.3,
        pilotNote: detected && i === 0 ? 'Flagged during the pass — worth a second look on review.' : '',
      } as GalleryImage);
    }
  });

  return out;
}

// ─── Extra reports ───────────────────────────────────────────────────

/**
 * Build a report from a template, then override for variety. Going through
 * `buildDemoReport` keeps the `sections` array valid against whatever the
 * template defines.
 */
function derivedReport(
  template: ReportTemplate,
  over: Partial<Report> & { id: string; title: string },
  observations: Observation[],
): Report {
  const base = buildDemoReport(template);
  return {
    ...base,
    ...over,
    observations,
    isDemo: true,
    flightContextSnapshot: undefined,
  };
}

export function buildExtraReports(template: ReportTemplate): Report[] {
  const d = (daysAgo: number) => {
    const x = new Date();
    x.setDate(x.getDate() - daysAgo);
    return x;
  };
  const iso = (daysAgo: number) => d(daysAgo).toISOString();
  const ymd = (daysAgo: number) => d(daysAgo).toISOString().slice(0, 10);

  return [
    derivedReport(
      template,
      {
        id: 'seed-report-day-shift',
        title: 'Day Shift Summary — Skybase Alpha — Apr 13',
        profile: 'shift_summary',
        status: 'finalized',
        siteName: 'Skybase Alpha',
        date: ymd(1),
        author: 'R. Iyer',
        missionCount: 3,
        createdAt: iso(1),
        updatedAt: iso(1),
        agentId: 'agent-security-patrol',
        agentName: 'Security patrol agent',
        flightIds: ['demo-flight-6', 'demo-flight-7', 'demo-flight-8'],
        droneName: 'M4TD',
        executiveSummary:
          'Day shift patrol at Skybase Alpha completed all three scheduled flights across the 12-hour window. AI analysis of 633 frames returned 34 detections, of which 2 required follow-up. Construction staging in the northern loading bay continues within authorised parameters. No perimeter breaches were identified during daylight operations. The south boundary fence deformation remains under monitoring and is unchanged since the previous inspection.',
      },
      DEMO_OBSERVATIONS.slice(4, 6),
    ),
    derivedReport(
      template,
      {
        id: 'seed-report-incident-northgate',
        title: 'Incident Report — North Gate Response — Apr 12',
        profile: 'incident',
        status: 'finalized',
        siteName: 'Skybase Alpha',
        date: ymd(3),
        author: 'K. Nair',
        missionCount: 1,
        createdAt: iso(3),
        updatedAt: iso(3),
        agentId: 'demo-agent-night-watch',
        agentName: 'Night surveillance agent',
        flightIds: ['demo-flight-10'],
        droneName: 'HETTY M3DT',
        missionName: 'Emergency response — North gate',
        executiveSummary:
          'An emergency response flight was launched at 11:42 following a gate sensor alarm at the north access point. The drone was on station within 90 seconds. Imagery confirmed the alarm was triggered by a delivery vehicle reversing into the barrier arm, causing minor mechanical damage but no breach of the perimeter. The vehicle operator remained on site and the incident was closed with the site manager at 12:20.',
        shortTermRecommendations: [
          'Repair the north gate barrier arm — mechanical damage confirmed to the actuator housing',
          'Review delivery vehicle approach guidance at the north gate; the turning circle is tight for long-wheelbase vehicles',
        ],
        longTermRecommendations: [
          'Install approach guidance markings and a physical kerb guard at the north gate barrier',
          'Evaluate a lower-sensitivity threshold for the gate sensor to reduce contact-triggered alarms',
        ],
      },
      DEMO_OBSERVATIONS.slice(0, 1),
    ),
    derivedReport(
      template,
      {
        id: 'seed-report-solar-weekly',
        title: 'Weekly Inspection — Northgate Solar Array',
        profile: 'full_operational',
        status: 'in_review',
        siteName: 'Northgate Solar Array',
        date: ymd(2),
        author: 'A. Bhat',
        missionCount: 2,
        createdAt: iso(2),
        updatedAt: iso(2),
        agentId: 'agent-asset-inspection',
        agentName: 'Asset inspection agent',
        flightIds: ['demo-flight-11', 'demo-flight-12'],
        droneName: 'M4TD',
        executiveSummary:
          'Weekly photovoltaic inspection covered array blocks A and B plus both inverter stations. Thermal imaging identified a recurring hotspot at inverter station 2, now recorded on three consecutive cycles without maintenance action. Two panels in block A row 11 show microfracture patterns consistent with hail damage from the storm on April 2. Vegetation along the southern rows has reached the lower panel edge and is now shading approximately 40 modules during morning hours.',
        shortTermRecommendations: [
          'Escalate inverter station 2 thermal hotspot — third consecutive cycle without action',
          'Schedule vegetation cut along the southern rows; shading is now affecting morning output',
          'Replace the two microfractured panels in block A row 11',
        ],
        longTermRecommendations: [
          'Establish an automated thermal baseline comparison for both inverter stations',
          'Move southern-row vegetation management to a four-week cycle through the growing season',
        ],
      },
      DEMO_OBSERVATIONS.slice(5, 6),
    ),
    derivedReport(
      template,
      {
        id: 'seed-report-terminal-compliance',
        title: 'Monthly Compliance — Harbour Terminal 4',
        profile: 'compliance',
        status: 'finalized',
        siteName: 'Harbour Terminal 4',
        date: ymd(6),
        author: 'S. Menon',
        missionCount: 8,
        createdAt: iso(6),
        updatedAt: iso(6),
        agentId: 'agent-security-patrol',
        agentName: 'Security patrol agent',
        flightIds: ['demo-flight-6', 'demo-flight-9'],
        droneName: 'M4TD',
        executiveSummary:
          'Monthly compliance patrol across Terminal 4 completed eight scheduled flights covering the quay, stacking yard and gate complex. All restricted-zone checks passed. Stacking yard C recorded no unauthorised presence during restricted hours across the full period. The bunker fuel store returned no thermal anomalies. Two gate-queue overflow events onto the access road were logged as operational observations rather than findings.',
      },
      DEMO_OBSERVATIONS.slice(3, 5),
    ),
    derivedReport(
      template,
      {
        id: 'seed-report-meridian-exec',
        title: 'Executive Brief — Meridian Campus — Q2 week 2',
        profile: 'executive_summary',
        status: 'draft_ready',
        siteName: 'Meridian Data Centre Campus',
        date: ymd(4),
        author: 'K. Nair',
        missionCount: 6,
        createdAt: iso(4),
        updatedAt: iso(4),
        agentId: 'agent-asset-inspection',
        agentName: 'Asset inspection agent',
        flightIds: ['demo-flight-9', 'demo-flight-11'],
        droneName: 'M4TD',
        executiveSummary:
          'Six patrols across the Meridian campus this week returned a clean sterile-corridor record and no unscheduled loading dock access. Building A roof plant thermal readings tracked within 3°C of the March baseline across all six passes. The monthly generator load test on Tuesday produced the expected thermal and acoustic signature and was correctly classified as scheduled activity by the detection pipeline, with no false escalation.',
      },
      DEMO_OBSERVATIONS.slice(3, 4),
    ),
  ];
}

// ─── Drafts ──────────────────────────────────────────────────────────

export function buildSeedDrafts(): DraftReport[] {
  const rows = DEMO_WIZARD_FLIGHTS.slice(5, 10);

  const statuses: Array<DraftReport['status']> = [
    'ready_for_review',
    'ready_for_review',
    'in_review',
    'ready_for_review',
    'in_review',
  ];

  return rows.map((f, i) => ({
    id: `seed-draft-${i + 1}`,
    status: statuses[i] ?? 'ready_for_review',
    createdAt: new Date(Date.now() - (i + 1) * 5 * 3600_000).toISOString(),
    mission: {
      id: `mission-${f.id}`,
      flightId: f.id,
      name: f.missionName,
      date: f.date,
      time: f.time,
      droneName: f.drone,
      dockName: f.dock,
      durationSeconds: f.durationSec,
      imageCount: f.imageCount,
      detectionCount: f.detectionCount,
      pilotNoteCount: f.pilotNotes,
      highestSeverity: f.highestSeverity,
      status: 'draft_ready',
    },
  }));
}
