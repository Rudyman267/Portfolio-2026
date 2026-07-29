import { supabase } from '@/integrations/supabase/client';
import type { Agent, Site, ReportTemplate, Report, Observation, Severity, ObservationStatus, ReportSection, FlightContext } from '../types/report.types';
import { templateSectionToKind } from '../types/report.types';
import type { GalleryImage } from '../components/reports/MediaGallery';
import { useReportStore } from '../store/report.store';
import { demoAssistSection, demoGenerateFullReport, demoFillSiteContext } from './demo-ai-service';

function resolveImageUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('data:') || url.startsWith('http') || url.startsWith('blob:')) return url;
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${url.startsWith('/') ? url : '/' + url}`;
  }
  return url;
}

export interface GenerateFullReportArgs {
  agent: Agent;
  template: ReportTemplate;
  sites: Site[];
  flights: Array<{ id: string; missionName: string; droneName: string; timestamp: string }>;
  galleryImages: GalleryImage[];
  flightContexts?: FlightContext[];
}

export interface AiError {
  type: 'credit_limit' | 'context_length' | 'network' | 'parse' | 'unknown';
  message: string;
}

export interface GeneratedReportData {
  title: string;
  executiveSummary: string;
  observations: Array<{
    title: string;
    severity: Severity;
    status: ObservationStatus;
    aiDescription: string;
    imageIds: string[];
    confidence: number;
    // Depth-mode fields (present only when template persona is inspection/compliance-oriented)
    impactAssessment?: string;
    assetId?: string;
    imageSubheader?: string;
  }>;
  sectionContents: Record<string, string>;
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

// ─── Site context fill ──────────────────────────────────────────────────

export interface SiteContextFillInput {
  name: string;
  coordinates: { lat: number; lng: number };
  deviceCount: number;
  missionCount: number;
  missionNames: string[];
}

export interface SiteContextFillResult {
  description: string;
  siteType: string;
  timezone: string;
  operatingHours: string;
  location: string;
  context: string;
}

async function realFillSiteContext(input: SiteContextFillInput): Promise<SiteContextFillResult> {
  const payload = { mode: 'site_context_fill', siteData: input };
  const { data, error } = await supabase.functions.invoke('generate-report', { body: payload });

  if (error) {
    if (error.message?.toLowerCase().includes('credit') || error.message?.includes('429')) {
      throw { type: 'credit_limit', message: 'Credit limit reached' } as AiError;
    }
    throw { type: 'network', message: error.message ?? 'Network error' } as AiError;
  }

  if (!data?.ok) {
    if (data?.error === 'credit_limit') {
      throw { type: 'credit_limit', message: data.message ?? 'Credit limit reached' } as AiError;
    }
    throw { type: 'unknown', message: data?.message ?? data?.error ?? 'Unknown error' } as AiError;
  }

  return data.data as SiteContextFillResult;
}

async function realGenerateFullReport(args: GenerateFullReportArgs): Promise<GeneratedReportData> {
  const { agent, template, sites, flights, galleryImages } = args;

  // Fold per-image pilot notes from FlightContext.imageNotes into the gallery's pilotNote field.
  // If an image already has a pilotNote, concatenate with a separator.
  const imageNoteMap = new Map<string, string>();
  for (const ctx of args.flightContexts ?? []) {
    for (const [mediaId, note] of Object.entries(ctx.imageNotes)) {
      if (note?.trim()) imageNoteMap.set(mediaId, note.trim());
    }
  }

  const enrichedGalleryImages = galleryImages.map((img) => {
    const hitlNote = imageNoteMap.get(img.id);
    if (!hitlNote) return img;
    const combined = img.pilotNote?.trim()
      ? `${img.pilotNote.trim()} — ${hitlNote}`
      : hitlNote;
    return { ...img, pilotNote: combined };
  });

  const payload = {
    mode: 'full_report',
    agent: {
      name: agent.name,
      domain: agent.domain,
      description: agent.description,
      tone: agent.config.tone,
      analysisDepth: agent.config.analysisDepth,
      detectionEvents: agent.config.detectionEvents.map(e => ({
        name: e.name,
        description: e.description,
        defaultSeverity: e.defaultSeverity,
        enabled: e.enabled,
        compareHistorical: e.compareHistorical,
      })),
    },
    template: {
      name: template.name,
      description: template.description,
      sections: template.sections
        .filter(s => s.enabled)
        .map(s => ({
          id: s.id,
          name: s.name,
          description: s.description,
          promptInstruction: s.promptInstruction,
          order: s.order,
          maxLength: s.maxLength,
          toneOverride: s.toneOverride,
        })),
      persona: template.persona,
      narrativeStyle: template.narrativeStyle,
      sampleObservations: template.sampleObservations,
      sampleExecutiveSummary: template.sampleExecutiveSummary,
    },
    sites: sites.map(s => ({
      name: s.name,
      description: s.description,
      location: s.location,
      siteType: s.siteType,
      context: s.context,
      assets: s.assets.map(a => ({ name: a.name, type: a.type, description: a.description })),
    })),
    flights,
    galleryImages: enrichedGalleryImages
      .filter(img => !img.url?.startsWith('blob:'))
      .map(img => ({
        id: img.id,
        url: resolveImageUrl(img.url),
        filename: img.filename || `${img.id}.jpg`,
        timestamp: img.timestamp,
        flightName: img.flightName,
        droneName: img.droneName,
        siteName: img.siteName || '',
        hasDetection: img.hasDetection,
        detectionLabel: img.detectionLabel,
        detectionConfidence: img.detectionConfidence || null,
        gpsLat: img.gpsLat,
        gpsLng: img.gpsLng,
        altitudeM: img.altitudeM,
        pilotNote: img.pilotNote || '',
      })),
    flightContexts: (args.flightContexts ?? [])
      .filter((ctx) => ctx.text.trim() || Object.keys(ctx.imageNotes).length > 0)
      .map((ctx) => {
        const matchedFlight = args.flights.find((f) => f.id === ctx.flightId);
        return {
          flightId: ctx.flightId,
          flightLabel: matchedFlight
            ? `${matchedFlight.missionName} (${matchedFlight.droneName}, ${matchedFlight.timestamp})`
            : `Flight ${ctx.flightId.slice(0, 8)}`,
          captureMode: ctx.captureMode,
          text: ctx.text.trim(),
          imageNoteCount: Object.keys(ctx.imageNotes).length,
        };
      }),
  };

  const { data, error } = await supabase.functions.invoke('generate-report', { body: payload });

  if (error) {
    if (error.message?.toLowerCase().includes('credit') || error.message?.includes('429')) {
      throw { type: 'credit_limit', message: 'Credit limit reached' } as AiError;
    }
    throw { type: 'network', message: error.message ?? 'Network error' } as AiError;
  }

  if (!data?.ok) {
    if (data?.error === 'credit_limit') {
      throw { type: 'credit_limit', message: data.message ?? 'Credit limit reached' } as AiError;
    }
    if (data?.error === 'context_length') {
      throw { type: 'context_length', message: data.message ?? 'Report too complex for current model' } as AiError;
    }
    throw { type: 'unknown', message: data?.message ?? data?.error ?? 'Unknown error' } as AiError;
  }

  return data.data as GeneratedReportData;
}

// ─── Section assist ─────────────────────────────────────────────────────

export type SectionAssistTarget = 'executive_summary' | 'perimeter_status' | 'compliance' | 'custom' | 'observation_description' | 'recommendations';

export interface SectionAssistArgs {
  target: SectionAssistTarget;
  sectionName?: string;
  promptInstruction?: string;
  maxLength?: string;
  toneOverride?: string;
  currentDraft?: string;
  agent: Agent;
  site: Site;
  report: Report;
  template?: ReportTemplate;
  observation?: {
    number: number;
    title: string;
    severity: string;
    imageLabels: string[];
    imageUrls?: string[];
    detectionLabel: string | null;
    pilotContext?: string;
    imageNotes?: string[];
    matchedEvent?: string;  // name of the agent detection event this observation matched
  };
}

const MAX_TOTAL_IMAGE_BYTES = 4_500_000;

async function realAssistSection(args: SectionAssistArgs): Promise<{ content?: string; immediate?: string[]; shortTerm?: string[]; longTerm?: string[] }> {
  // Cap observation images before sending to avoid worker resource limits
  if (args.observation?.imageUrls) {
    let totalBytes = 0;
    const keptUrls: string[] = [];
    for (const u of args.observation.imageUrls) {
      if (!u) continue;
      const size = u.startsWith('data:') ? u.length : 1000;
      if (totalBytes + size > MAX_TOTAL_IMAGE_BYTES) {
        console.warn('Dropping oversized image from AI request:', size);
        continue;
      }
      totalBytes += size;
      keptUrls.push(u);
    }
    args.observation.imageUrls = keptUrls;
  }

  const payload = {
    mode: 'section_assist',
    target: args.target,
    sectionName: args.sectionName,
    promptInstruction: args.promptInstruction,
    maxLength: args.maxLength,
    toneOverride: args.toneOverride,
    currentDraft: args.currentDraft,
    agent: {
      name: args.agent.name,
      domain: args.agent.domain,
      description: args.agent.description,
      tone: args.agent.config.tone,
      analysisDepth: args.agent.config.analysisDepth,
      detectionEvents: args.agent.config.detectionEvents.map(e => ({
        name: e.name,
        description: e.description,
        defaultSeverity: e.defaultSeverity,
        enabled: e.enabled,
        compareHistorical: e.compareHistorical,
      })),
    },
    site: {
      name: args.site.name,
      description: args.site.description,
      location: args.site.location,
      siteType: args.site.siteType,
      context: args.site.context,
      assets: args.site.assets.map(a => ({ name: a.name, type: a.type, description: a.description })),
    },
    reportContext: {
      title: args.report.title,
      siteName: args.report.siteName,
      executiveSummary: args.report.executiveSummary,
      observations: args.report.observations.map(o => ({
        number: o.number,
        title: o.title,
        severity: o.severity,
        confidence: o.confidence,
        imageLabels: (o.images || []).map(i => i.label),
      })),
    },
    templatePersona: args.template?.persona
      ? {
          role: args.template.persona.role,
          primaryUse: args.template.persona.primaryUse,
          priorities: args.template.persona.priorities,
        }
      : undefined,
    templateNarrativeStyle: args.template?.narrativeStyle,
    observation: args.observation
      ? {
          ...args.observation,
          imageUrls: args.observation.imageUrls?.map(resolveImageUrl),
        }
      : undefined,
  };

  const { data, error } = await supabase.functions.invoke('generate-report', { body: payload });

  if (error) {
    if (error.message?.toLowerCase().includes('credit') || error.message?.includes('429')) {
      throw { type: 'credit_limit', message: 'Credit limit reached' } as AiError;
    }
    throw { type: 'network', message: error.message ?? 'Network error' } as AiError;
  }

  if (!data?.ok) {
    if (data?.error === 'credit_limit') {
      throw { type: 'credit_limit', message: data.message ?? 'Credit limit reached' } as AiError;
    }
    if (data?.error === 'context_length') {
      throw { type: 'context_length', message: data.message ?? 'Report too complex for current model' } as AiError;
    }
    throw { type: 'unknown', message: data?.message ?? data?.error ?? 'Unknown error' } as AiError;
  }

  return data.data;
}

// ─── Converter: LLM output → Report object ──────────────────────────────

export function llmOutputToReport(
  output: GeneratedReportData,
  args: {
    agent: Agent;
    template: ReportTemplate;
    sites: Site[];
    flights: Array<{ id: string; missionName: string; droneName: string; timestamp: string }>;
    galleryImages: GalleryImage[];
    author: string;
  }
): Report {
  const reportId = `report-${Date.now()}`;
  const today = new Date().toISOString().slice(0, 10);

  const observations: Observation[] = (output.observations || []).map((o, i) => {
    const linkedImages = (o.imageIds || [])
      .map(id => args.galleryImages.find(g => g.id === id))
      .filter((img): img is GalleryImage => !!img)
      .map((img, idx) => ({
        id: img.id,
        url: img.url,
        label: idx === 0 ? 'Raw capture' : idx === 1 ? 'AI annotated' : `Image ${idx + 1}`,
        timestamp: img.timestamp,
        confidence: img.detectionConfidence || undefined,
      }));

    return {
      id: `obs-${reportId}-${i + 1}`,
      number: i + 1,
      title: o.title,
      severity: o.severity,
      status: o.status,
      aiDescription: o.aiDescription,
      impactAssessment: o.impactAssessment,
      assetId: o.assetId,
      imageSubheader: o.imageSubheader,
      pilotContext: linkedImages
        .map((img) => args.galleryImages.find((g) => g.id === img.id)?.pilotNote)
        .filter((n) => n && n.trim().length > 0)
        .join(' · ') || null,
      rawImageUrl: linkedImages[0]?.url ?? null,
      annotatedImageUrl: linkedImages[1]?.url ?? null,
      images: linkedImages,
      imageCaption: linkedImages[0] ? `${linkedImages[0].label} — ${linkedImages[0].timestamp}` : '',
      confidence: o.confidence,
      timestamp: linkedImages[0]?.timestamp?.slice(0, 5) || '—',
    };
  });

  const sections: ReportSection[] = args.template.sections
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order)
    .map((tplSec, idx) => {
      const kind = templateSectionToKind(tplSec.name);
      let content = '';
      if (kind === 'executive_summary') content = output.executiveSummary;
      else if (kind === 'patrol_overview' || kind === 'observations' || kind === 'recommendations') content = '';
      else content = output.sectionContents?.[tplSec.id] || '';
      return {
        id: `rs-${reportId}-${idx}`,
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
    title: output.title || 'Untitled Report',
    profile: 'full_operational',
    status: 'draft_ready',
    siteName: args.sites.map(s => s.name).join(', '),
    date: today,
    author: args.author,
    missionCount: args.flights.length,
    executiveSummary: output.executiveSummary || '',
    observations,
    shortTermRecommendations: [...(output.recommendations?.immediate || []), ...(output.recommendations?.shortTerm || [])],
    longTermRecommendations: output.recommendations?.longTerm || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    agentId: args.agent.id,
    agentName: args.agent.name,
    templateId: args.template.id,
    flightIds: args.flights.map(f => f.id),
    droneName: args.flights[0]?.droneName || null,
    missionName: args.flights[0]?.missionName || null,
    sections,
  };
}

// ─── Demo-aware dispatchers ─────────────────────────────────────────

export async function assistSection(
  args: SectionAssistArgs
): Promise<{ content?: string; immediate?: string[]; shortTerm?: string[]; longTerm?: string[] }> {
  const { demoMode } = useReportStore.getState();
  if (demoMode) return demoAssistSection(args);
  return realAssistSection(args);
}

export async function generateFullReport(args: GenerateFullReportArgs): Promise<GeneratedReportData> {
  const { demoMode } = useReportStore.getState();
  if (demoMode) return demoGenerateFullReport() as Promise<GeneratedReportData>;
  return realGenerateFullReport(args);
}

export async function fillSiteContext(input: SiteContextFillInput): Promise<SiteContextFillResult> {
  const { demoMode } = useReportStore.getState();
  if (demoMode) return demoFillSiteContext() as Promise<SiteContextFillResult>;
  return realFillSiteContext(input);
}
