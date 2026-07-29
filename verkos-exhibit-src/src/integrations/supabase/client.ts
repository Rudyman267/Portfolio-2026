/**
 * EXHIBIT SHIM — offline replacement for the Supabase client.
 *
 * The real file calls `createClient()` against a live project and ships a
 * hard-coded URL + anon key. This build is a public, backend-less embed on a
 * portfolio site, so the credential is removed outright and every call is
 * answered locally.
 *
 * Surface actually used by the app:
 *   - `functions.invoke('generate-report', { body: { mode, ... } })`
 *       modes: site_context_fill | full_report | section_assist | extract_template
 *   - `from(<table>).upsert(...)` in api/supabase-persistence.ts
 *
 * Everything resolves in the caller's exact shape after a short delay so the
 * app's loading states still play.
 */

import { DEMO_POLISHED_RESPONSES, DEMO_OBSERVATIONS } from '@/data/demo-scenario';

function wait(min: number, max = min): Promise<void> {
  const ms = min + Math.random() * Math.max(0, max - min);
  return new Promise((r) => setTimeout(r, ms));
}

// ─── generate-report: extract_template ───────────────────────────────

function extractTemplateResult(sourceLabel?: string) {
  return {
    sampleRelevance: 'high' as const,
    sampleRelevanceNote:
      'The sample reads as a night-shift security summary — the same document class Verkos generates, so structure and voice transfer cleanly.',
    persona: {
      role: 'Site security operations lead',
      primaryUse: 'Morning handover review and escalation decisions',
      readingTime: 'Under 5 minutes — skims headings, reads flagged items in full',
      priorities: 'Unresolved incidents first, then perimeter status, then routine confirmations',
      provenance: sourceLabel
        ? `Inferred from "${sourceLabel}" — heading order and summary-first layout`
        : 'Inferred from the sample\'s heading order and summary-first layout',
    },
    narrativeStyle: {
      voice: 'Operational and factual — no hedging, no marketing language',
      structure: 'Summary first, then observations ordered by severity, then recommendations',
      vocabulary: 'Security operations terminology; waypoint and sector references retained',
      provenance: 'Matched to the sample\'s sentence length and terminology density',
    },
    sections: [
      {
        name: 'Executive summary',
        kind: 'executive_summary' as const,
        promptInstruction:
          'Open with shift scope and flight count, then lead with anything requiring immediate action. Close with overall risk posture.',
        maxLength: 'standard' as const,
        dataFeeds: { images: false, structuredData: true, narrativeContext: true },
        provenance: 'Sample opened with a scope-then-risk paragraph',
      },
      {
        name: 'Observations',
        kind: 'observations' as const,
        promptInstruction:
          'One entry per detection, ordered by severity. Include confidence, timestamp and the pilot note verbatim where present.',
        maxLength: 'detailed' as const,
        dataFeeds: { images: true, structuredData: true, narrativeContext: true },
        provenance: 'Sample listed numbered findings with inline imagery',
      },
      {
        name: 'Perimeter status',
        kind: 'perimeter_status' as const,
        promptInstruction: 'Summarise integrity sector by sector; state explicitly which sectors are not secure.',
        maxLength: 'standard' as const,
        dataFeeds: { images: false, structuredData: true, narrativeContext: true },
        provenance: 'Sample carried a dedicated perimeter section',
      },
      {
        name: 'Recommendations',
        kind: 'recommendations' as const,
        promptInstruction: 'Split immediate actions from longer-term programme changes. Lead each with a verb.',
        maxLength: 'standard' as const,
        dataFeeds: { images: false, structuredData: true, narrativeContext: true },
        provenance: 'Sample closed with a two-tier action list',
      },
    ],
    sampleObservations: DEMO_OBSERVATIONS.slice(0, 3).map((o) => ({
      title: o.title,
      severity: o.severity,
      aiDescription: o.aiDescription,
      provenance: 'Rewritten in the sample\'s voice',
    })),
    sampleExecutiveSummary: DEMO_POLISHED_RESPONSES.executive_summary,
  };
}

// ─── generate-report dispatcher ──────────────────────────────────────

type InvokeBody = { mode?: string; target?: string; sourceLabel?: string };

async function invokeGenerateReport(body: InvokeBody) {
  const mode = body?.mode;

  if (mode === 'extract_template') {
    await wait(2200, 3400);
    return { data: { ok: true, data: extractTemplateResult(body.sourceLabel) }, error: null };
  }

  if (mode === 'site_context_fill') {
    await wait(1000, 2000);
    return {
      data: {
        description:
          'High-security industrial facility with 24/7 drone patrol coverage across four perimeter sectors.',
        siteType: 'Industrial facility',
        timezone: 'Asia/Kolkata (IST)',
        operatingHours: '24/7 — day shift 06:00-18:00, night shift 18:00-06:00',
        location: '18.5623°N, 73.6959°E · Pune, Maharashtra',
        context:
          'Active construction on the north side with an authorised contractor staging in the northern loading bay. The east gate has a recent history of unauthorised access attempts. Known fence deterioration on the south boundary near waypoint 15. Lighting coverage gaps on the west perimeter between waypoints 8 and 12.',
      },
      error: null,
    };
  }

  if (mode === 'section_assist') {
    await wait(1200, 2200);
    const target = body?.target ?? 'executive_summary';
    const map = DEMO_POLISHED_RESPONSES as unknown as Record<string, string>;
    if (target === 'recommendations') {
      return {
        data: {
          immediate: DEMO_POLISHED_RESPONSES.recommendations_immediate,
          shortTerm: DEMO_POLISHED_RESPONSES.recommendations_immediate.slice(0, 3),
          longTerm: DEMO_POLISHED_RESPONSES.recommendations_long,
        },
        error: null,
      };
    }
    return { data: { content: map[target] ?? DEMO_POLISHED_RESPONSES.executive_summary }, error: null };
  }

  if (mode === 'full_report') {
    await wait(3000, 5000);
    return {
      data: {
        title: 'Night Shift Summary — Skybase Alpha — Apr 14',
        executiveSummary: DEMO_POLISHED_RESPONSES.executive_summary,
        observations: DEMO_OBSERVATIONS.map((o) => ({
          id: o.id,
          title: o.title,
          severity: o.severity,
          aiDescription: DEMO_POLISHED_RESPONSES.observations[o.number] ?? o.aiDescription,
        })),
        sectionContents: {
          executive_summary: DEMO_POLISHED_RESPONSES.executive_summary,
          perimeter_status: DEMO_POLISHED_RESPONSES.perimeter_status,
          compliance: DEMO_POLISHED_RESPONSES.compliance,
        },
        recommendations: {
          immediate: DEMO_POLISHED_RESPONSES.recommendations_immediate,
          shortTerm: DEMO_POLISHED_RESPONSES.recommendations_immediate.slice(0, 3),
          longTerm: DEMO_POLISHED_RESPONSES.recommendations_long,
        },
      },
      error: null,
    };
  }

  await wait(400);
  return { data: { ok: true }, error: null };
}

// ─── Chainable no-op query builder for `from(...)` ───────────────────

function queryBuilder() {
  const result = { data: [] as unknown[], error: null };
  const chain: Record<string, unknown> = {};
  const methods = [
    'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'gt', 'gte',
    'lt', 'lte', 'like', 'ilike', 'is', 'in', 'contains', 'order', 'limit',
    'range', 'filter', 'match', 'not', 'or', 'single', 'maybeSingle',
  ];
  for (const m of methods) chain[m] = () => chain;
  // Make it awaitable — resolves to the Supabase result envelope.
  chain.then = (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve);
  chain.catch = () => chain;
  return chain;
}

// ─── The mock client ─────────────────────────────────────────────────

export const supabase = {
  functions: {
    invoke: async (name: string, opts?: { body?: InvokeBody }) => {
      if (name === 'generate-report') return invokeGenerateReport(opts?.body ?? {});
      await wait(300);
      return { data: { ok: true }, error: null };
    },
  },
  from: () => queryBuilder(),
  rpc: async () => ({ data: null, error: null }),
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
    signOut: async () => ({ error: null }),
  },
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: null }),
      getPublicUrl: (p: string) => ({ data: { publicUrl: p } }),
      remove: async () => ({ data: null, error: null }),
    }),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;
