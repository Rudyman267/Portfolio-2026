import { AxiosInstance } from 'axios';

const FORENSIC_BASE_URL = '/flink-apps/forensic';

// ─── Search API types (exact response shape) ───

export interface ForensicSearchResponse {
  query_type: string;
  query: string;
  total_results: number;
  results: ForensicSearchResult[];
  search_time_ms: number;
}

export interface ForensicSearchResult {
  id: string;
  score: number;
  source_file: string;
  source_type: string; // "image" | "video_clip"
  media_id: string;
  flight_id: string;
  mission_id: string | null;
  site_id: string;
  file_type: string;
  capture_timestamp: string | null;
  latitude: number;
  longitude: number;
  data_url: string;
  thumbnail_url: string | null;
  download_url: string | null;
  detected_objects: string[];
  object_counts: Record<string, number>;
  max_confidence: Record<string, number>;
  gimbal_yaw: number | null;
  gimbal_pitch: number | null;
  drone_lat?: number | null;
  drone_lng?: number | null;
  drone_alt_rel?: number | null;
}

// ─── Detections API types (bounding boxes) ───

export interface DetectionObject {
  bbox: [number, number, number, number]; // [x, y, width, height] in pixel coords
  class: string;
  conf: number;
}

export interface DetectionsResponse {
  organizationId: string;
  mediaId: string;
  totalClips: number;
  detection_resolution: [number, number];
  detection_model: string;
  detected_objects: string[];
  detections: Array<{
    t: number;
    objects: DetectionObject[];
  }>;
}

// ─── API calls ───

interface SearchFilters {
  flight_id?: string[];
  file_type?: string[];
  site_id?: string[];
}

/**
 * Search for media using a text query.
 * Returns presigned image URLs directly (data_url field).
 */
export async function searchForensicMedia(
  httpClient: AxiosInstance,
  params: {
    query: string;
    topK: number;
    flightIds?: string[];
    fileType?: string[];
    siteIds?: string[];
  }
): Promise<ForensicSearchResult[]> {
  try {
    // Note: flight_id filter intentionally omitted — the forensic flink
    // has very few flights indexed, so we search across ALL indexed media
    // for the org and let detection scores rank the matches.
    const filters: SearchFilters = {};
    if (params.fileType && params.fileType.length > 0) {
      filters.file_type = params.fileType;
    }
    if (params.flightIds && params.flightIds.length > 0) {
      filters.flight_id = params.flightIds;
    }

    const response = await httpClient.post<ForensicSearchResponse>(
      `${FORENSIC_BASE_URL}/api/v1/ai-search/search/text`,
      {
        query: params.query,
        top_k: params.topK,
        filters,
      }
    );

    return response.data?.results ?? [];
  } catch (error: unknown) {
    const err = error as { response?: { status?: number }; message?: string };
    if (err?.response?.status === 401) {
      console.warn('[ForensicSearch] Auth failed (401) — forensic search unavailable from this environment');
    } else {
      console.error('[ForensicSearch] Search failed:', err?.response?.status, err?.message || error);
    }
    return [];
  }
}

/**
 * Get bounding box detections for a specific media item.
 * Returns pixel-coordinate bounding boxes at the detection_resolution.
 */
export async function getMediaDetections(
  httpClient: AxiosInstance,
  mediaId: string
): Promise<DetectionsResponse | null> {
  try {
    const response = await httpClient.get<DetectionsResponse>(
      `${FORENSIC_BASE_URL}/api/v1/ai-search/search/detections/${mediaId}`
    );
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { status?: number }; message?: string };
    console.error('[ForensicSearch] Detections fetch failed:', err?.response?.status, err?.message || error);
    return null;
  }
}

// ─── Enriched result type (after fetching detections) ───

export interface EnrichedForensicResult {
  mediaId: string;
  searchResultId: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  score: number;
  sourceFile: string;
  captureTimestamp: string | null;
  latitude: number;
  longitude: number;
  flightId: string;
  missionId: string | null;
  siteId: string;
  detectedObjects: string[];
  maxConfidence: Record<string, number>;
  objectCounts: Record<string, number>;
  bboxObjects: DetectionObject[];
  detectionResolution: [number, number];
  gimbalPitch: number | null;
  gimbalYaw: number | null;
  matchedEvent: string;
  eventSeverity: string;
}

export interface AgentDetectionEventLite {
  name: string;
  description: string;
  enabled: boolean;
  defaultSeverity: string;
}

/**
 * Full pipeline: Run agent detection queries, then fetch bounding boxes.
 *
 * 1. For each enabled detection event, search using its description as the query.
 * 2. Filter to image results only and de-dupe by media_id.
 * 3. Fetch bounding box data for each matched image.
 * 4. Return enriched results with image URLs + bbox data.
 *
 * If `flightIds` is empty, search runs without the flight_id filter
 * (searches all indexed media for the org).
 */
export async function runAgentDetectionQueries(
  httpClient: AxiosInstance,
  params: {
    detectionEvents: AgentDetectionEventLite[];
    flightIds: string[];
    siteIds?: string[];
    topK?: number;
  },
  onProgress?: (completed: number, total: number, eventName: string) => void
): Promise<{
  results: EnrichedForensicResult[];
  queriesRun: number;
  totalResults: number;
}> {
  const enabledEvents = params.detectionEvents.filter((e) => e.enabled);
  const rawResults: Array<ForensicSearchResult & { matchedEvent: string; eventSeverity: string }> = [];
  const seenMediaIds = new Set<string>();
  const totalSteps = enabledEvents.length + 1; // +1 for bbox fetch step

  // Step 1: Run all forensic search queries
  // NOTE: flightIds/siteIds intentionally NOT forwarded — the forensic flink
  // has limited indexed coverage, so we search across all indexed media for
  // the org and let detection scores rank the matches.
  for (let i = 0; i < enabledEvents.length; i++) {
    const event = enabledEvents[i];
    onProgress?.(i, totalSteps, event.name);

    const results = await searchForensicMedia(httpClient, {
      query: event.description,
      topK: params.topK ?? 10,
      fileType: ['image'],
      flightIds: params.flightIds,
    });

    for (const result of results) {
      if (
        result.source_type === 'image' &&
        result.data_url &&
        !seenMediaIds.has(result.media_id)
      ) {
        seenMediaIds.add(result.media_id);
        rawResults.push({
          ...result,
          matchedEvent: event.name,
          eventSeverity: event.defaultSeverity,
        });
      }
    }
  }

  if (rawResults.length === 0) {
    onProgress?.(totalSteps, totalSteps, 'Done');
    return { results: [], queriesRun: enabledEvents.length, totalResults: 0 };
  }

  // Step 2: Fetch bounding box data for each matched image
  onProgress?.(enabledEvents.length, totalSteps, 'Fetching bounding boxes');

  const enrichedResults: EnrichedForensicResult[] = [];

  for (const result of rawResults) {
    const detections = await getMediaDetections(httpClient, result.media_id);

    // For images, t=0 is the only frame
    const bboxObjects = detections?.detections?.[0]?.objects ?? [];
    const detectionResolution: [number, number] =
      detections?.detection_resolution ?? [3840, 2160];

    enrichedResults.push({
      mediaId: result.media_id,
      searchResultId: result.id,
      imageUrl: result.data_url,
      thumbnailUrl: result.thumbnail_url,
      score: result.score,
      sourceFile: result.source_file,
      captureTimestamp: result.capture_timestamp,
      latitude: result.latitude,
      longitude: result.longitude,
      flightId: result.flight_id,
      missionId: result.mission_id,
      siteId: result.site_id,
      detectedObjects: result.detected_objects ?? [],
      maxConfidence: result.max_confidence ?? {},
      objectCounts: result.object_counts ?? {},
      bboxObjects,
      detectionResolution,
      gimbalPitch: result.gimbal_pitch,
      gimbalYaw: result.gimbal_yaw,
      matchedEvent: result.matchedEvent,
      eventSeverity: result.eventSeverity,
    });
  }

  onProgress?.(totalSteps, totalSteps, 'Done');

  return {
    results: enrichedResults,
    queriesRun: enabledEvents.length,
    totalResults: enrichedResults.length,
  };
}
