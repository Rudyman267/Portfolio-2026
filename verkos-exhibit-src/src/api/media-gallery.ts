import { AxiosInstance } from 'axios';

const MEDIA_GALLERY_URL = 'v2/objects/files?page=1&limit=200&sortingOrder=-1';

// ─── Response types (exact shape from POST /v2/objects/files) ───

export interface MediaFile {
  media_id: string;
  flight_id: string;
  task_id?: string;
  file_name: string;
  file_type: number; // 0 = image, 1 = video, 3 = panorama
  file_extension?: string;
  data_url: string;
  thumbnail_url: string;
  capture_timestamp: string;
  location?: { lat: number; long: number; alt: number };
  lens_type?: number | null;
  tag_ids?: string[];
}

export interface MediaGroup {
  task_id: string;
  files: MediaFile[];
  total_media: number;
  missions?: Array<{ _id: string; name: string }>;
  flight_types?: string[];
  created_time?: string;
}

export interface FlightByDateResult {
  flightId: string;
  missionName: string;
  totalMedia: number;
  createdTime: string;
  flightTypes: string[];
}

export interface MediaGalleryResponse {
  media: MediaGroup[];
  page: number;
  limit: number;
}

/**
 * Fetch all media files (images only) for the given flight IDs.
 * Filters out videos (file_type 1) and panoramas (file_type 3).
 *
 * Returns an empty array if no flightIds provided or on auth/network failure.
 */
export async function fetchFlightMedia(
  httpClient: AxiosInstance,
  flightIds: string[] // these are task_ids from the flights API
): Promise<MediaFile[]> {
  console.log('[MediaGallery] flightIds (task_ids) received:', JSON.stringify(flightIds));
  if (!flightIds || flightIds.length === 0) {
    console.warn('[MediaGallery] fetchFlightMedia called with empty flightIds — skipping');
    return [];
  }

  const allFiles: MediaFile[] = [];

  for (const taskId of flightIds) {
    try {
      const response = await httpClient.post<MediaGalleryResponse>(
        `v2/objects/folder/${taskId}?page=1&limit=200&sortingOrder=-1`,
        {} // body supports mediaTypes and lensTypes filters, but we want all
      );

      for (const group of response.data?.media ?? []) {
        for (const file of group.files ?? []) {
          if (file.file_type === 0 && file.data_url) {
            allFiles.push({
              ...file,
              flight_id: file.flight_id ?? group.task_id ?? taskId,
              task_id: file.task_id ?? group.task_id ?? taskId,
            });
          }
        }
      }

      console.log('[MediaGallery] Flight', taskId, '→', allFiles.length, 'images so far');
    } catch (error: unknown) {
      const err = error as { response?: { status?: number }; message?: string };
      if (err?.response?.status === 401) {
        console.warn('[MediaGallery] Auth failed (401) for flight', taskId);
      } else {
        console.error(
          '[MediaGallery] Failed to fetch media for flight',
          taskId,
          ':',
          err?.response?.status,
          err?.message
        );
      }
    }
  }

  console.log('[MediaGallery] Total:', allFiles.length, 'images from', flightIds.length, 'flights');
  return allFiles;
}

/**
 * Fetch flights with media for a specific date range using the Media Gallery API.
 * The /v2/flight endpoint does not support server-side date filtering, so we use
 * the Media Gallery (POST /v2/objects/files) which accepts a `dateRange` body param.
 *
 * Returns one entry per task_id (flight) that has media within the range.
 */
export async function fetchFlightsByDate(
  httpClient: AxiosInstance,
  dateStart: string,
  dateEnd: string
): Promise<FlightByDateResult[]> {
  try {
    const response = await httpClient.post<MediaGalleryResponse>(
      'v2/objects/files?page=1&limit=60&sortingOrder=-1',
      {
        flightTypes: [],
        dateRange: {
          start: dateStart,
          end: dateEnd,
        },
      }
    );

    return (response.data?.media ?? []).map((group) => ({
      flightId: group.task_id,
      missionName: group.missions?.[0]?.name ?? 'Unknown mission',
      totalMedia: group.total_media,
      createdTime: group.created_time ?? '',
      flightTypes: group.flight_types ?? [],
    }));
  } catch (error: unknown) {
    const err = error as { response?: { status?: number }; message?: string };
    console.error(
      '[MediaGallery] fetchFlightsByDate failed:',
      err?.response?.status,
      err?.message || error
    );
    return [];
  }
}
