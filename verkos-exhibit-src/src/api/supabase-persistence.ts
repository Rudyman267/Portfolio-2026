import { supabase } from '@/integrations/supabase/client';
import { templateSectionToKind, TemplateSection } from '@/types/report.types';
import { SECTION_KIND_DEFAULTS } from '@/data/section-kind-defaults';

function migrateTemplateSection(s: any): TemplateSection {
  const kind = s?.kind ?? templateSectionToKind(s?.name ?? '');
  const defaults = SECTION_KIND_DEFAULTS[kind as keyof typeof SECTION_KIND_DEFAULTS] ?? SECTION_KIND_DEFAULTS.custom;
  return {
    id: s?.id,
    kind,
    name: s?.name ?? '',
    description: s?.description ?? '',
    promptInstruction: s?.promptInstruction ?? defaults.defaultPromptInstruction,
    enabled: s?.enabled ?? true,
    order: s?.order ?? 0,
    maxLength: s?.maxLength ?? defaults.defaultMaxLength,
    toneOverride: s?.toneOverride ?? 'default',
    dataFeeds: s?.dataFeeds ?? { ...defaults.dataFeeds },
  };
}
// ─── AGENTS ────────────────────────────────────────────────────────

export async function fetchAgents(orgId: string) {
  const { data, error } = await supabase
    .from('agents' as any)
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[Supabase] fetchAgents error:', error);
    return [];
  }
  return (data ?? []) as any[];
}

export async function upsertAgent(orgId: string, agent: any) {
  const { error } = await supabase.from('agents' as any).upsert({
    id: agent.id,
    org_id: orgId,
    name: agent.name,
    description: agent.description ?? '',
    domain: agent.domain ?? 'custom',
    status: agent.status ?? 'active',
    icon: agent.icon ?? 'fa-solid fa-robot',
    report_count: agent.reportCount ?? 0,
    config: agent.config ?? {},
    created_at: agent.createdAt ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) console.error('[Supabase] upsertAgent error:', error);
}

export async function deleteAgentDb(orgId: string, agentId: string) {
  const { error } = await supabase
    .from('agents' as any)
    .delete()
    .eq('id', agentId)
    .eq('org_id', orgId);
  if (error) console.error('[Supabase] deleteAgent error:', error);
}

// ─── TEMPLATES ─────────────────────────────────────────────────────

export async function fetchTemplates(orgId: string) {
  const { data, error } = await supabase
    .from('templates' as any)
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[Supabase] fetchTemplates error:', error);
    return [];
  }
  return (data ?? []) as any[];
}

export async function upsertTemplate(orgId: string, template: any) {
  const { error } = await supabase.from('templates' as any).upsert({
    id: template.id,
    org_id: orgId,
    name: template.name,
    description: template.description ?? '',
    status: template.status ?? 'active',
    is_default: template.isDefault ?? false,
    sections: template.sections ?? [],
    cover_style: template.coverStyle ?? 'gradient',
    page_size: template.pageSize ?? 'A4',
    preview_image_url: template.previewImageUrl ?? null,
    created_at: template.createdAt ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) console.error('[Supabase] upsertTemplate error:', error);
}

export async function deleteTemplateDb(orgId: string, templateId: string) {
  const { error } = await supabase
    .from('templates' as any)
    .delete()
    .eq('id', templateId)
    .eq('org_id', orgId);
  if (error) console.error('[Supabase] deleteTemplate error:', error);
}

// ─── REPORTS ───────────────────────────────────────────────────────

export async function fetchReports(orgId: string) {
  const { data, error } = await supabase
    .from('reports' as any)
    .select('*')
    .eq('org_id', orgId)
    .eq('is_demo', false)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[Supabase] fetchReports error:', error);
    return [];
  }
  return (data ?? []) as any[];
}

export async function upsertReport(orgId: string, report: any) {
  // Demo reports are not persisted
  if (report.isDemo) return;
  const { error } = await supabase.from('reports' as any).upsert({
    id: report.id,
    org_id: orgId,
    title: report.title ?? '',
    profile: report.profile ?? 'full_operational',
    status: report.status ?? 'draft_ready',
    site_name: report.siteName ?? '',
    date: report.date ?? null,
    author: report.author ?? '',
    mission_count: report.missionCount ?? 0,
    executive_summary: report.executiveSummary ?? '',
    observations: report.observations ?? [],
    short_term_recommendations: report.shortTermRecommendations ?? [],
    long_term_recommendations: report.longTermRecommendations ?? [],
    agent_id: report.agentId || null,
    agent_name: report.agentName ?? '',
    template_id: report.templateId || null,
    flight_ids: report.flightIds ?? [],
    drone_name: report.droneName ?? null,
    mission_name: report.missionName ?? null,
    sections: report.sections ?? [],
    is_demo: report.isDemo ?? false,
    flight_context_snapshot: report.flightContextSnapshot ?? null,
    created_at: report.createdAt ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) console.error('[Supabase] upsertReport error:', error);
}

export async function deleteReportDb(orgId: string, reportId: string) {
  const { error } = await supabase
    .from('reports' as any)
    .delete()
    .eq('id', reportId)
    .eq('org_id', orgId);
  if (error) console.error('[Supabase] deleteReport error:', error);
}

// ─── MAPPERS ───────────────────────────────────────────────────────

export function mapAgentRow(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    domain: row.domain,
    status: row.status,
    icon: row.icon,
    reportCount: row.report_count,
    config: row.config,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTemplateRow(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    isDefault: row.is_default,
    sections: Array.isArray(row.sections) ? row.sections.map(migrateTemplateSection) : [],
    coverStyle: row.cover_style,
    pageSize: row.page_size,
    previewImageUrl: row.preview_image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapReportRow(row: any) {
  return {
    id: row.id,
    title: row.title,
    profile: row.profile,
    status: row.status,
    siteName: row.site_name,
    date: row.date ?? '',
    author: row.author,
    missionCount: row.mission_count,
    executiveSummary: row.executive_summary,
    observations: row.observations,
    shortTermRecommendations: row.short_term_recommendations,
    longTermRecommendations: row.long_term_recommendations,
    agentId: row.agent_id ?? '',
    agentName: row.agent_name,
    templateId: row.template_id ?? '',
    flightIds: row.flight_ids ?? [],
    droneName: row.drone_name,
    missionName: row.mission_name,
    sections: row.sections ?? [],
    isDemo: row.is_demo,
    flightContextSnapshot: row.flight_context_snapshot ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── FLIGHT CONTEXTS ───────────────────────────────────────────────

export async function fetchFlightContexts(orgId: string) {
  const { data, error } = await supabase
    .from('flight_contexts' as any)
    .select('*')
    .eq('org_id', orgId);
  if (error) {
    console.error('[Supabase] fetchFlightContexts:', error);
    return [];
  }
  return (data ?? []) as any[];
}

export async function upsertFlightContext(orgId: string, context: any) {
  const { error } = await supabase.from('flight_contexts' as any).upsert(
    {
      org_id: orgId,
      flight_id: context.flightId,
      site_id: context.siteId ?? null,
      text: context.text ?? '',
      image_notes: context.imageNotes ?? {},
      word_count: context.wordCount ?? 0,
      started_at: context.startedAt,
      last_edited_at: context.lastEditedAt ?? new Date().toISOString(),
      marked_complete: context.markedComplete ?? false,
      source: context.source ?? 'typed',
      capture_mode: context.captureMode ?? 'retrospective',
    },
    { onConflict: 'org_id,flight_id' }
  );
  if (error) console.error('[Supabase] upsertFlightContext:', error);
}

export async function deleteFlightContextDb(orgId: string, flightId: string) {
  const { error } = await supabase
    .from('flight_contexts' as any)
    .delete()
    .eq('org_id', orgId)
    .eq('flight_id', flightId);
  if (error) console.error('[Supabase] deleteFlightContext:', error);
}

export function mapFlightContextRow(row: any) {
  return {
    flightId: row.flight_id,
    siteId: row.site_id ?? '',
    text: row.text,
    imageNotes: row.image_notes ?? {},
    wordCount: row.word_count,
    startedAt: row.started_at,
    lastEditedAt: row.last_edited_at,
    markedComplete: row.marked_complete,
    source: row.source,
    captureMode: row.capture_mode,
  };
}
