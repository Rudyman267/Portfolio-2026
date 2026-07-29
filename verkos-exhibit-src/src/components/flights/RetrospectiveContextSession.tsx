import React, { useState, useEffect } from 'react';
import { useReportStore } from '@/store/report.store';
import { useFlights } from '@/libs/shared/api-modules/flights/hooks/use-flights';
import { fetchFlightMedia, type MediaFile } from '@/api/media-gallery';
import { useHttp } from '@auth';
import MediaTile from './MediaTile';
import FlightMediaViewer from './FlightMediaViewer';

interface Props {
  flightId: string;
}

export interface MediaItem {
  mediaId: string;
  dataUrl: string;
  thumbnailUrl: string | null;
  fileName: string;
  captureTimestamp: string;
}

const AUTOSAVE_MS = 600;

const RetrospectiveContextSession: React.FC<Props> = ({ flightId }) => {
  const context = useReportStore((s) => s.flightContexts[flightId]);
  const setFlightContext = useReportStore((s) => s.setFlightContext);
  const updateFlightContextText = useReportStore((s) => s.updateFlightContextText);
  const updateFlightContextImageNote = useReportStore((s) => s.updateFlightContextImageNote);
  const httpClient = useHttp();
  const { flights } = useFlights();
  const flight = flights.find((f) => f.flight_id === flightId);

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [localText, setLocalText] = useState(context?.text ?? '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (!httpClient || !flightId) return;
    setMediaLoading(true);
    fetchFlightMedia(httpClient, [flightId])
      .then((items: MediaFile[]) =>
        setMedia(
          items.map((i) => ({
            mediaId: i.media_id,
            dataUrl: i.data_url,
            thumbnailUrl: i.thumbnail_url ?? null,
            fileName: i.file_name ?? 'media',
            captureTimestamp: i.capture_timestamp ?? '',
          }))
        )
      )
      .catch((e) => console.error('[Retro] media fetch:', e))
      .finally(() => setMediaLoading(false));
  }, [flightId, httpClient]);

  useEffect(() => {
    if (localText === (context?.text ?? '')) return;
    setSaveStatus('saving');
    const timer = window.setTimeout(() => {
      if (!context) {
        setFlightContext(flightId, {
          siteId: flight?.site_details?.site_id ?? '',
          text: localText,
          source: 'typed',
          captureMode: 'retrospective',
        });
      } else {
        updateFlightContextText(flightId, localText);
      }
      setSaveStatus('saved');
      window.setTimeout(() => setSaveStatus('idle'), 1500);
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [localText, context, flightId, flight, setFlightContext, updateFlightContextText]);

  const missionName = flight?.missions?.[0]?.mission_name ?? 'Unknown mission';
  const siteName = flight?.site_details?.site_name ?? 'Unknown site';
  const noteCount = context ? Object.keys(context.imageNotes).length : 0;

  return (
    <div className="space-y-4">
      <div>
        <div className="text-white/[0.88] text-[16px] font-medium">{missionName}</div>
        <div className="text-white/[0.50] text-[12px] mt-1">
          {siteName} · {flight?.drone_details?.drone_name ?? 'Unknown drone'} · {media.length} media file
          {media.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div>
        <div className="text-[12px] uppercase tracking-wider text-white/[0.50] mb-2">Overall notes</div>
        <textarea
          value={localText}
          onChange={(e) => setLocalText(e.target.value)}
          placeholder="What should the AI know about this flight? Authorized activities, anomalies, recurring issues..."
          className="w-full min-h-[120px] bg-[#161618] border border-white/[0.06] rounded-xl p-3 text-[14px] text-white/[0.88] placeholder:text-white/[0.25] resize-vertical focus:outline-none focus:border-primary-200/30"
        />
        <div className="mt-2 text-[11px] text-white/[0.35]">
          {saveStatus === 'saving' && (
            <>
              <i className="fa-solid fa-circle-notch fa-spin text-[10px]" /> Saving...
            </>
          )}
          {saveStatus === 'saved' && (
            <span className="text-success-30">
              <i className="fa-solid fa-check text-[10px]" /> Saved
            </span>
          )}
        </div>
      </div>

      <div>
        <div className="text-[12px] uppercase tracking-wider text-white/[0.50] mb-2">
          Media
          {noteCount > 0 && (
            <span className="ml-2 text-primary-200 normal-case font-normal">
              · {noteCount} note{noteCount !== 1 ? 's' : ''} added
            </span>
          )}
        </div>
        {mediaLoading ? (
          <div className="py-12 text-center text-white/[0.40]">
            <i className="fa-solid fa-spinner fa-spin text-xl" />
          </div>
        ) : media.length === 0 ? (
          <div className="py-12 text-center text-white/[0.30]">
            <i className="fa-solid fa-images text-3xl mb-2 opacity-40" />
            <p className="fb-body-2">No media available</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
            {media.map((item) => (
              <MediaTile
                key={item.mediaId}
                item={item}
                hasNote={(context?.imageNotes[item.mediaId] ?? '').trim().length > 0}
                onClick={() => setViewerIndex(media.indexOf(item))}
              />
            ))}
          </div>
        )}
      </div>

      {context && (context.wordCount > 0 || noteCount > 0) && (
        <div className="mt-6 pt-4 border-t border-white/[0.08]">
          <span className="text-[12px] text-white/[0.60]">
            {context.wordCount} total words
            {noteCount > 0 && ` · ${noteCount} image note${noteCount !== 1 ? 's' : ''}`}
          </span>
        </div>
      )}

      {viewerIndex !== null && (
        <FlightMediaViewer
          items={media}
          initialIndex={viewerIndex}
          notes={context?.imageNotes ?? {}}
          onNoteChange={(mediaId, note) => updateFlightContextImageNote(flightId, mediaId, note)}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  );
};

export default RetrospectiveContextSession;
