import { create } from 'zustand';
import {
  Report,
  DraftReport,
  Agent,
  AgentDetectionEvent,
  AgentStatus,
  ReportTemplate,
  TemplateSection,
  templateSectionToKind,
  Site,
  SiteAsset,
} from '../types/report.types';
import { SECTION_KIND_DEFAULTS } from '../data/section-kind-defaults';
import { FlightContext, LiveFlight, WebhookFlightEvent, WizardResumeState } from '../types/report.types';
import { mockReports, mockDrafts } from '../data/mock-reports';
import { mockAgents } from '../data/mock-agents';
import { mockTemplates } from '../data/mock-templates';
import { mockSites } from '../data/mock-sites';
import type { GalleryImage } from '../components/reports/MediaGallery';
import { initialMockGalleryImages } from '../components/reports/MediaGallery';
import { DEMO_SITE, DEMO_AGENT, DEMO_GALLERY_IMAGES, buildDemoReport } from '../data/demo-scenario';
import {
  fetchAgents,
  fetchTemplates,
  fetchReports,
  upsertAgent,
  upsertTemplate,
  upsertReport,
  deleteAgentDb,
  deleteTemplateDb,
  deleteReportDb,
  mapAgentRow,
  mapTemplateRow,
  mapReportRow,
  fetchFlightContexts,
  upsertFlightContext,
  deleteFlightContextDb,
  mapFlightContextRow,
} from '../api/supabase-persistence';

interface ReportStore {
  reports: Report[];
  drafts: DraftReport[];
  agents: Agent[];
  templates: ReportTemplate[];
  sites: Site[];
  selectedReport: Report | null;
  selectedAgent: Agent | null;
  selectedSite: Site | null;
  activeDraftCount: number;
  activeAgentCount: number;

  // Database sync
  isDbLoaded: boolean;
  currentOrgId: string | null;
  loadFromDatabase: (orgId: string) => Promise<void>;

  // Report actions
  setSelectedReport: (report: Report | null) => void;
  addReport: (report: Report) => void;
  updateReport: (id: string, updates: Partial<Report>) => void;
  deleteReport: (reportId: string) => void;
  deleteDraft: (draftId: string) => void;
  finalizeDraft: (draftId: string, report: Report) => void;

  // Agent actions
  setSelectedAgent: (agent: Agent | null) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (agentId: string, updates: Partial<Omit<Agent, 'id' | 'config'>>) => void;
  deleteAgent: (agentId: string) => void;
  updateAgentConfig: (agentId: string, config: Partial<Agent['config']>) => void;
  toggleDetectionEvent: (agentId: string, eventId: string) => void;
  addDetectionEvent: (agentId: string, event: AgentDetectionEvent) => void;
  updateDetectionEvent: (agentId: string, eventId: string, updates: Partial<AgentDetectionEvent>) => void;
  deleteDetectionEvent: (agentId: string, eventId: string) => void;
  updateAgentStatus: (agentId: string, status: AgentStatus) => void;

  // Template actions
  addTemplate: (template: ReportTemplate) => void;
  updateTemplate: (templateId: string, updates: Partial<ReportTemplate>) => void;
  deleteTemplate: (templateId: string) => void;
  addTemplateSection: (templateId: string, section: TemplateSection) => void;
  updateTemplateSection: (templateId: string, sectionId: string, updates: Partial<TemplateSection>) => void;
  deleteTemplateSection: (templateId: string, sectionId: string) => void;
  toggleTemplateSection: (templateId: string, sectionId: string) => void;
  reorderTemplateSections: (templateId: string, sectionId: string, direction: 'up' | 'down') => void;
  moveTemplateSection: (templateId: string, sectionId: string, newIndex: number) => void;

  // Site actions
  setSelectedSite: (site: Site | null) => void;
  addSite: (site: Site) => void;
  updateSite: (siteId: string, updates: Partial<Site>) => void;
  deleteSite: (siteId: string) => void;
  updateSiteContext: (siteId: string, context: string) => void;
  updateSiteImage: (siteId: string, imageUrl: string | null) => void;
  addSiteAsset: (siteId: string, asset: SiteAsset) => void;
  updateSiteAsset: (siteId: string, assetId: string, updates: Partial<SiteAsset>) => void;
  deleteSiteAsset: (siteId: string, assetId: string) => void;

  // Gallery actions
  galleryImages: GalleryImage[];
  addGalleryImages: (images: GalleryImage[]) => void;
  updateGalleryImageNote: (imageId: string, note: string) => void;
  updateGalleryImagesById: (updates: Map<string, Partial<GalleryImage>>) => void;

  // Flight contexts (HITL)
  flightContexts: Record<string, FlightContext>;
  setFlightContext: (flightId: string, patch: Partial<FlightContext> & { siteId: string }) => void;
  updateFlightContextText: (flightId: string, text: string) => void;
  updateFlightContextImageNote: (flightId: string, imageKey: string, note: string) => void;
  markContextComplete: (flightId: string, complete: boolean) => void;
  getFlightContext: (flightId: string) => FlightContext | undefined;
  clearFlightContext: (flightId: string) => void;

  // Live flights from webhooks
  liveFlights: Record<string, LiveFlight>;
  applyFlightEvent: (event: WebhookFlightEvent) => void;
  clearLiveFlights: () => void;

  // Wizard resume state
  wizardResumeState: WizardResumeState | null;
  setWizardResumeState: (s: WizardResumeState | null) => void;
  consumeWizardResumeState: () => WizardResumeState | null;

  // Demo mode
  demoMode: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
}

const FLIGHT_CTX_KEY = 'verkos-flight-contexts-v1';

function loadFlightContextsFromStorage(): Record<string, FlightContext> {
  try {
    const raw = localStorage.getItem(FLIGHT_CTX_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch { return {}; }
}

function saveFlightContextsToStorage(c: Record<string, FlightContext>): void {
  try { localStorage.setItem(FLIGHT_CTX_KEY, JSON.stringify(c)); }
  catch (e) { console.error('[Store] save failed:', e); }
}

function countWords(t: string): number {
  const s = t.trim();
  return s ? s.split(/\s+/).length : 0;
}

function totalWordCount(ctx: FlightContext): number {
  return countWords(ctx.text) + Object.values(ctx.imageNotes).reduce((a, n) => a + countWords(n), 0);
}

export const useReportStore = create<ReportStore>((set, get) => ({
  reports: mockReports,
  drafts: mockDrafts,
  agents: mockAgents,
  templates: mockTemplates,
  sites: mockSites,
  selectedReport: null,
  selectedAgent: null,
  selectedSite: null,
  galleryImages: initialMockGalleryImages,
  flightContexts: loadFlightContextsFromStorage(),
  liveFlights: {},
  wizardResumeState: null,
  demoMode: false,
  isDbLoaded: false,
  currentOrgId: null,
  get activeDraftCount() {
    return get().drafts.filter((d) => d.status === 'ready_for_review').length;
  },
  get activeAgentCount() {
    return get().agents.filter((a) => a.status === 'active').length;
  },

  // ─── Database sync ──────────────────────────────────────────────
  loadFromDatabase: async (orgId: string) => {
    try {
      const [agentRows, templateRows, reportRows, contextRows] = await Promise.all([
        fetchAgents(orgId),
        fetchTemplates(orgId),
        fetchReports(orgId),
        fetchFlightContexts(orgId),
      ]);

      let agents: Agent[];
      if (agentRows.length === 0) {
        agents = mockAgents;
        mockAgents.forEach((a) => {
          upsertAgent(orgId, a).catch((e) => console.error('[Store] seed agent error:', e));
        });
      } else {
        agents = agentRows.map(mapAgentRow) as Agent[];
      }

      let templates: ReportTemplate[];
      if (templateRows.length === 0) {
        templates = mockTemplates;
        mockTemplates.forEach((t) => {
          upsertTemplate(orgId, t).catch((e) =>
            console.error('[Store] seed template error:', e)
          );
        });
      } else {
        templates = templateRows.map(mapTemplateRow) as ReportTemplate[];
      }

      const reports = reportRows.map(mapReportRow) as Report[];

      const dbContexts = Object.fromEntries(
        contextRows.map((r) => {
          const m = mapFlightContextRow(r);
          return [m.flightId, m];
        })
      );
      const mergedContexts = { ...get().flightContexts, ...dbContexts };
      saveFlightContextsToStorage(mergedContexts);

      set({
        agents,
        templates,
        reports,
        flightContexts: mergedContexts,
        isDbLoaded: true,
        currentOrgId: orgId,
      });
    } catch (e) {
      console.error('[Store] loadFromDatabase failed:', e);
      set({ currentOrgId: orgId, isDbLoaded: true });
    }
  },

  // ─── Report ─────────────────────────────────────────────────────
  setSelectedReport: (report) => set({ selectedReport: report }),
  addReport: (report) => {
    set((s) => ({ reports: [report, ...s.reports] }));
    const orgId = get().currentOrgId;
    if (orgId) upsertReport(orgId, report).catch((e) => console.error('[Store] sync addReport:', e));
  },
  updateReport: (id, updates) => {
    set((s) => ({
      reports: s.reports.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }));
    const orgId = get().currentOrgId;
    if (orgId) {
      const report = get().reports.find((r) => r.id === id);
      if (report) upsertReport(orgId, report).catch((e) => console.error('[Store] sync updateReport:', e));
    }
  },
  deleteReport: (reportId) => {
    set((s) => ({
      reports: s.reports.filter((r) => r.id !== reportId),
    }));
    const orgId = get().currentOrgId;
    if (orgId) deleteReportDb(orgId, reportId).catch((e) => console.error('[Store] sync deleteReport:', e));
  },
  deleteDraft: (draftId) =>
    set((s) => ({
      drafts: s.drafts.filter((d) => d.id !== draftId),
    })),
  finalizeDraft: (draftId, report) => {
    set((s) => ({
      drafts: s.drafts.filter((d) => d.id !== draftId),
      reports: [report, ...s.reports],
    }));
    const orgId = get().currentOrgId;
    if (orgId) upsertReport(orgId, report).catch((e) => console.error('[Store] sync finalizeDraft:', e));
  },

  // ─── Agent ──────────────────────────────────────────────────────
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
  addAgent: (agent) => {
    set((s) => ({ agents: [...s.agents, agent] }));
    const orgId = get().currentOrgId;
    if (orgId) upsertAgent(orgId, agent).catch((e) => console.error('[Store] sync addAgent:', e));
  },
  updateAgent: (agentId, updates) => {
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === agentId ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
      ),
    }));
    const orgId = get().currentOrgId;
    if (orgId) {
      const a = get().agents.find((x) => x.id === agentId);
      if (a) upsertAgent(orgId, a).catch((e) => console.error('[Store] sync updateAgent:', e));
    }
  },
  deleteAgent: (agentId) => {
    set((s) => ({ agents: s.agents.filter((a) => a.id !== agentId) }));
    const orgId = get().currentOrgId;
    if (orgId) deleteAgentDb(orgId, agentId).catch((e) => console.error('[Store] sync deleteAgent:', e));
  },
  updateAgentStatus: (agentId, status) => {
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === agentId ? { ...a, status, updatedAt: new Date().toISOString() } : a
      ),
    }));
    const orgId = get().currentOrgId;
    if (orgId) {
      const a = get().agents.find((x) => x.id === agentId);
      if (a) upsertAgent(orgId, a).catch((e) => console.error('[Store] sync updateAgentStatus:', e));
    }
  },
  updateAgentConfig: (agentId, configUpdates) => {
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === agentId
          ? { ...a, config: { ...a.config, ...configUpdates }, updatedAt: new Date().toISOString() }
          : a
      ),
    }));
    const orgId = get().currentOrgId;
    if (orgId) {
      const a = get().agents.find((x) => x.id === agentId);
      if (a) upsertAgent(orgId, a).catch((e) => console.error('[Store] sync updateAgentConfig:', e));
    }
  },
  toggleDetectionEvent: (agentId, eventId) => {
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === agentId
          ? {
              ...a,
              config: {
                ...a.config,
                detectionEvents: a.config.detectionEvents.map((e) =>
                  e.id === eventId ? { ...e, enabled: !e.enabled } : e
                ),
              },
              updatedAt: new Date().toISOString(),
            }
          : a
      ),
    }));
    const orgId = get().currentOrgId;
    if (orgId) {
      const a = get().agents.find((x) => x.id === agentId);
      if (a) upsertAgent(orgId, a).catch((e) => console.error('[Store] sync toggleDetectionEvent:', e));
    }
  },
  addDetectionEvent: (agentId, event) => {
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === agentId
          ? {
              ...a,
              config: { ...a.config, detectionEvents: [...a.config.detectionEvents, event] },
              updatedAt: new Date().toISOString(),
            }
          : a
      ),
    }));
    const orgId = get().currentOrgId;
    if (orgId) {
      const a = get().agents.find((x) => x.id === agentId);
      if (a) upsertAgent(orgId, a).catch((e) => console.error('[Store] sync addDetectionEvent:', e));
    }
  },
  updateDetectionEvent: (agentId, eventId, updates) => {
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === agentId
          ? {
              ...a,
              config: {
                ...a.config,
                detectionEvents: a.config.detectionEvents.map((e) =>
                  e.id === eventId ? { ...e, ...updates } : e
                ),
              },
              updatedAt: new Date().toISOString(),
            }
          : a
      ),
    }));
    const orgId = get().currentOrgId;
    if (orgId) {
      const a = get().agents.find((x) => x.id === agentId);
      if (a) upsertAgent(orgId, a).catch((e) => console.error('[Store] sync updateDetectionEvent:', e));
    }
  },
  deleteDetectionEvent: (agentId, eventId) => {
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === agentId
          ? {
              ...a,
              config: {
                ...a.config,
                detectionEvents: a.config.detectionEvents.filter((e) => e.id !== eventId),
              },
              updatedAt: new Date().toISOString(),
            }
          : a
      ),
    }));
    const orgId = get().currentOrgId;
    if (orgId) {
      const a = get().agents.find((x) => x.id === agentId);
      if (a) upsertAgent(orgId, a).catch((e) => console.error('[Store] sync deleteDetectionEvent:', e));
    }
  },

  // ─── Template ───────────────────────────────────────────────────
  addTemplate: (template) => {
    set((s) => ({ templates: [...s.templates, template] }));
    const orgId = get().currentOrgId;
    if (orgId) upsertTemplate(orgId, template).catch((e) => console.error('[Store] sync addTemplate:', e));
  },
  updateTemplate: (templateId, updates) => {
    set((s) => ({
      templates: s.templates.map((t) =>
        t.id === templateId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      ),
    }));
    const orgId = get().currentOrgId;
    if (orgId) {
      const t = get().templates.find((x) => x.id === templateId);
      if (t) upsertTemplate(orgId, t).catch((e) => console.error('[Store] sync updateTemplate:', e));
    }
  },
  deleteTemplate: (templateId) => {
    set((s) => ({ templates: s.templates.filter((t) => t.id !== templateId) }));
    const orgId = get().currentOrgId;
    if (orgId) deleteTemplateDb(orgId, templateId).catch((e) => console.error('[Store] sync deleteTemplate:', e));
  },
  addTemplateSection: (templateId, section) => {
    const kind = section.kind ?? templateSectionToKind(section.name ?? '');
    const defaults = SECTION_KIND_DEFAULTS[kind];
    const normalized: TemplateSection = {
      ...section,
      kind,
      dataFeeds: section.dataFeeds ?? { ...defaults.dataFeeds },
    };
    set((s) => ({
      templates: s.templates.map((t) =>
        t.id === templateId
          ? { ...t, sections: [...t.sections, normalized], updatedAt: new Date().toISOString() }
          : t
      ),
    }));
    const orgId = get().currentOrgId;
    if (orgId) {
      const t = get().templates.find((x) => x.id === templateId);
      if (t) upsertTemplate(orgId, t).catch((e) => console.error('[Store] sync addTemplateSection:', e));
    }
  },
  updateTemplateSection: (templateId, sectionId, updates) => {
    set((s) => ({
      templates: s.templates.map((t) =>
        t.id === templateId
          ? {
              ...t,
              sections: t.sections.map((sec) =>
                sec.id === sectionId ? { ...sec, ...updates } : sec
              ),
              updatedAt: new Date().toISOString(),
            }
          : t
      ),
    }));
    const orgId = get().currentOrgId;
    if (orgId) {
      const t = get().templates.find((x) => x.id === templateId);
      if (t) upsertTemplate(orgId, t).catch((e) => console.error('[Store] sync updateTemplateSection:', e));
    }
  },
  deleteTemplateSection: (templateId, sectionId) => {
    set((s) => ({
      templates: s.templates.map((t) =>
        t.id === templateId
          ? {
              ...t,
              sections: t.sections
                .filter((sec) => sec.id !== sectionId)
                .sort((a, b) => a.order - b.order)
                .map((sec, i) => ({ ...sec, order: i + 1 })),
              updatedAt: new Date().toISOString(),
            }
          : t
      ),
    }));
    const orgId = get().currentOrgId;
    if (orgId) {
      const t = get().templates.find((x) => x.id === templateId);
      if (t) upsertTemplate(orgId, t).catch((e) => console.error('[Store] sync deleteTemplateSection:', e));
    }
  },
  toggleTemplateSection: (templateId, sectionId) => {
    set((s) => ({
      templates: s.templates.map((t) =>
        t.id === templateId
          ? {
              ...t,
              sections: t.sections.map((sec) =>
                sec.id === sectionId ? { ...sec, enabled: !sec.enabled } : sec
              ),
              updatedAt: new Date().toISOString(),
            }
          : t
      ),
    }));
    const orgId = get().currentOrgId;
    if (orgId) {
      const t = get().templates.find((x) => x.id === templateId);
      if (t) upsertTemplate(orgId, t).catch((e) => console.error('[Store] sync toggleTemplateSection:', e));
    }
  },
  reorderTemplateSections: (templateId, sectionId, direction) => {
    set((s) => ({
      templates: s.templates.map((t) => {
        if (t.id !== templateId) return t;
        const sorted = [...t.sections].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex((x) => x.id === sectionId);
        if (idx < 0) return t;
        if (direction === 'up' && idx === 0) return t;
        if (direction === 'down' && idx === sorted.length - 1) return t;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        const updated = sorted.map((sec, i) => {
          if (i === idx) return { ...sec, order: sorted[swapIdx].order };
          if (i === swapIdx) return { ...sec, order: sorted[idx].order };
          return sec;
        });
        return { ...t, sections: updated, updatedAt: new Date().toISOString() };
      }),
    }));
    const orgId = get().currentOrgId;
    if (orgId) {
      const t = get().templates.find((x) => x.id === templateId);
      if (t) upsertTemplate(orgId, t).catch((e) => console.error('[Store] sync reorderTemplateSections:', e));
    }
  },
  moveTemplateSection: (templateId, sectionId, newIndex) => {
    set((s) => ({
      templates: s.templates.map((t) => {
        if (t.id !== templateId) return t;
        const sorted = [...t.sections].sort((a, b) => a.order - b.order);
        const fromIdx = sorted.findIndex((x) => x.id === sectionId);
        if (fromIdx < 0 || newIndex < 0 || newIndex >= sorted.length) return t;
        const [moved] = sorted.splice(fromIdx, 1);
        sorted.splice(newIndex, 0, moved);
        const withOrder = sorted.map((sec, i) => ({ ...sec, order: i + 1 }));
        return { ...t, sections: withOrder, updatedAt: new Date().toISOString() };
      }),
    }));
    const orgId = get().currentOrgId;
    if (orgId) {
      const t = get().templates.find((x) => x.id === templateId);
      if (t) upsertTemplate(orgId, t).catch((e) => console.error('[Store] sync moveTemplateSection:', e));
    }
  },

  // ─── Site ────────────────────────────────────────────────────────
  setSelectedSite: (site) => set({ selectedSite: site }),
  addSite: (site) => set((s) => ({ sites: [...s.sites, site] })),
  updateSite: (siteId, updates) =>
    set((s) => ({
      sites: s.sites.map((site) =>
        site.id === siteId
          ? { ...site, ...updates, updatedAt: new Date().toISOString() }
          : site
      ),
    })),
  deleteSite: (siteId) =>
    set((s) => ({ sites: s.sites.filter((site) => site.id !== siteId) })),
  updateSiteContext: (siteId, context) =>
    set((s) => ({
      sites: s.sites.map((site) =>
        site.id === siteId ? { ...site, context, updatedAt: new Date().toISOString() } : site
      ),
    })),
  updateSiteImage: (siteId, imageUrl) =>
    set((s) => ({
      sites: s.sites.map((site) =>
        site.id === siteId ? { ...site, imageUrl, updatedAt: new Date().toISOString() } : site
      ),
    })),
  addSiteAsset: (siteId, asset) =>
    set((s) => ({
      sites: s.sites.map((site) =>
        site.id === siteId
          ? { ...site, assets: [...site.assets, asset], updatedAt: new Date().toISOString() }
          : site
      ),
    })),
  updateSiteAsset: (siteId, assetId, updates) =>
    set((s) => ({
      sites: s.sites.map((site) =>
        site.id === siteId
          ? {
              ...site,
              assets: site.assets.map((a) => (a.id === assetId ? { ...a, ...updates } : a)),
              updatedAt: new Date().toISOString(),
            }
          : site
      ),
    })),
  deleteSiteAsset: (siteId, assetId) =>
    set((s) => ({
      sites: s.sites.map((site) =>
        site.id === siteId
          ? {
              ...site,
              assets: site.assets.filter((a) => a.id !== assetId),
              updatedAt: new Date().toISOString(),
            }
          : site
      ),
    })),

  // ─── Gallery ────────────────────────────────────────────────────
  addGalleryImages: (images) =>
    set((s) => ({ galleryImages: [...s.galleryImages, ...images] })),
  updateGalleryImageNote: (imageId, note) =>
    set((s) => ({
      galleryImages: s.galleryImages.map((img) =>
        img.id === imageId ? { ...img, pilotNote: note } : img
      ),
    })),
  updateGalleryImagesById: (updates) =>
    set((s) => ({
      galleryImages: s.galleryImages.map((img) =>
        updates.has(img.id) ? { ...img, ...updates.get(img.id) } : img
      ),
    })),

  // ─── Flight contexts (HITL) ────────────────────────
  setFlightContext: (flightId, patch) => {
    set((s) => {
      const existing = s.flightContexts[flightId];
      const now = new Date().toISOString();
      const next: FlightContext = {
        flightId,
        siteId: patch.siteId ?? existing?.siteId ?? '',
        text: patch.text ?? existing?.text ?? '',
        imageNotes: patch.imageNotes ?? existing?.imageNotes ?? {},
        wordCount: 0,
        startedAt: existing?.startedAt ?? now,
        lastEditedAt: now,
        markedComplete: patch.markedComplete ?? existing?.markedComplete ?? false,
        source: patch.source ?? existing?.source ?? 'typed',
        captureMode: patch.captureMode ?? existing?.captureMode ?? 'retrospective',
      };
      next.wordCount = totalWordCount(next);
      const contexts = { ...s.flightContexts, [flightId]: next };
      saveFlightContextsToStorage(contexts);
      return { flightContexts: contexts };
    });
    const orgId = get().currentOrgId;
    const ctx = get().flightContexts[flightId];
    if (orgId && ctx) upsertFlightContext(orgId, ctx).catch((e) => console.error('[Store] sync flightCtx:', e));
  },
  updateFlightContextText: (flightId, text) => {
    set((s) => {
      const existing = s.flightContexts[flightId];
      if (!existing) return s;
      const next = { ...existing, text, lastEditedAt: new Date().toISOString() };
      next.wordCount = totalWordCount(next);
      const contexts = { ...s.flightContexts, [flightId]: next };
      saveFlightContextsToStorage(contexts);
      return { flightContexts: contexts };
    });
    const orgId = get().currentOrgId;
    const ctx = get().flightContexts[flightId];
    if (orgId && ctx) upsertFlightContext(orgId, ctx).catch((e) => console.error('[Store] sync flightCtx:', e));
  },
  updateFlightContextImageNote: (flightId, imageKey, note) => {
    set((s) => {
      const existing = s.flightContexts[flightId];
      if (!existing) return s;
      const imageNotes = { ...existing.imageNotes };
      if (note.trim()) imageNotes[imageKey] = note;
      else delete imageNotes[imageKey];
      const next = { ...existing, imageNotes, lastEditedAt: new Date().toISOString() };
      next.wordCount = totalWordCount(next);
      const contexts = { ...s.flightContexts, [flightId]: next };
      saveFlightContextsToStorage(contexts);
      return { flightContexts: contexts };
    });
    const orgId = get().currentOrgId;
    const ctx = get().flightContexts[flightId];
    if (orgId && ctx) upsertFlightContext(orgId, ctx).catch((e) => console.error('[Store] sync flightCtx:', e));
  },
  markContextComplete: (flightId, complete) => {
    set((s) => {
      const existing = s.flightContexts[flightId];
      if (!existing) return s;
      const next = { ...existing, markedComplete: complete, lastEditedAt: new Date().toISOString() };
      const contexts = { ...s.flightContexts, [flightId]: next };
      saveFlightContextsToStorage(contexts);
      return { flightContexts: contexts };
    });
    const orgId = get().currentOrgId;
    const ctx = get().flightContexts[flightId];
    if (orgId && ctx) upsertFlightContext(orgId, ctx).catch((e) => console.error('[Store] sync flightCtx:', e));
  },
  getFlightContext: (flightId) => get().flightContexts[flightId],
  clearFlightContext: (flightId) => {
    set((s) => {
      const { [flightId]: _, ...rest } = s.flightContexts;
      saveFlightContextsToStorage(rest);
      return { flightContexts: rest };
    });
    const orgId = get().currentOrgId;
    if (orgId) deleteFlightContextDb(orgId, flightId).catch((e) => console.error('[Store] sync deleteCtx:', e));
  },

  // ─── Live flights + wizard resume ──────────────────
  applyFlightEvent: (event) => {
    set((s) => {
      const next = { ...s.liveFlights };
      if (event.eventType === 'mission.execution.started') {
        const { flightDetails: fd, siteDetails: sd, missionDetails: md } = event.data;
        next[fd.flightId] = {
          flightId: fd.flightId, bindingId: fd.bindingId,
          droneName: fd.droneName, dockName: fd.dockName,
          siteId: sd?.siteId ?? '', siteName: sd?.siteName ?? null,
          missionId: md.missionId, missionName: md.missionName,
          missionType: md.missionType, totalWaypoints: md.totalWaypoints,
          currentWaypointNumber: 0, requestType: md.requestType,
          startedAt: event.timestamp,
        };
      } else if (event.eventType === 'mission.waypoint.reached') {
        const existing = next[event.data.flightDetails.flightId];
        if (existing) next[event.data.flightDetails.flightId] = {
          ...existing, currentWaypointNumber: event.data.missionDetails.currentWaypointNumber,
        };
      } else if (event.eventType === 'single_media.uploaded.completed') {
        const existing = next[event.data.flightDetails.flightId];
        if (existing && event.data.mediaDetails.thumbnailUrl) {
          next[event.data.flightDetails.flightId] = {
            ...existing,
            latestMediaThumbnailUrl: event.data.mediaDetails.thumbnailUrl,
            latestMediaCapturedAt: event.data.mediaDetails.uploadedAt,
          };
        }
      } else if (event.eventType === 'mission.execution.completed') {
        delete next[event.data.flightDetails.flightId];
      }
      return { liveFlights: next };
    });
  },
  clearLiveFlights: () => set({ liveFlights: {} }),

  setWizardResumeState: (state) => set({ wizardResumeState: state }),
  consumeWizardResumeState: () => {
    const c = get().wizardResumeState;
    set({ wizardResumeState: null });
    return c;
  },

  // ─── Demo mode ──────────────────────────────────────────────────
  enterDemoMode: () => {
    const state = get();
    const template = state.templates[0];

    const demoFlightIds = ['demo-flight-1', 'demo-flight-2', 'demo-flight-3', 'demo-flight-4', 'demo-flight-5'];
    const demoContexts = demoFlightIds
      .map((fid) => state.flightContexts[fid])
      .filter((c): c is FlightContext => !!c);

    const report = buildDemoReport(template, demoContexts);

    set((s) => ({
      demoMode: true,
      sites: s.sites.some((x) => x.id === DEMO_SITE.id) ? s.sites : [DEMO_SITE, ...s.sites],
      agents: s.agents.some((x) => x.id === DEMO_AGENT.id) ? s.agents : [DEMO_AGENT, ...s.agents],
      galleryImages: [...DEMO_GALLERY_IMAGES, ...s.galleryImages.filter((g: GalleryImage) => !g.id.startsWith('demo-img-'))],
      reports: s.reports.some((r) => r.id === report.id) ? s.reports : [report, ...s.reports],
    }));
  },

  exitDemoMode: () => {
    const demoImageIds = new Set(DEMO_GALLERY_IMAGES.map((i: GalleryImage) => i.id));

    set((s) => ({
      demoMode: false,
      sites: s.sites.filter((x) => x.id !== DEMO_SITE.id),
      agents: s.agents.filter((x) => x.id !== DEMO_AGENT.id),
      galleryImages: s.galleryImages.filter((img) => !demoImageIds.has(img.id)),
      reports: s.reports.filter((r) => !r.isDemo),
    }));
  },
}));
