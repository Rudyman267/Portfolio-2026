import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import ContextCheckStep from './ContextCheckStep';
import { motion, useReducedMotion } from 'framer-motion';
import WizardFlightsStep from './WizardFlightsStep';
import { templateSectionToKind } from '../../types/report.types';
import type { Report, Observation, Severity, ObservationStatus, FlightContext } from '../../types/report.types';
import { useReportStore } from '../../store/report.store';
import { useToast } from '@libs/shared/ui/fb-components/Toast';
import { observationsForFlights } from '../../data/demo-scenario';
import { useSites } from '@/libs/shared/api-modules/sites/hooks/use-sites';
import { useFlights } from '@/libs/shared/api-modules/flights';
import { mergeApiAndLocalSites } from '@/utils/map-api-site';
import { useHttp } from '@auth';
import {
  runAgentDetectionQueries,
  type EnrichedForensicResult,
} from '@/api/forensic-search';
import { fetchFlightMedia } from '@/api/media-gallery';
import { renderBoundingBoxes } from '@/utils/bbox-renderer';
import ReportGenerationModal, { type GenerationStep } from './ReportGenerationModal';
import { generateFullReport, llmOutputToReport, assistSection, type AiError } from '@/services/ai-report-service';
import type { GalleryImage } from './MediaGallery';

type WizardStatus = 'configuring' | 'generating';

interface CreateReportWizardProps {
  mode: 'patrol' | 'incident' | 'shift';
  onClose: () => void;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const panelVariants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15 } },
};

const cardInset = 'inset 0 1px 0 rgba(255,255,255,0.04)';
const focusRingClass = 'focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50';

const CreateReportWizard: React.FC<CreateReportWizardProps> = ({ mode, onClose }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const shouldReduce = useReducedMotion();
  const localSites = useReportStore((s) => s.sites);
  const { data: apiSites, isLoading: sitesLoading } = useSites();
  const sites = useMemo(
    () => mergeApiAndLocalSites(apiSites ?? [], localSites),
    [apiSites, localSites]
  );
  const allAgents = useReportStore((s) => s.agents);
  const templates = useReportStore((s) => s.templates);
  const addReport = useReportStore((s) => s.addReport);
  const galleryImages = useReportStore((s) => s.galleryImages);
  const enterDemoMode = useReportStore((s) => s.enterDemoMode);
  const demoMode = useReportStore((s) => s.demoMode);
  const flightContexts = useReportStore((s) => s.flightContexts);
  const consumeWizardResumeState = useReportStore((s) => s.consumeWizardResumeState);
  const location = useLocation();
  const [showContextCheck, setShowContextCheck] = useState(false);

  const handleTryDemoInstead = () => {
    enterDemoMode();
    onClose();
  };
  const { toast } = useToast();

  const activeAgents = useMemo(() => allAgents.filter((a) => a.status === 'active'), [allAgents]);
  const defaultTemplate = templates.find((t) => t.isDefault) ?? templates[0];

  const [status, setStatus] = useState<WizardStatus>('configuring');

  // Section 1: Sites (multi-select)
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([sites[0]?.id].filter(Boolean));

  // Auto-select first site once sites are loaded (handles async API load)
  useEffect(() => {
    if (selectedSiteIds.length === 0 && sites.length > 0) {
      setSelectedSiteIds([sites[0].id]);
    }
  }, [sites, selectedSiteIds.length]);

  // Resolve API site IDs for selected local sites (only `site-fb-*` sites map to API flights)
  const selectedSiteApiId = useMemo(() => {
    const site = sites.find((s) => selectedSiteIds.includes(s.id));
    if (!site) return null;
    return site.id.startsWith('site-fb-') ? site.id.replace('site-fb-', '') : null;
  }, [sites, selectedSiteIds]);

  // Date range lifted from WizardFlightsStep so we can switch flight-fetch APIs
  // (Media Gallery API when a calendar date is picked, /v2/flight otherwise).
  const [flightDateRange, setFlightDateRange] = useState<{ from: Date; to: Date } | null>(null);

  const { flights: apiFlightLogs, isLoading: flightsLoading } = useFlights(
    selectedSiteApiId,
    flightDateRange
  );

  // Section 2: Flights
  const [selectedFlights, setSelectedFlights] = useState<string[]>([]);

  // Section 3: Agents (multi-select)
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>(
    activeAgents.length > 0 ? [activeAgents[0].id] : []
  );

  // Section 4: Template
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(defaultTemplate?.id ?? '');

  // Rehydrate wizard from a wizard-resume handoff (set when user opened full session from ContextCheckStep)
  useEffect(() => {
    const resume = consumeWizardResumeState();
    if (!resume) return;
    if (resume.siteIds.length > 0) setSelectedSiteIds(resume.siteIds);
    setSelectedFlights(resume.selectedFlightIds);
    if (resume.agentId) setSelectedAgentIds([resume.agentId]);
    if (resume.templateId) setSelectedTemplateId(resume.templateId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Incident-specific fields
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().slice(0, 10));
  const [incidentTime, setIncidentTime] = useState('08:00');
  const [incidentDescription, setIncidentDescription] = useState('');

  // Shift-specific fields
  const [shiftType, setShiftType] = useState<'day' | 'night'>('day');
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().slice(0, 10));

  const selectedSiteNames = useMemo(
    () => sites.filter((s) => selectedSiteIds.includes(s.id)).map((s) => s.name),
    [sites, selectedSiteIds]
  );
  const selectedAgentNames = useMemo(
    () => allAgents.filter((a) => selectedAgentIds.includes(a.id)).map((a) => a.name),
    [allAgents, selectedAgentIds]
  );
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const toggleSite = useCallback((siteId: string) => {
    setSelectedSiteIds((prev) =>
      prev.includes(siteId) ? (prev.length > 1 ? prev.filter((id) => id !== siteId) : prev) : [...prev, siteId]
    );
  }, []);

  const toggleAgent = useCallback((agentId: string) => {
    setSelectedAgentIds((prev) =>
      prev.includes(agentId) ? (prev.length > 1 ? prev.filter((id) => id !== agentId) : prev) : [...prev, agentId]
    );
  }, []);

  const canGenerate = useMemo((): boolean => {
    if (selectedSiteIds.length === 0 || selectedAgentIds.length === 0 || !selectedTemplateId) return false;
    if (mode === 'patrol') return selectedFlights.length > 0;
    if (mode === 'incident') {
      return (
        incidentTitle.trim().length > 0 &&
        incidentDescription.trim().length > 0 &&
        selectedFlights.length > 0
      );
    }
    if (mode === 'shift') return true;
    return false;
  }, [mode, selectedSiteIds, selectedAgentIds, selectedTemplateId, selectedFlights, incidentTitle, incidentDescription]);

  // ─── Generation pipeline state ──────────────────────────────────────
  const httpClient = useHttp();
  const addGalleryImages = useReportStore((s) => s.addGalleryImages);
  // (updateGalleryImagesById removed — merging happens locally before store push)
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const cancelledRef = useRef(false);

  const updateStep = useCallback((stepId: string, updates: Partial<GenerationStep>) => {
    setGenerationSteps((prev) => prev.map((s) => (s.id === stepId ? { ...s, ...updates } : s)));
  }, []);

  const buildReportTitle = useCallback(
    (siteNameJoined: string) => {
      if (mode === 'shift') return `${shiftType === 'day' ? 'Day' : 'Night'} Shift Summary — ${shiftDate}`;
      if (mode === 'incident') return incidentTitle;
      return `${siteNameJoined} — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    },
    [mode, shiftType, shiftDate, incidentTitle]
  );

  // ─── Demo-mode handler (preserves existing behavior) ────────────────
  const handleGenerateDemo = useCallback(() => {
    setStatus('generating');
    setTimeout(() => {
      const firstAgentId = selectedAgentIds[0];
      const firstAgent = allAgents.find((a) => a.id === firstAgentId);
      const selectedTpl = templates.find((t) => t.id === selectedTemplateId);
      const siteNameJoined = selectedSiteNames.join(', ');
      const agentNameJoined = selectedAgentNames.join(', ');

      if (!firstAgent || !selectedTpl) {
        setStatus('configuring');
        return;
      }

      const reportId = `report-${Date.now()}`;
      const today = new Date().toISOString().slice(0, 10);
      const sections = selectedTpl.sections
        .filter((s) => s.enabled)
        .sort((a, b) => a.order - b.order)
        .map((tplSec, idx) => ({
          id: `rs-${reportId}-${idx}`,
          templateSectionId: tplSec.id,
          kind: templateSectionToKind(tplSec.name),
          name: tplSec.name,
          content: '',
          order: tplSec.order,
          enabled: true,
        }));

      let demoObservations: Report['observations'] = [];
      let demoExecSummary = '';
      let demoShortRecs: string[] = [];
      let demoLongRecs: string[] = [];

      if (selectedFlights.length > 0) {
        demoObservations = observationsForFlights(selectedFlights) as Report['observations'];
        const obsCount = demoObservations.length;
        const criticalCount = demoObservations.filter((o) => o.severity === 'critical').length;
        const highCount = demoObservations.filter((o) => o.severity === 'high').length;

        demoExecSummary = obsCount > 0
          ? `Patrol covering ${selectedFlights.length} flight${selectedFlights.length !== 1 ? 's' : ''} at Skybase Alpha identified ${obsCount} notable observation${obsCount !== 1 ? 's' : ''} across captured media. ${criticalCount + highCount} require immediate follow-up (${criticalCount} critical, ${highCount} high severity). Review the findings below for recommended actions.`
          : `Patrol covering ${selectedFlights.length} flight${selectedFlights.length !== 1 ? 's' : ''} at Skybase Alpha completed without notable observations. All sectors assessed as within operational parameters.`;

        demoShortRecs = obsCount > 0
          ? ['Review flagged observations and dispatch ground teams as needed', 'Cross-reference unauthorized detections against site access registers', 'Verify any tracked deteriorations against historical baselines']
          : [];
        demoLongRecs = obsCount > 0
          ? ['Evaluate sensor coverage for sectors with recurring findings', 'Establish baseline scoring for observations that require historical comparison']
          : [];

        sections.forEach((s) => {
          if (s.kind === 'executive_summary') s.content = demoExecSummary;
          else if (s.kind === 'perimeter_status' && obsCount > 0) {
            s.content = `Perimeter integrity across selected flights shows ${criticalCount + highCount} elevated findings requiring response. Remaining sectors assessed as operational.`;
          } else if (s.kind === 'compliance') {
            s.content = `Patrol conducted in accordance with operating procedures. All ${selectedFlights.length} flight${selectedFlights.length !== 1 ? 's' : ''} completed. Human review applied to all findings prior to report finalization.`;
          }
        });
      }

      const report: Report = {
        id: reportId,
        title: buildReportTitle(siteNameJoined),
        profile: mode === 'shift' ? 'shift_summary' : mode === 'incident' ? 'incident' : 'full_operational',
        status: 'draft_ready',
        siteName: siteNameJoined,
        date: mode === 'shift' ? shiftDate : mode === 'incident' ? incidentDate : today,
        author: 'Current User',
        missionCount: selectedFlights.length,
        executiveSummary: demoExecSummary || (mode === 'incident' ? incidentDescription : ''),
        observations: demoObservations,
        shortTermRecommendations: demoShortRecs,
        longTermRecommendations: demoLongRecs,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        agentId: firstAgentId,
        agentName: agentNameJoined,
        templateId: selectedTemplateId,
        flightIds: selectedFlights,
        droneName: selectedFlights.length > 0 ? 'M4TD-NightOps' : null,
        missionName: null,
        sections,
        isDemo: true,
      };

      addReport(report);
      navigate({ to: '/report/$reportId', params: { reportId: report.id } as never });
    }, 600);
  }, [
    mode, selectedAgentIds, selectedTemplateId, selectedFlights,
    selectedSiteNames, selectedAgentNames, allAgents, templates,
    incidentDate, incidentDescription, shiftType, shiftDate,
    addReport, navigate, buildReportTitle,
  ]);

  // ─── Real-mode pipeline: forensic search → bbox → LLM → report ──────
  const handleGenerateReal = useCallback(async () => {
    const firstAgentId = selectedAgentIds[0];
    const firstAgent = allAgents.find((a) => a.id === firstAgentId);
    const selectedTpl = templates.find((t) => t.id === selectedTemplateId);
    const selectedSiteObjects = sites.filter((s) => selectedSiteIds.includes(s.id));
    const siteNameJoined = selectedSiteObjects.map((s) => s.name).join(', ');
    const apiSiteIds = selectedSiteObjects
      .map((s) => (s.id.startsWith('site-fb-') ? s.id.replace('site-fb-', '') : null))
      .filter((s): s is string => !!s);

    if (!firstAgent || !selectedTpl) return;

    cancelledRef.current = false;
    setGenerationError(null);
    setIsGenerating(true);

    const initialSteps: GenerationStep[] = [
      { id: 'media', label: 'Fetching flight media', status: 'pending' },
      { id: 'search', label: 'Searching for AI detections', status: 'pending' },
      { id: 'render', label: 'Fetching bounding boxes', status: 'pending' },
      { id: 'narrative', label: 'Generating report narrative', status: 'pending' },
      { id: 'enrich', label: 'Enriching observation narratives', status: 'pending' },
      { id: 'finalize', label: 'Finalizing report', status: 'pending' },
    ];
    setGenerationSteps(initialSteps);

    try {
      const mediaIdToGalleryId = new Map<string, string>();
      const newGalleryImages: GalleryImage[] = [];
      if (cancelledRef.current) throw new Error('cancelled');

      // ─── Step 1: Fetch flight media (all images for selected flights) ──
      updateStep('media', { status: 'running' });
      if (selectedFlights.length === 0) {
        updateStep('media', { status: 'skipped', detail: 'No flights selected' });
      } else {
        // The Media Gallery API groups files by `task_id`, not `flight_id`.
        // Map each selected flight to its task_id when available, else fall back to flight_id.
        const flightIdsForMedia = selectedFlights.map((id) => {
          const f = apiFlightLogs?.find((fl) => fl.flight_id === id);
          return f?.task_id ?? id;
        });
        console.log('[Report] selectedFlights for media fetch:', selectedFlights, '→ task_ids:', flightIdsForMedia);
        const mediaFiles = await fetchFlightMedia(httpClient, flightIdsForMedia);
        console.log(
          '[Report] Fetched media for',
          flightIdsForMedia.length,
          'flights:',
          flightIdsForMedia,
          '→',
          mediaFiles.length,
          'images'
        );
        for (const file of mediaFiles) {
          const galleryId = `media-${file.media_id}`;
          mediaIdToGalleryId.set(file.media_id, galleryId);
          const lat = file.location?.lat;
          const lng = file.location?.long;
          const alt = file.location?.alt ?? 0;
          newGalleryImages.push({
            id: galleryId,
            url: file.data_url,
            thumbnailUrl: file.thumbnail_url || file.data_url,
            mediaId: file.media_id,
            flightId: file.flight_id,
            flightName: file.flight_id,
            timestamp: file.capture_timestamp || new Date().toISOString(),
            droneName: '',
            dockName: '',
            siteId: apiSiteIds[0] || '',
            siteName: siteNameJoined,
            filename: file.file_name,
            gpsLat: lat != null ? String(lat) : '',
            gpsLng: lng != null ? String(lng) : '',
            altitudeM: alt,
            gimbalPitch: 0,
            resolution: '',
            fileSizeMB: 0,
            hasDetection: false,
            detectionLabel: null,
            detectionConfidence: null,
          });
        }
        updateStep('media', {
          status: mediaFiles.length > 0 ? 'done' : 'skipped',
          detail: mediaFiles.length > 0
            ? `${mediaFiles.length} image${mediaFiles.length === 1 ? '' : 's'} loaded`
            : 'No images returned',
        });
      }
      if (cancelledRef.current) throw new Error('cancelled');

      // ─── Step 2: Forensic search (scoped to selected flights) ─────
      updateStep('search', { status: 'running' });
      const enabledEvents = firstAgent.config.detectionEvents.filter((e) => e.enabled);
      let forensicResults: EnrichedForensicResult[] = [];
      let queriesRun = 0;

      if (enabledEvents.length === 0) {
        updateStep('search', { status: 'skipped', detail: 'No enabled detection events' });
      } else {
        const outcome = await runAgentDetectionQueries(
          httpClient,
          {
            detectionEvents: enabledEvents.map((e) => ({
              name: e.name,
              description: e.description,
              enabled: e.enabled,
              defaultSeverity: e.defaultSeverity,
            })),
            flightIds: selectedFlights, // context only — not sent as filter
            siteIds: apiSiteIds.length > 0 ? apiSiteIds : undefined,
            topK: 10,
          },
          (completed, total, eventName) => {
            updateStep('search', { detail: `${completed}/${total} · ${eventName}` });
          }
        );
        forensicResults = outcome.results;
        queriesRun = outcome.queriesRun;

        updateStep('search', {
          status: forensicResults.length > 0 ? 'done' : 'skipped',
          detail: forensicResults.length > 0
            ? `${forensicResults.length} matches from ${queriesRun} queries`
            : queriesRun > 0 ? `${queriesRun} queries, no matches` : 'Search unavailable',
        });
      }
      if (cancelledRef.current) throw new Error('cancelled');

      // ─── Step 3: Fetch bounding boxes + render annotations ────────
      updateStep('render', { status: 'running' });

      // Index local gallery images by id for fast in-place merging
      const galleryById = new Map<string, GalleryImage>(
        newGalleryImages.map((g) => [g.id, g])
      );

      if (forensicResults.length === 0) {
        updateStep('render', { status: 'skipped', detail: 'No images to annotate' });
      } else {
        let rendered = 0;
        for (const result of forensicResults) {
          if (cancelledRef.current) throw new Error('cancelled');
          const imageUrl = result.imageUrl;
          if (!imageUrl) continue;

          const mediaId = result.mediaId;
          const flightId = result.flightId || selectedFlights[0] || 'unknown';
          const ts = result.captureTimestamp || new Date().toISOString();
          const filename = result.sourceFile || `${mediaId}.jpg`;
          const score = result.score;
          const maxConfPct = Object.values(result.maxConfidence || {}).length > 0
            ? Math.round(Math.max(...Object.values(result.maxConfidence)) * 100)
            : Math.round(score * (score <= 1 ? 100 : 1));

          try {
            const { rawDataUrl, annotatedDataUrl, width, height } = await renderBoundingBoxes(
              imageUrl,
              result.bboxObjects,
              result.detectionResolution
            );

            const bboxData = {
              objects: result.bboxObjects,
              resolution: result.detectionResolution,
            };

            const existingId = mediaIdToGalleryId.get(mediaId);
            const existing = existingId ? galleryById.get(existingId) : undefined;
            if (existing) {
              // Flight media match — merge detection data onto existing entry
              existing.annotatedUrl = annotatedDataUrl;
              existing.bboxData = bboxData;
              existing.hasDetection = true;
              existing.detectionLabel = result.matchedEvent;
              existing.detectionConfidence = maxConfPct;
              existing.mediaId = mediaId;
            } else {
              // Forensic-only match (not in selected flights' media) — append
              const galleryId = `forensic-${mediaId}`;
              const entry: GalleryImage = {
                id: galleryId,
                url: rawDataUrl,
                thumbnailUrl: rawDataUrl,
                annotatedUrl: annotatedDataUrl,
                bboxData,
                mediaId,
                flightId,
                flightName: filename,
                timestamp: ts,
                droneName: '',
                dockName: '',
                siteId: result.siteId || apiSiteIds[0] || '',
                siteName: siteNameJoined,
                filename,
                gpsLat: result.latitude ? String(result.latitude) : '',
                gpsLng: result.longitude ? String(result.longitude) : '',
                altitudeM: 0,
                gimbalPitch: result.gimbalPitch ?? 0,
                resolution: `${width}x${height}`,
                fileSizeMB: 0,
                hasDetection: true,
                detectionLabel: result.matchedEvent,
                detectionConfidence: maxConfPct,
              };
              newGalleryImages.push(entry);
              galleryById.set(galleryId, entry);
              mediaIdToGalleryId.set(mediaId, galleryId);
            }
            rendered += 1;
            updateStep('render', { detail: `${rendered}/${forensicResults.length}` });
          } catch (err) {
            console.warn('[bbox] render failed for', imageUrl, err);
          }
        }

        updateStep('render', {
          status: rendered > 0 ? 'done' : 'skipped',
          detail: rendered > 0 ? `${rendered} image${rendered === 1 ? '' : 's'} annotated` : 'Could not load images',
        });
      }

      // Push the merged gallery (flight media + forensic-only) to the store
      if (newGalleryImages.length > 0) addGalleryImages(newGalleryImages);
      if (cancelledRef.current) throw new Error('cancelled');

      // ─── Convert forensic detections into report observations ─────
      const forensicObservations: Observation[] = forensicResults.map((result, index) => {
        const galleryId = mediaIdToGalleryId.get(result.mediaId) ?? `forensic-${result.mediaId}`;
        const galleryEntry =
          [...galleryImages, ...newGalleryImages].find((g) => g.id === galleryId);
        const confidencePct = Object.values(result.maxConfidence || {}).length > 0
          ? Math.round(Math.max(...Object.values(result.maxConfidence)) * 100)
          : 0;
        const detectedLabel = result.detectedObjects.join(', ') || result.matchedEvent;
        return {
          id: `obs-${Date.now()}-${index}`,
          number: index + 1,
          title: `${result.matchedEvent}${result.detectedObjects.length > 0 ? `: ${detectedLabel}` : ''}`,
          severity: (result.eventSeverity as Severity) || 'moderate',
          status: 'acknowledged' as ObservationStatus,
          aiDescription: `AI detected ${result.detectedObjects.map((obj) => `${obj} (${Math.round((result.maxConfidence[obj] || 0) * 100)}% confidence)`).join(', ') || result.matchedEvent} at coordinates ${result.latitude.toFixed(4)}°N, ${result.longitude.toFixed(4)}°E. Capture time: ${result.captureTimestamp || 'unknown'}.`,
          pilotContext: null,
          rawImageUrl: galleryEntry?.url ?? result.imageUrl,
          annotatedImageUrl: galleryEntry?.annotatedUrl ?? null,
          images: [
            {
              id: galleryId,
              url: galleryEntry?.annotatedUrl ?? galleryEntry?.url ?? result.imageUrl,
              label: detectedLabel,
              timestamp: result.captureTimestamp || undefined,
              confidence: confidencePct,
            },
          ],
          imageCaption: `AI detection: ${detectedLabel} — ${result.sourceFile}`,
          confidence: confidencePct,
          timestamp: result.captureTimestamp || new Date().toISOString(),
        };
      });

      // Step 3: LLM narrative ──────────────────────────────────────
      updateStep('narrative', { status: 'running' });
      const flightsForLlm = selectedFlights.map((id) => ({
        id,
        missionName: id,
        droneName: '',
        timestamp: new Date().toISOString(),
      }));
      const allGalleryForLlm = [...galleryImages, ...newGalleryImages];

      const flightContextsObj = useReportStore.getState().flightContexts;
      const flightContextsArr = flightsForLlm
        .map((f) => flightContextsObj[f.id])
        .filter((c): c is FlightContext => !!c);

      let llmOutput: Awaited<ReturnType<typeof generateFullReport>> | null = null;
      try {
        llmOutput = await generateFullReport({
          agent: firstAgent,
          template: selectedTpl,
          sites: selectedSiteObjects,
          flights: flightsForLlm,
          galleryImages: allGalleryForLlm,
          flightContexts: flightContextsArr,
        });
        updateStep('narrative', {
          status: 'done',
          detail: `${llmOutput.observations?.length ?? 0} observations`,
        });
      } catch (err: unknown) {
        const msg = (err as { message?: string })?.message || 'LLM unavailable';
        console.warn('[generate-report] failed:', err);
        updateStep('narrative', { status: 'skipped', detail: msg });
      }
      if (cancelledRef.current) throw new Error('cancelled');

      // Step 4: Finalize report ────────────────────────────────────
      updateStep('finalize', { status: 'running' });

      let report: Report;
      if (llmOutput) {
        report = llmOutputToReport(llmOutput, {
          agent: firstAgent,
          template: selectedTpl,
          sites: selectedSiteObjects,
          flights: flightsForLlm,
          galleryImages: allGalleryForLlm,
          author: 'Current User',
        });
        report.title = buildReportTitle(siteNameJoined);
        if (mode === 'shift') report.profile = 'shift_summary';
        else if (mode === 'incident') report.profile = 'incident';
        // ─── Merge forensic grounding with LLM narrative ─────────────────
        // Forensic results tell us WHICH images have detections (grounding).
        // LLM output tells us HOW to describe them (narrative).
        // Match them by image ID. Use forensic for image/severity/detection metadata,
        // use LLM for aiDescription/impactAssessment/assetId/imageSubheader.

        const flightContextsSnapshot = useReportStore.getState().flightContexts;
        const imageNoteByGalleryId = new Map<string, string>();
        for (const ctx of Object.values(flightContextsSnapshot)) {
          for (const [mediaId, note] of Object.entries(ctx.imageNotes)) {
            if (!note?.trim()) continue;
            const galleryId = mediaIdToGalleryId.get(mediaId);
            if (galleryId) imageNoteByGalleryId.set(galleryId, note.trim());
          }
        }

        // Index LLM observations by their imageIds for fast lookup.
        // The LLM is instructed to populate imageIds referencing gallery images.
        const llmObsByImageId = new Map<string, NonNullable<typeof llmOutput.observations>[number]>();
        for (const llmObs of llmOutput.observations || []) {
          for (const imgId of llmObs.imageIds || []) {
            if (!llmObsByImageId.has(imgId)) llmObsByImageId.set(imgId, llmObs);
          }
        }

        // Merge: for each forensic detection, find matching LLM narrative (if any)
        const mergedForensic: Observation[] = forensicObservations.map((obs) => {
          const galleryId = obs.images[0]?.id;
          const matchedLlm = galleryId ? llmObsByImageId.get(galleryId) : undefined;
          const pilotNote = galleryId ? imageNoteByGalleryId.get(galleryId) : undefined;

          // LLM narrative is the primary text. Falls back to a minimal factual line
          // only when the LLM produced nothing for this image.
          const fallbackLine = pilotNote
            ? `Pilot noted: "${pilotNote}". Detection: ${obs.title}.`
            : `${obs.title} identified during aerial patrol. Automated analysis pending enrichment.`;

          return {
            ...obs,
            // Prefer LLM narrative; fall back to a minimal line (not the robotic template)
            aiDescription: matchedLlm?.aiDescription?.trim() || fallbackLine,
            // Depth-mode fields — pass through when LLM provided them
            impactAssessment: matchedLlm?.impactAssessment,
            assetId: matchedLlm?.assetId,
            imageSubheader: matchedLlm?.imageSubheader,
            // Title preference: LLM's title is usually more natural; keep forensic as fallback
            title: matchedLlm?.title?.trim() || obs.title,
            // Severity: forensic severity wins (grounded in detection event defaults)
            // unless LLM has good reason (pilot context mentioned "authorized" etc. — reflected
            // in LLM output); honor LLM severity when it differs meaningfully
            severity: (matchedLlm?.severity as Severity) || obs.severity,
            pilotContext: pilotNote || obs.pilotContext,
          };
        });

        // Track which LLM observations we've consumed
        const consumedLlmImageIds = new Set<string>();
        for (const obs of mergedForensic) {
          const galleryId = obs.images[0]?.id;
          if (galleryId && llmObsByImageId.has(galleryId)) consumedLlmImageIds.add(galleryId);
        }

        // Pilot-only observations (images with pilot notes but no forensic detection)
        const forensicGalleryIds = new Set(
          mergedForensic.map((o) => o.images[0]?.id).filter(Boolean) as string[]
        );
        const pilotOnlyObservations: Observation[] = [];
        let pilotObsIndex = mergedForensic.length;
        const allGalleryForPilot = [...galleryImages, ...newGalleryImages];

        for (const [galleryId, note] of imageNoteByGalleryId.entries()) {
          if (forensicGalleryIds.has(galleryId)) continue;
          const galleryImg = allGalleryForPilot.find((g) => g.id === galleryId);
          if (!galleryImg) continue;

          // Prefer LLM narrative for this image if available
          const matchedLlm = llmObsByImageId.get(galleryId);
          if (matchedLlm) consumedLlmImageIds.add(galleryId);

          const firstSentence = note.split(/[.!?\n]/)[0].trim();
          const words = firstSentence.split(/\s+/);
          const shortTitle = matchedLlm?.title?.trim() || (words.slice(0, 8).join(' ') + (words.length > 8 ? '…' : ''));

          pilotObsIndex += 1;
          pilotOnlyObservations.push({
            id: `obs-pilot-${Date.now()}-${pilotObsIndex}`,
            number: pilotObsIndex,
            title: shortTitle || 'Pilot observation',
            severity: (matchedLlm?.severity as Severity) || 'moderate',
            status: 'acknowledged',
            aiDescription: matchedLlm?.aiDescription?.trim() || `Pilot observation: "${note}"`,
            impactAssessment: matchedLlm?.impactAssessment,
            assetId: matchedLlm?.assetId,
            imageSubheader: matchedLlm?.imageSubheader,
            pilotContext: note,
            rawImageUrl: galleryImg.url,
            annotatedImageUrl: galleryImg.annotatedUrl ?? null,
            images: [{
              id: galleryId,
              url: galleryImg.annotatedUrl ?? galleryImg.url,
              label: 'Pilot-noted capture',
              timestamp: galleryImg.timestamp,
            }],
            imageCaption: `Pilot observation — ${galleryImg.filename ?? galleryId}`,
            confidence: matchedLlm?.confidence ?? 0,
            timestamp: galleryImg.timestamp || new Date().toISOString(),
          });
        }

        report.observations = [...mergedForensic, ...pilotOnlyObservations]
          .map((obs, idx) => ({ ...obs, number: idx + 1 }));
        report.missionCount = selectedFlights.length;

        // ─── Enrichment pass: auto-polish observations that lack a real narrative ───
        const FALLBACK_MARKERS = [
          'Click "Polish with AI"',
          'Pilot observation:',
          'detected. Click',
          'Automated analysis pending',
        ];
        const needsEnrichment = (obs: Observation): boolean => {
          const t = obs.aiDescription?.trim() || '';
          if (t.length < 60) return true;
          if (FALLBACK_MARKERS.some(m => t.includes(m))) return true;
          return false;
        };

        const toEnrich = report.observations.filter(needsEnrichment);
        if (toEnrich.length === 0) {
          updateStep('enrich', { status: 'skipped', detail: 'All observations already have narratives' });
        } else {
          updateStep('enrich', { status: 'running', detail: `0/${toEnrich.length}` });

          const BATCH_SIZE = 4;
          const enrichedMap = new Map<string, Partial<Observation>>();
          let done = 0;
          let creditLimitHit = false;

          for (let i = 0; i < toEnrich.length; i += BATCH_SIZE) {
            if (cancelledRef.current) throw new Error('cancelled');
            const batch = toEnrich.slice(i, i + BATCH_SIZE);

            const results = await Promise.allSettled(batch.map(async (obs) => {
              const galleryImg = galleryImages.find(g => g.id === obs.images?.[0]?.id)
                ?? newGalleryImages.find(g => g.id === obs.images?.[0]?.id);
              const imageUrls = (obs.images || []).map(i => i.url);
              const imageNotes = (obs.images || [])
                .map(() => galleryImg?.pilotNote || '')
                .filter(n => n.length > 0);
              const matchedEvent = galleryImg?.detectionLabel ?? undefined;

              const result = await assistSection({
                target: 'observation_description',
                currentDraft: '',
                agent: firstAgent,
                site: selectedSiteObjects[0],
                report,
                template: selectedTpl,
                observation: {
                  number: obs.number,
                  title: obs.title,
                  severity: obs.severity,
                  imageLabels: (obs.images || []).map(i => i.label),
                  imageUrls,
                  detectionLabel: matchedEvent ?? null,
                  pilotContext: obs.pilotContext || '',
                  imageNotes,
                  matchedEvent,
                },
              });

              return { obsId: obs.id, content: result.content };
            }));

            for (const r of results) {
              if (r.status === 'fulfilled' && r.value.content) {
                enrichedMap.set(r.value.obsId, { aiDescription: r.value.content });
              } else if (r.status === 'rejected' && (r.reason as AiError)?.type === 'credit_limit') {
                creditLimitHit = true;
              }
            }
            done += batch.length;
            updateStep('enrich', { status: 'running', detail: `${Math.min(done, toEnrich.length)}/${toEnrich.length}` });

            if (creditLimitHit) {
              console.warn('[enrich] credit limit — halting enrichment pass');
              break;
            }
          }

          report.observations = report.observations.map(obs => {
            const patch = enrichedMap.get(obs.id);
            return patch ? { ...obs, ...patch } : obs;
          });

          const succeeded = enrichedMap.size;
          const failed = toEnrich.length - succeeded;
          updateStep('enrich', {
            status: succeeded > 0 ? 'done' : 'skipped',
            detail: succeeded > 0
              ? `${succeeded} narratives generated${failed > 0 ? `, ${failed} kept original` : ''}`
              : 'Could not enrich — using fallback narratives',
          });
        }
      } else {
        updateStep('enrich', { status: 'skipped', detail: 'Narrative step skipped' });
        const reportId = `report-${Date.now()}`;
        const today = new Date().toISOString().slice(0, 10);
        report = {
          id: reportId,
          title: buildReportTitle(siteNameJoined),
          profile: mode === 'shift' ? 'shift_summary' : mode === 'incident' ? 'incident' : 'full_operational',
          status: 'draft_ready',
          siteName: siteNameJoined,
          date: mode === 'shift' ? shiftDate : mode === 'incident' ? incidentDate : today,
          author: 'Current User',
          missionCount: selectedFlights.length,
          executiveSummary: mode === 'incident' ? incidentDescription : '',
          observations: forensicObservations,
          shortTermRecommendations: [],
          longTermRecommendations: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          agentId: firstAgentId,
          agentName: firstAgent.name,
          templateId: selectedTemplateId,
          flightIds: selectedFlights,
          droneName: null,
          missionName: apiFlightLogs.find((f) => f.flight_id === selectedFlights[0])?.missions?.[0]?.mission_name ?? null,
          sections: selectedTpl.sections
            .filter((s) => s.enabled)
            .sort((a, b) => a.order - b.order)
            .map((tplSec, idx) => ({
              id: `rs-${reportId}-${idx}`,
              templateSectionId: tplSec.id,
              kind: templateSectionToKind(tplSec.name),
              name: tplSec.name,
              content: '',
              order: tplSec.order,
              enabled: true,
            })),
        };
      }

      addReport(report);
      updateStep('finalize', { status: 'done' });
      setIsGenerating(false);
      navigate({ to: '/report/$reportId', params: { reportId: report.id } as never });
    } catch (err: unknown) {
      if ((err as Error)?.message === 'cancelled') {
        setIsGenerating(false);
        return;
      }
      const msg = (err as { message?: string })?.message || 'Generation failed';
      console.error('[generation pipeline] error:', err);
      setGenerationError(msg);
      setGenerationSteps((prev) =>
        prev.map((s) => (s.status === 'running' ? { ...s, status: 'error' } : s))
      );
    }
  }, [
    selectedAgentIds, allAgents, templates, selectedTemplateId,
    sites, selectedSiteIds, selectedFlights, mode,
    shiftDate, incidentDate, incidentDescription,
    httpClient, galleryImages, addGalleryImages, addReport, navigate,
    buildReportTitle, updateStep, apiFlightLogs,
  ]);

  const proceedWithGeneration = useCallback(() => {
    if (demoMode) handleGenerateDemo();
    else handleGenerateReal();
  }, [demoMode, handleGenerateDemo, handleGenerateReal]);

  const missingContextFlightIds = useMemo(
    () =>
      selectedFlights.filter((fid) => {
        const ctx = flightContexts[fid];
        return !ctx || ctx.wordCount === 0;
      }),
    [selectedFlights, flightContexts]
  );

  const handleGenerate = useCallback(() => {
    if (missingContextFlightIds.length > 0) {
      setShowContextCheck(true);
    } else {
      proceedWithGeneration();
    }
  }, [missingContextFlightIds, proceedWithGeneration]);

  const handleCancelGeneration = useCallback(() => {
    cancelledRef.current = true;
    setIsGenerating(false);
    setGenerationError(null);
  }, []);

  // Focus trap + escape
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && status !== 'generating') onClose();
    };
    dialog.addEventListener('keydown', handleKeyDown);
    return () => dialog.removeEventListener('keydown', handleKeyDown);
  }, [status, onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (status === 'generating') return;
      if (e.target === e.currentTarget) onClose();
    },
    [onClose, status]
  );

  const inputClass =
    'bg-[#1C1C1F] border border-white/[0.08] rounded-lg text-[14px] text-white/[0.85] px-3 py-2.5 w-full focus:outline-none focus:border-primary-200/40 focus:ring-1 focus:ring-primary-200/10 transition-colors duration-150 placeholder:text-white/[0.25] [color-scheme:dark]';

  return (
    <motion.div
      variants={shouldReduce ? undefined : overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="New report"
    >
      <motion.div
        ref={dialogRef}
        variants={shouldReduce ? undefined : panelVariants}
        className="max-w-2xl w-full bg-[#161618] rounded-xl border border-white/[0.10] p-8 max-h-[90vh] flex flex-col overflow-hidden"
        style={{ boxShadow: `${cardInset}, 0 8px 32px rgba(0,0,0,0.5)` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <p className="text-[18px] font-semibold text-white/[0.92]">New report</p>
          <button
            onClick={onClose}
            disabled={status === 'generating'}
            className="text-white/[0.35] hover:text-white/[0.70] transition-colors duration-150 rounded p-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>
        <p className="text-[13px] text-white/[0.42] mb-6">Select parameters and generate your report</p>

        {status === 'configuring' && sitesLoading ? (
          <div className="py-12 flex flex-col items-center text-center">
            <i className="fa-solid fa-circle-notch fa-spin text-white/[0.50] text-xl mb-3" aria-hidden="true" />
            <p className="text-[13px] text-white/[0.45]">Loading sites…</p>
          </div>
        ) : status === 'configuring' && sites.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[14px] text-white/[0.55] mb-2">No sites configured</p>
            <p className="text-[13px] text-white/[0.35] mb-4">Create a site before generating a report.</p>
            <button
              onClick={() => { onClose(); navigate({ to: '/sites' as never }); }}
              className="bg-primary-200 text-white px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-primary-100 transition-colors duration-150 cursor-pointer"
            >
              Go to Sites
            </button>
          </div>
        ) : status === 'configuring' && (
          <div className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.12) transparent' }}>

            {/* ─── SECTION 1: SITES ─── */}
            <div>
              <div className="mb-2">
                <p className="text-[11px] uppercase tracking-wider text-white/[0.30] font-medium">Sites</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {sites.map((site) => {
                  const selected = selectedSiteIds.includes(site.id);
                  return (
                    <button
                      key={site.id}
                      onClick={() => toggleSite(site.id)}
                      className={`rounded-lg px-3 py-1.5 text-[13px] cursor-pointer transition-all duration-150 ${focusRingClass} ${
                        selected
                          ? 'bg-primary-200/10 border border-primary-200/30 text-primary-200'
                          : 'bg-[#1C1C1F] border border-white/[0.08] text-white/[0.50] hover:border-white/[0.15]'
                      }`}
                    >
                      {site.name}
                      {selected && <i className="fa-solid fa-xmark text-[10px] ml-2 opacity-60" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ─── INCIDENT DETAILS (before flights) ─── */}
            {mode === 'incident' && (
              <div className="mt-6">
                <p className="text-[11px] uppercase tracking-wider text-white/[0.30] font-medium mb-2">Incident details</p>
                <div className="mb-4">
                  <label className="text-[12px] text-white/[0.45] font-medium block mb-1">Incident title</label>
                  <input
                    type="text"
                    value={incidentTitle}
                    onChange={(e) => setIncidentTitle(e.target.value)}
                    placeholder="e.g. Unauthorized vehicle at east gate"
                    className={inputClass}
                  />
                </div>
                <div className="flex gap-3 mb-4">
                  <div className="flex-1">
                    <label className="text-[12px] text-white/[0.45] font-medium block mb-1">Incident date</label>
                    <input type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} className={inputClass} />
                  </div>
                  <div className="flex-1">
                    <label className="text-[12px] text-white/[0.45] font-medium block mb-1">Approximate time</label>
                    <input type="time" value={incidentTime} onChange={(e) => setIncidentTime(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div className="mb-2">
                  <label className="text-[12px] text-white/[0.45] font-medium block mb-1">
                    What happened
                    <span className="text-white/[0.30] font-normal ml-1">— brief summary</span>
                  </label>
                  <textarea
                    value={incidentDescription}
                    onChange={(e) => setIncidentDescription(e.target.value)}
                    placeholder="Describe what occurred — this becomes the starting context for the report"
                    rows={3}
                    className={`${inputClass} resize-y min-h-[80px]`}
                  />
                </div>
              </div>
            )}

            {/* ─── SECTION 2: FLIGHTS ─── */}
            {selectedSiteIds.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] uppercase tracking-wider text-white/[0.30] font-medium">
                    {mode === 'incident' ? 'Flights during incident' : 'Flights'}
                  </p>
                  {mode === 'incident' && (
                    <span className="text-[11px] text-white/[0.35]">
                      Select the flight(s) that captured the incident
                    </span>
                  )}
                </div>
                {mode === 'shift' ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={() => setShiftType('day')}
                        className={`rounded-lg px-3 py-1.5 text-[13px] transition-all duration-150 ${focusRingClass} cursor-pointer ${
                          shiftType === 'day'
                            ? 'bg-white/[0.08] text-white/[0.88] border border-white/[0.10]'
                            : 'text-white/[0.42] hover:text-white/[0.65] hover:bg-white/[0.04] border border-transparent'
                        }`}
                      >
                        Day shift (06:00–18:00)
                      </button>
                      <button
                        onClick={() => setShiftType('night')}
                        className={`rounded-lg px-3 py-1.5 text-[13px] transition-all duration-150 ${focusRingClass} cursor-pointer ${
                          shiftType === 'night'
                            ? 'bg-white/[0.08] text-white/[0.88] border border-white/[0.10]'
                            : 'text-white/[0.42] hover:text-white/[0.65] hover:bg-white/[0.04] border border-transparent'
                        }`}
                      >
                        Night shift (18:00–06:00)
                      </button>
                    </div>
                    <div className="mb-2">
                      <label className="text-[12px] text-white/[0.45] font-medium block mb-1">Date</label>
                      <input type="date" value={shiftDate} onChange={(e) => setShiftDate(e.target.value)} className={`${inputClass} cursor-pointer hover:border-white/[0.16]`} />
                    </div>
                  </>
                ) : (
                  <WizardFlightsStep
                    selectedFlights={selectedFlights}
                    onChange={setSelectedFlights}
                    apiFlights={apiFlightLogs}
                    isLoading={flightsLoading}
                    dateRange={flightDateRange}
                    onDateRangeChange={setFlightDateRange}
                  />
                )}
              </div>
            )}

            {/* ─── SECTION 3: AGENTS ─── */}
            <div className="mt-6">
              <p className="text-[11px] uppercase tracking-wider text-white/[0.30] font-medium mb-2">Agents</p>
              <div className="flex flex-wrap gap-2">
                {activeAgents.map((agent) => {
                  const selected = selectedAgentIds.includes(agent.id);
                  return (
                    <button
                      key={agent.id}
                      onClick={() => toggleAgent(agent.id)}
                      className={`rounded-lg px-3 py-1.5 text-[13px] cursor-pointer transition-all duration-150 ${focusRingClass} flex items-center ${
                        selected
                          ? 'bg-primary-200/10 border border-primary-200/30 text-primary-200'
                          : 'bg-[#1C1C1F] border border-white/[0.08] text-white/[0.50] hover:border-white/[0.15]'
                      }`}
                    >
                      <i className={`${agent.icon} text-[11px] mr-1.5`} />
                      {agent.name}
                      <span className="text-[10px] bg-white/[0.06] rounded px-1 py-0.5 ml-2 capitalize">{agent.domain}</span>
                      {selected && <i className="fa-solid fa-xmark text-[10px] ml-2 opacity-60" />}
                    </button>
                  );
                })}
                {activeAgents.length === 0 && (
                  <p className="text-[13px] text-white/[0.30]">No active agents available</p>
                )}
              </div>
            </div>

            {/* ─── SECTION 4: TEMPLATE ─── */}
            <div className="mt-6">
              <p className="text-[11px] uppercase tracking-wider text-white/[0.30] font-medium mb-2">Template</p>
              <div className="flex flex-col gap-2">
                {templates.map((tpl) => {
                  const selected = selectedTemplateId === tpl.id;
                  const enabledSections = tpl.sections.filter((s) => s.enabled).length;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => setSelectedTemplateId(tpl.id)}
                      className={`bg-[#1C1C1F] border rounded-xl p-3.5 cursor-pointer transition-all duration-150 ${focusRingClass} flex items-center gap-3 text-left w-full ${
                        selected
                          ? 'border-primary-200/30 bg-primary-200/[0.04]'
                          : 'border-white/[0.06] hover:border-white/[0.12]'
                      }`}
                    >
                      {/* Radio dot */}
                      <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                        selected ? 'border-primary-200 bg-primary-200' : 'border-white/[0.20]'
                      }`}>
                        {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-medium text-white/[0.80]">{tpl.name}</span>
                          <span className="text-[11px] text-white/[0.35]">{enabledSections} sections</span>
                        </div>
                        <p className="text-[12px] text-white/[0.35] mt-0.5 truncate">{tpl.description}</p>
                      </div>
                      {/* Default badge */}
                      {tpl.isDefault && (
                        <span className="text-[11px] font-medium bg-primary-200/10 text-primary-200 rounded-md px-1.5 py-0.5 flex-shrink-0">
                          ★ Default
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Generating ─── */}
        {status === 'generating' && (
          <motion.div initial={shouldReduce ? undefined : { opacity: 0 }} animate={shouldReduce ? undefined : { opacity: 1 }} className="py-12 flex flex-col items-center text-center">
            <i className="fa-solid fa-circle-notch fa-spin text-white/[0.50] text-xl mb-4" aria-hidden="true" />
            <p className="text-[14px] font-medium text-white/[0.85] mb-1">Creating your report</p>
            <p className="text-[13px] text-white/[0.42] max-w-[42ch]">
              Setting up an empty report from your template. You'll add observations and generate content in the editor.
            </p>
          </motion.div>
        )}

        {/* ── Footer ─── */}
        {status === 'configuring' && (
          <div className="border-t border-white/[0.05] mt-6 pt-4 flex-shrink-0">
            <p className="text-[12px] text-white/[0.30] mb-3">
              {selectedSiteNames.length} site{selectedSiteNames.length !== 1 ? 's' : ''} ·{' '}
              {mode === 'shift'
                ? 'shift window'
                : `${selectedFlights.length} flight${selectedFlights.length !== 1 ? 's' : ''}`}
              {' · '}{selectedAgentIds.length} agent{selectedAgentIds.length !== 1 ? 's' : ''}
              {' · '}{selectedTemplate?.name ?? 'No template'}
            </p>
            <div className="flex items-center justify-between">
              {!demoMode ? (
                <button
                  onClick={handleTryDemoInstead}
                  className="text-[12px] text-white/[0.40] hover:text-white/[0.70] flex items-center gap-1.5 cursor-pointer transition-colors duration-150"
                >
                  <i className="fa-solid fa-wand-magic-sparkles text-[10px]" />
                  Or try a demo report instead
                </button>
              ) : <div />}
              <div className="flex gap-3">
                <button onClick={onClose} className={`text-white/[0.50] hover:text-white/[0.75] px-4 py-2 rounded-lg transition-colors duration-150 ${focusRingClass} cursor-pointer`}>
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className={`bg-primary-200 text-white font-medium rounded-lg py-2.5 px-5 hover:bg-primary-100 transition-colors duration-150 ${focusRingClass} disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer`}
                >
                  <i className="fa-solid fa-plus text-xs" />
                  Create report
                </button>
              </div>
            </div>
            {!canGenerate && (sites.length === 0 || activeAgents.length === 0 || templates.length === 0) && (
              <p className="text-[12px] text-caution-30 text-right mt-2">
                {sites.length === 0 && 'Add a site to continue. '}
                {activeAgents.length === 0 && 'Activate an agent to continue. '}
                {templates.length === 0 && 'Create a template to continue.'}
              </p>
            )}
          </div>
        )}
      </motion.div>

      {showContextCheck && (
        <ContextCheckStep
          selectedFlights={selectedFlights}
          flights={apiFlightLogs}
          wizardState={{
            siteIds: selectedSiteIds,
            agentId: selectedAgentIds[0] ?? null,
            templateId: selectedTemplateId || null,
          }}
          currentPath={location.pathname}
          onGenerateAnyway={() => {
            setShowContextCheck(false);
            proceedWithGeneration();
          }}
          onCancel={() => setShowContextCheck(false)}
        />
      )}

      <ReportGenerationModal
        open={isGenerating}
        steps={generationSteps}
        currentStepIndex={generationSteps.findIndex((s) => s.status === 'running')}
        error={generationError}
        onCancel={handleCancelGeneration}
      />
    </motion.div>
  );
};

export default CreateReportWizard;
