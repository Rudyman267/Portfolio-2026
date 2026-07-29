import type {
  WebhookFlightEvent,
  MissionExecutionStartedEvent,
  MissionWaypointReachedEvent,
  SingleMediaUploadedEvent,
  MissionExecutionCompletedEvent,
} from '@/types/report.types';
import { DEMO_SITE } from '@/data/demo-scenario';
import { assetUrl } from '@/exhibit/asset-url';

type EventHandler = (event: WebhookFlightEvent) => void;

let cycleInterval: number | null = null;
let pendingTimeouts: number[] = [];

const ORG_ID = 'demo-org-verkos';
const TOTAL_WAYPOINTS = 12;
const WP_INTERVAL_MS = 13_000;

function uuid(): string {
  return (crypto as { randomUUID?: () => string }).randomUUID?.() ??
    `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function simulateFlight(onEvent: EventHandler): void {
  const flightId = `mock-flight-${Date.now()}`;
  const bindingId = `mock-binding-${Date.now()}`;
  const missionId = `mock-mission-${Date.now()}`;

  const fdMission = {
    flightId,
    bindingId,
    droneId: 'mock-drone',
    droneName: 'M4TD-Mock',
    dockId: 'mock-dock',
    dockName: 'Dock 3',
  };
  const fdMedia = {
    flightId,
    taskId: flightId,
    droneId: 'mock-drone',
    droneName: 'M4TD-Mock',
    dockId: 'mock-dock',
    dockName: 'Dock 3',
  };
  const siteDetails = { siteId: DEMO_SITE.id, siteName: DEMO_SITE.name };

  const started: MissionExecutionStartedEvent = {
    eventId: uuid(),
    eventType: 'mission.execution.started',
    organizationId: ORG_ID,
    timestamp: new Date().toISOString(),
    data: {
      flightDetails: fdMission,
      siteDetails,
      missionDetails: {
        missionId,
        missionName: 'Live demo patrol — East perimeter',
        missionType: 'path',
        totalWaypoints: TOTAL_WAYPOINTS,
        requestType: 'scheduled_mission_request',
      },
    },
  };
  onEvent(started);

  for (let i = 1; i <= TOTAL_WAYPOINTS; i++) {
    const t = window.setTimeout(() => {
      const wp: MissionWaypointReachedEvent = {
        eventId: uuid(),
        eventType: 'mission.waypoint.reached',
        organizationId: ORG_ID,
        timestamp: new Date().toISOString(),
        data: {
          flightDetails: fdMission,
          siteDetails,
          missionDetails: {
            missionId,
            missionName: started.data.missionDetails.missionName,
            missionType: 'path',
            totalWaypoints: TOTAL_WAYPOINTS,
            currentWaypointNumber: i,
            waypointId: `WP-${String(i).padStart(3, '0')}`,
          },
        },
      };
      onEvent(wp);

      if (i % 3 === 0) {
        const media: SingleMediaUploadedEvent = {
          eventId: uuid(),
          eventType: 'single_media.uploaded.completed',
          organizationId: ORG_ID,
          timestamp: new Date().toISOString(),
          data: {
            flightDetails: fdMedia,
            siteDetails,
            missionDetails: {
              missionId,
              missionName: started.data.missionDetails.missionName,
              waypointId: `WP-${String(i).padStart(3, '0')}`,
            },
            mediaDetails: {
              mediaId: `mock-media-${Date.now()}-${i}`,
              fileName: `DJI_mock_${i}.jpg`,
              fileType: 'image',
              size: 3_400_000,
              uploadedAt: new Date().toISOString(),
              // EXHIBIT: real patrol frames instead of an external placeholder
              // service — the live-flight sim cycles through the demo set.
              dataUrl: assetUrl(`/demo/patrol-frame-${11 + (i % 14)}.jpg`),
              thumbnailUrl: assetUrl(`/demo/patrol-frame-${11 + (i % 14)}.jpg`),
            },
          },
        };
        onEvent(media);
      }
    }, i * WP_INTERVAL_MS);
    pendingTimeouts.push(t);
  }

  const completeT = window.setTimeout(() => {
    const done: MissionExecutionCompletedEvent = {
      eventId: uuid(),
      eventType: 'mission.execution.completed',
      organizationId: ORG_ID,
      timestamp: new Date().toISOString(),
      data: {
        flightDetails: fdMission,
        siteDetails,
        missionDetails: {
          missionId,
          missionName: started.data.missionDetails.missionName,
          missionType: 'path',
          totalWaypoints: TOTAL_WAYPOINTS,
          achievedWaypoints: TOTAL_WAYPOINTS,
          outcome: 'completed',
        },
      },
    };
    onEvent(done);
  }, (TOTAL_WAYPOINTS + 1) * WP_INTERVAL_MS);
  pendingTimeouts.push(completeT);
}

/**
 * Start the mock event source.
 * Runs a new simulated flight every 4 minutes.
 */
export function startMockFlightEventStream(onEvent: EventHandler): void {
  stopMockFlightEventStream();
  simulateFlight(onEvent);
  cycleInterval = window.setInterval(() => simulateFlight(onEvent), 4 * 60 * 1000);
}

export function stopMockFlightEventStream(): void {
  if (cycleInterval) {
    clearInterval(cycleInterval);
    cycleInterval = null;
  }
  pendingTimeouts.forEach((t) => clearTimeout(t));
  pendingTimeouts = [];
}
