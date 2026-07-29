import { supabase } from '@/integrations/supabase/client';
import type { WebhookFlightEvent } from '@/types/report.types';
import type { RealtimeChannel } from '@supabase/supabase-js';

type EventHandler = (event: WebhookFlightEvent) => void;
let activeChannel: RealtimeChannel | null = null;

function payloadToEvent(payload: any): WebhookFlightEvent | null {
  if (!payload?.event_type || !payload?.data) return null;
  const common = {
    eventId: payload.event_id,
    eventType: payload.event_type,
    organizationId: payload.organization_id,
    timestamp: payload.timestamp,
  };
  const fd = payload.data.flight_details;
  const fdMission = fd
    ? {
        flightId: fd.flight_id,
        bindingId: fd.binding_id,
        droneId: fd.drone_id ?? null,
        droneName: fd.drone_name ?? null,
        dockId: fd.dock_id ?? null,
        dockName: fd.dock_name ?? null,
      }
    : null;
  const fdMedia = fd
    ? {
        flightId: fd.flight_id,
        taskId: fd.task_id ?? null,
        droneId: fd.drone_id ?? null,
        droneName: fd.drone_name ?? null,
        dockId: fd.dock_id ?? null,
        dockName: fd.dock_name ?? null,
      }
    : null;
  const sd = payload.data.site_details;
  const siteDetails = sd ? { siteId: sd.site_id, siteName: sd.site_name ?? null } : null;
  const md = payload.data.mission_details;

  switch (payload.event_type) {
    case 'mission.execution.started':
      if (!fdMission || !md) return null;
      return {
        ...common,
        eventType: 'mission.execution.started',
        data: {
          flightDetails: fdMission,
          siteDetails,
          missionDetails: {
            missionId: md.mission_id,
            missionName: md.mission_name,
            missionType: md.mission_type ?? null,
            totalWaypoints: md.total_waypoints,
            requestType: md.request_type,
          },
        },
      } as WebhookFlightEvent;
    case 'mission.execution.completed':
      if (!fdMission || !md) return null;
      return {
        ...common,
        eventType: 'mission.execution.completed',
        data: {
          flightDetails: fdMission,
          siteDetails,
          missionDetails: {
            missionId: md.mission_id,
            missionName: md.mission_name,
            missionType: md.mission_type ?? null,
            totalWaypoints: md.total_waypoints,
            achievedWaypoints: md.achieved_waypoints,
            outcome: md.outcome,
          },
        },
      } as WebhookFlightEvent;
    case 'mission.waypoint.reached':
      if (!fdMission || !md) return null;
      return {
        ...common,
        eventType: 'mission.waypoint.reached',
        data: {
          flightDetails: fdMission,
          siteDetails,
          missionDetails: {
            missionId: md.mission_id,
            missionName: md.mission_name,
            missionType: md.mission_type ?? null,
            totalWaypoints: md.total_waypoints,
            currentWaypointNumber: md.current_waypoint_number,
            waypointId: md.waypoint_id ?? null,
          },
        },
      } as WebhookFlightEvent;
    case 'single_media.uploaded.completed': {
      if (!fdMedia) return null;
      const mediaDetails = payload.data.media_details;
      if (!mediaDetails) return null;
      return {
        ...common,
        eventType: 'single_media.uploaded.completed',
        data: {
          flightDetails: fdMedia,
          siteDetails,
          missionDetails: md
            ? {
                missionId: md.mission_id,
                missionName: md.mission_name ?? null,
                waypointId: md.waypoint_id ?? null,
              }
            : null,
          mediaDetails: {
            mediaId: mediaDetails.media_id,
            fileName: mediaDetails.file_name,
            fileType: mediaDetails.file_type,
            size: mediaDetails.size ?? null,
            uploadedAt: mediaDetails.uploaded_at,
            dataUrl: mediaDetails.data_url ?? null,
            thumbnailUrl: mediaDetails.thumbnail_url ?? null,
            location: mediaDetails.location,
            lensType: mediaDetails.lens_type ?? null,
          },
        },
      } as WebhookFlightEvent;
    }
    default:
      return null;
  }
}

export async function subscribeToFlightEvents(
  orgId: string,
  onEvent: EventHandler,
): Promise<void> {
  await unsubscribeFromFlightEvents();

  // Preload events from last 2 hours — reconstructs any in-progress flights
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data: recent, error } = await supabase
    .from('flight_events' as any)
    .select('*')
    .eq('org_id', orgId)
    .gte('received_at', twoHoursAgo)
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('[flight-events] preload:', error);
  } else if (recent) {
    for (const row of recent) {
      const event = payloadToEvent((row as any).payload);
      if (event) onEvent(event);
    }
  }

  activeChannel = supabase
    .channel(`flight-events-${orgId}`)
    .on(
      'postgres_changes' as any,
      {
        event: 'INSERT',
        schema: 'public',
        table: 'flight_events',
        filter: `org_id=eq.${orgId}`,
      },
      (payload: any) => {
        const event = payloadToEvent(payload.new?.payload);
        if (event) onEvent(event);
      },
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') console.error('[flight-events] channel error');
    });
}

export async function unsubscribeFromFlightEvents(): Promise<void> {
  if (activeChannel) {
    await supabase.removeChannel(activeChannel);
    activeChannel = null;
  }
}
