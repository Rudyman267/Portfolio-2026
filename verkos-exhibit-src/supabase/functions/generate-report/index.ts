import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };

function dataUrlToInlineData(url: string): { mimeType: string; data: string } | null {
  const m = /^data:([^;]+);base64,(.+)$/.exec(url);
  if (!m) return null;
  return { mimeType: m[1], data: m[2] };
}

function toGeminiParts(content: unknown): string | GeminiPart[] {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  const parts: GeminiPart[] = [];
  for (const item of content as Array<any>) {
    if (item?.type === 'text' && typeof item.text === 'string') {
      parts.push({ text: item.text });
    } else if (item?.type === 'image_url' && item.image_url?.url) {
      const url: string = item.image_url.url;
      if (url.startsWith('data:')) {
        const inline = dataUrlToInlineData(url);
        if (inline) parts.push({ inlineData: inline });
      }
      // remote http(s) URLs are silently dropped — Gemini generateContent requires base64
    }
  }
  return parts;
}

async function callGemini(
  apiKey: string,
  systemPrompt: string,
  userContent: string | GeminiPart[],
  opts: { temperature: number; maxTokens: number; jsonMode?: boolean },
): Promise<Response> {
  const parts: GeminiPart[] = typeof userContent === 'string'
    ? [{ text: userContent }]
    : userContent;
  const generationConfig: Record<string, unknown> = {
    temperature: opts.temperature,
    maxOutputTokens: opts.maxTokens,
  };
  if (opts.jsonMode) generationConfig.responseMimeType = 'application/json';
  return await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts }],
      generationConfig,
    }),
  });
}

function extractGeminiText(data: any): string | null {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  const text = parts.map((p: any) => p?.text ?? '').join('').trim();
  return text || null;
}

function geminiErrorResponse(status: number, errText: string): Response {
  const lower = errText.toLowerCase();
  if (status === 429 || lower.includes('resource_exhausted') || lower.includes('quota')) {
    return new Response(JSON.stringify({ error: 'credit_limit', message: 'Quota / rate limit reached' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (lower.includes('context length') || lower.includes('exceeds the maximum') || lower.includes('too long')) {
    return new Response(JSON.stringify({
      error: 'context_length',
      message: 'Report is too complex for the current model. Try fewer sections or observations.',
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if ([500, 502, 503, 504].includes(status)) {
    return new Response(JSON.stringify({
      error: 'upstream_timeout',
      message: 'The AI provider timed out. Please try again in a moment.',
    }), {
      status: 504,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ error: 'gemini_error', message: errText }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Best-effort repair for JSON truncated mid-stream (LLM hit token cap).
function tryRepairTruncatedJson(raw: string): unknown | null {
  let s = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const stack: string[] = [];
  let inString = false;
  let escape = false;
  let lastSafeEnd = -1;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inString) {
      if (escape) { escape = false; continue; }
      if (c === '\\') { escape = true; continue; }
      if (c === '"') inString = false;
      continue;
    }
    if (c === '"') { inString = true; continue; }
    if (c === '{') stack.push('}');
    else if (c === '[') stack.push(']');
    else if (c === '}' || c === ']') {
      if (stack[stack.length - 1] === c) stack.pop();
      lastSafeEnd = i;
    } else if (c === ',' && stack.length > 0) {
      lastSafeEnd = i;
    }
  }
  if (inString && lastSafeEnd >= 0) {
    return tryRepairTruncatedJson(s.slice(0, lastSafeEnd + 1));
  }
  s = s.replace(/,\s*$/, '');
  while (stack.length > 0) s += stack.pop();
  try { return JSON.parse(s); } catch { return null; }
}

interface GalleryImageInput {
  id: string;
  url?: string;
  filename: string;
  timestamp: string;
  flightName: string;
  droneName: string;
  siteName: string;
  hasDetection: boolean;
  detectionLabel: string | null;
  detectionConfidence: number | null;
  gpsLat?: string;
  gpsLng?: string;
  altitudeM?: number;
  pilotNote?: string;
}

interface AgentConfigInput {
  name: string;
  domain: string;
  description: string;
  tone: string;
  analysisDepth: string;
  detectionEvents: Array<{
    name: string;
    description: string;
    defaultSeverity: string;
    enabled: boolean;
    compareHistorical: boolean;
  }>;
}

interface TemplateConfigInput {
  name: string;
  description: string;
  sections: Array<{
    id: string;
    name: string;
    description: string;
    promptInstruction: string;
    order: number;
    maxLength: string;
    toneOverride: string;
  }>;
  persona?: {
    role: string;
    primaryUse: string;
    readingTime: string;
    priorities: string;
  };
  narrativeStyle?: {
    voice: string;
    structure: string;
    vocabulary: string;
  };
  sampleObservations?: Array<{
    title: string;
    severity: string;
    aiDescription: string;
  }>;
  sampleExecutiveSummary?: string;
}

interface SiteInput {
  name: string;
  description: string;
  location: string;
  siteType: string;
  context: string;
  assets: Array<{ name: string; type: string; description: string }>;
}

interface FullReportRequest {
  mode: 'full_report';
  agent: AgentConfigInput;
  template: TemplateConfigInput;
  sites: SiteInput[];
  flights: Array<{ id: string; missionName: string; droneName: string; timestamp: string }>;
  galleryImages: GalleryImageInput[];
  flightContexts?: Array<{
    flightId: string;
    flightLabel: string;
    captureMode: 'live' | 'retrospective';
    text: string;
    imageNoteCount: number;
  }>;
}

interface SectionAssistRequest {
  mode: 'section_assist';
  target: 'executive_summary' | 'perimeter_status' | 'compliance' | 'custom' | 'observation_description' | 'recommendations';
  sectionName?: string;
  promptInstruction?: string;
  maxLength?: string;
  toneOverride?: string;
  currentDraft?: string;
  agent: AgentConfigInput;
  site: SiteInput;
  templatePersona?: { role: string; primaryUse: string; priorities: string };
  templateNarrativeStyle?: { voice: string; structure: string; vocabulary: string };
  reportContext: {
    title: string;
    siteName: string;
    observations: Array<{
      number: number;
      title: string;
      severity: string;
      confidence: number;
      imageLabels: string[];
    }>;
    executiveSummary?: string;
  };
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

interface SiteContextRequest {
  mode: 'site_context_fill';
  siteData: {
    name: string;
    coordinates: { lat: number; lng: number };
    deviceCount: number;
    missionCount: number;
    missionNames: string[];
  };
}

interface ExtractTemplateRequest {
  mode: 'extract_template';
  sampleText: string;
  sourceLabel?: string;
}

type RequestBody = FullReportRequest | SectionAssistRequest | SiteContextRequest | ExtractTemplateRequest;

type MessageContent = string | Array<
  { type: 'text'; text: string } |
  { type: 'image_url'; image_url: { url: string } }
>;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as RequestBody;

    // ─── Safety caps to prevent worker resource exhaustion ──────────
    const MAX_IMAGES_PER_REQUEST = 6;
    const MAX_IMAGE_BYTES = 800_000;
    const MAX_DETECTION_EVENTS = 10;          // hard cap on detections sent to LLM
    const MAX_DETECTION_DESC_LEN = 200;        // truncate long descriptions

    function capImageUrls(urls: string[] | undefined): string[] {
      if (!urls) return [];
      return urls
        .filter(u => {
          if (!u) return false;
          if (u.startsWith('http')) return true;
          if (u.startsWith('data:')) return u.length < MAX_IMAGE_BYTES * 1.34;
          return false;
        })
        .slice(0, MAX_IMAGES_PER_REQUEST);
    }

    if (body.mode === 'full_report') {
      // 1) Cap & truncate agent detection events to keep prompt small
      if (body.agent?.detectionEvents) {
        body.agent.detectionEvents = body.agent.detectionEvents
          .slice(0, MAX_DETECTION_EVENTS)
          .map(e => ({
            ...e,
            description: (e.description || '').slice(0, MAX_DETECTION_DESC_LEN),
          }));
      }

      // Keep image URLs — Gemini handles inlineData efficiently.
      body.galleryImages = (body.galleryImages || []).slice(0, 30);
    }

    if (body.mode === 'section_assist' && body.observation) {
      body.observation.imageUrls = capImageUrls(body.observation.imageUrls);
    }

    // Site context fill uses simple text prompt, no vision
    if (body.mode === 'site_context_fill') {
      const { systemPrompt, userPrompt } = buildSiteContextPrompts(body);
      const scRes = await callGemini(apiKey, systemPrompt, userPrompt, {
        temperature: 0.3,
        maxTokens: 800,
        jsonMode: true,
      });

      if (!scRes.ok) {
        const errText = await scRes.text();
        console.error('Gemini error (site_context_fill):', scRes.status, errText);
        return geminiErrorResponse(scRes.status, errText);
      }

      const scData = await scRes.json();
      const scRaw = extractGeminiText(scData);
      if (!scRaw) {
        return new Response(JSON.stringify({ error: 'empty_response' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      let scParsed: unknown;
      try { scParsed = JSON.parse(scRaw); } catch (_e) {
        console.error('Failed to parse site context JSON:', scRaw);
        return new Response(JSON.stringify({ error: 'invalid_json', raw: scRaw }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ ok: true, data: scParsed }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Extract template from a sample report (text-only, JSON-out)
    if (body.mode === 'extract_template') {
      const { systemPrompt, userPrompt } = buildExtractTemplatePrompts(body);
      const etRes = await callGemini(apiKey, systemPrompt, userPrompt, {
        temperature: 0.2,
        maxTokens: 3500,
        jsonMode: true,
      });

      if (!etRes.ok) {
        const errText = await etRes.text();
        console.error('Gemini error (extract_template):', etRes.status, errText);
        return geminiErrorResponse(etRes.status, errText);
      }

      const etData = await etRes.json();
      const etRaw = extractGeminiText(etData);
      if (!etRaw) {
        return new Response(JSON.stringify({ error: 'empty_response' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      let etParsed: unknown;
      try { etParsed = JSON.parse(etRaw); } catch (_e) {
        console.error('Failed to parse extract_template JSON:', etRaw);
        return new Response(JSON.stringify({ error: 'invalid_json', raw: etRaw }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify({ ok: true, data: etParsed }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const built = buildPrompts(body);
    const firstMessage = built.messages[0];
    const userContent = firstMessage ? toGeminiParts(firstMessage.content) : '';

    const callOnce = () => callGemini(apiKey, built.systemPrompt, userContent, {
      temperature: 0.3,
      maxTokens: body.mode === 'full_report' ? 8192 : 1200,
      jsonMode: true,
    });

    let geminiRes = await callOnce();
    if ([500, 503, 504].includes(geminiRes.status)) {
      console.warn(`Gemini ${geminiRes.status}, retrying after 2s...`);
      try { await geminiRes.text(); } catch (_e) { /* drain */ }
      await new Promise((r) => setTimeout(r, 2000));
      geminiRes = await callOnce();
    }

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error('Gemini error:', geminiRes.status, errorText);
      return geminiErrorResponse(geminiRes.status, errorText);
    }

    const geminiData = await geminiRes.json();
    const rawContent = extractGeminiText(geminiData);
    if (!rawContent) {
      return new Response(JSON.stringify({ error: 'empty_response' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    let parsed: unknown;
    try { parsed = JSON.parse(rawContent); } catch (_e) {
      const repaired = tryRepairTruncatedJson(rawContent);
      if (repaired !== null) {
        console.warn('Recovered truncated LLM JSON via repair');
        parsed = repaired;
      } else {
        console.error('Failed to parse LLM JSON:', rawContent);
        return new Response(JSON.stringify({ error: 'invalid_json', raw: rawContent }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }
    return new Response(JSON.stringify({ ok: true, data: parsed }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('Edge function error:', e);
    return new Response(JSON.stringify({ error: 'internal_error', message: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildPrompts(body: RequestBody): { systemPrompt: string; messages: Array<{ role: string; content: MessageContent }> } {
  if (body.mode === 'full_report') {
    return buildFullReportPrompts(body);
  }
  return buildSectionAssistPrompts(body);
}

function isDepthPersona(template: TemplateConfigInput): boolean {
  if (!template.persona) return false;
  const haystack = `${template.persona.role} ${template.persona.primaryUse} ${template.persona.priorities}`.toLowerCase();
  return /inspector|inspection|compliance|auditor|audit|regulatory|engineer|assessor|maintenance/.test(haystack);
}

function sectionKindDepthInstructions(kind: string): string {
  switch (kind) {
    case 'compliance':
      return `Structure as:
- **Overall Compliance Assessment**: 1 line stating Compliant | Partially Compliant | Non-Compliant with brief reason.
- **Fully Compliant Areas**: bulleted list (omit if none).
- **Pending Compliance Areas**: bulleted list of gaps (omit if none).
- Optionally append an **SOP References Table** using markdown table syntax with columns: SOP Name | SOP Description | Violation Status. Only when detection events or site context reference specific standards.
Use **bold** on classification terms and standard names.`;
    case 'recommendations':
      return `Two bulleted groups:
- **Short-term Actions**: concrete items (this week to this month)
- **Long-term Actions**: strategic items (this quarter to this year)
Each bullet is one imperative action ("Conduct visual inspection of..."). 3-7 bullets per group. Omit a group if none apply. Use **bold** only on group labels.`;
    case 'perimeter_status':
      return `2-3 short paragraphs. First: overall status rating and rationale. Subsequent: sector-by-sector or asset-by-asset breakdown when applicable. **Bold** on 2-4 critical terms (condition ratings, specific sectors, key findings).`;
    case 'executive_summary':
      return `One paragraph, 4-6 sentences. **Bold** on 2-3 most critical findings only. No bullets — exec summaries read as prose.`;
    case 'patrol_overview':
      return `1-2 paragraphs of operational context (mission, coverage, conditions). Plain prose, no bullets. **Bold** only on specific anomalies.`;
    default:
      return `Follow the section's promptInstruction. Use **bold** for 2-5 critical terms. Use bulleted lists when enumerating items.`;
  }
}

function buildFullReportPrompts(body: FullReportRequest): { systemPrompt: string; messages: Array<{ role: string; content: MessageContent }> } {
  const { agent, template, sites, flights, galleryImages } = body;

  const depthMode = isDepthPersona(template);

  const enabledDetectionEvents = agent.detectionEvents.filter(e => e.enabled);
  const enabledSections = template.sections.sort((a, b) => a.order - b.order);

  const notableImages = galleryImages.filter(img => img.hasDetection || (img.pilotNote && img.pilotNote.length > 0)).slice(0, 20);

  const personaBlock = template.persona
    ? `READER PERSONA (the report is written FOR this reader):
- Role: ${template.persona.role}
- Primary use: ${template.persona.primaryUse}
- Reading time: ${template.persona.readingTime}
- What they prioritize: ${template.persona.priorities}`
    : '';

  const styleBlock = template.narrativeStyle
    ? `NARRATIVE STYLE (write in this voice):
- Voice: ${template.narrativeStyle.voice}
- Structure: ${template.narrativeStyle.structure}
- Vocabulary: ${template.narrativeStyle.vocabulary}`
    : '';

  const sampleObsBlock = template.sampleObservations && template.sampleObservations.length > 0
    ? `SAMPLE OBSERVATIONS (written in the target voice — match this style, do NOT copy content):
${template.sampleObservations.map((s, i) => `
Example ${i + 1}:
- Title: "${s.title}"
- Severity: ${s.severity}
- aiDescription: "${s.aiDescription}"`).join('\n')}`
    : '';

  const sampleSummaryBlock = template.sampleExecutiveSummary
    ? `SAMPLE EXECUTIVE SUMMARY (match this voice, not the content):
"${template.sampleExecutiveSummary}"`
    : '';

  const depthModeBlock = depthMode
    ? `

DEPTH MODE — PROFESSIONAL REPORT FORMATTING:
This template's persona signals inspection/compliance use. Observations must be publication-grade.

For each observation:
- aiDescription: the observable facts. Use **bold markdown** on 3-5 critical technical terms (what was detected, visible indicators, quantitative signals). 3-5 sentences. No fluff words ("appears to be" is OK for visual inference; "might possibly" is not).
- impactAssessment: a separate paragraph describing CONSEQUENCES and PRIORITY. Start with the priority classification inline and bold (e.g. "**Moderate to high priority** — ..."). Then describe structural/operational/compliance implications specific to what was detected. 2-4 sentences.
- assetId: when the site or pilot context identifies a specific asset (tank, sector, gate, etc.), include it (e.g. "Storage Tank 651", "Sector 3 East Perimeter"). When not identifiable, omit.
- imageSubheader: a 1-3 word label for the finding type (e.g. "Corrosion", "Vegetation Growth", "Unauthorized Access"). This labels the image.

Do NOT use markdown in titles or in short fields (severity, assetId, imageSubheader). Markdown is only for aiDescription and impactAssessment.`
    : '';

  const systemPrompt = `You are a drone patrol report writer for Verkos. Generate structured JSON reports from AI detection data, pilot flight context, and pilot image notes.

${personaBlock}

${styleBlock}

${sampleObsBlock}

${sampleSummaryBlock}

CRITICAL GROUNDING RULES:
- If there is NO pilot flight context, NO per-image notes, AND no DAA detections, do NOT fabricate findings.
- PILOT FLIGHT CONTEXT (when provided) is primary authoritative source. Defer to pilot observations.
- Pilot notes on specific images are authoritative for those images.
- If pilot context mentions "authorized/expected/scheduled" — LOWER severity.
- If pilot context mentions "concern/unusual/unauthorized" — RAISE severity.
- Never invent details not in the input.
- Markdown formatting (**bold**, bullet lists) is permitted in aiDescription, impactAssessment, and section contents. Titles, severity, status, assetId, imageSubheader stay plain text.

NARRATIVE COHERENCE:
- Write as ONE connected story, not disconnected paragraphs. Summary sets arc; observations are chapters.
- Apply the narrative style consistently across all sections.
- Match the SAMPLE OBSERVATIONS structure and vocabulary. Do NOT fall into template-filling like "AI detected X at coordinates Y."${depthModeBlock}

AGENT: ${agent.name} (${agent.domain}). Tone: ${agent.tone}. Depth: ${agent.analysisDepth}.
${agent.description}

DETECTION TYPES (only report findings matching these):
${enabledDetectionEvents.map(e => `- ${e.name} [${e.defaultSeverity}]: ${e.description}`).join('\n')}

Use severity: critical | high | moderate | low.
Use status: acknowledged | requires_action | resolved.`;

  const sectionsSpec = enabledSections.map(s => {
    const kind = inferSectionKind(s.name);
    const entry: Record<string, unknown> = {
      name: s.name,
      kind,
      order: s.order,
      promptInstruction: s.promptInstruction,
      maxLength: s.maxLength,
      toneOverride: s.toneOverride,
    };
    if (depthMode) entry.structureHint = sectionKindDepthInstructions(kind);
    const json = JSON.stringify(entry, null, 2)
      .split('\n')
      .map((l, i) => (i === 0 ? l : `  ${l}`))
      .join('\n');
    return `  "${s.id}": ${json}`;
  }).join(',\n');

  const detectionLines = notableImages.map(img => {
    const parts: string[] = [];
    parts.push(`- [${img.timestamp}] ${img.filename} (${img.droneName} @ ${img.flightName})`);
    if (img.hasDetection && img.detectionLabel) {
      parts.push(`  DAA Detection: "${img.detectionLabel}" (confidence: ${img.detectionConfidence}%)`);
    }
    if (img.pilotNote) {
      parts.push(`  PILOT NOTE: "${img.pilotNote}"`);
    }
    if (img.gpsLat) parts.push(`  Location: ${img.gpsLat}, ${img.gpsLng}${img.altitudeM ? `, altitude ${img.altitudeM}m` : ''}`);
    return parts.join('\n');
  }).join('\n\n');

  const noDataWarning = notableImages.length === 0
    ? '\nIMPORTANT: Since no image data or pilot notes are available, your observations array should be empty or contain only generic patrol findings not tied to specific imagery. Do NOT invent specific detections.'
    : '';

  const flightContexts = body.flightContexts ?? [];
  const flightContextBlock = flightContexts.length > 0
    ? flightContexts.map((fc, i) =>
        `FLIGHT ${i + 1} — ${fc.flightLabel} [captured ${fc.captureMode}]:\n"${fc.text}"${fc.imageNoteCount > 0 ? `\n(+ ${fc.imageNoteCount} per-image note${fc.imageNoteCount !== 1 ? 's' : ''} already folded into image data below)` : ''}`
      ).join('\n\n')
    : '';

  const userText = `Generate a complete report as JSON. Follow this exact structure.

CONTEXT:
- Sites: ${sites.map(s => `${s.name} (${s.siteType}) — ${s.description}. Context: ${s.context || 'none'}. Assets: ${s.assets.map(a => `${a.name} (${a.type})`).join(', ') || 'none'}`).join(' | ')}
- Flights (${flights.length}): ${flights.map(f => `${f.missionName} (${f.droneName}, ${f.timestamp})`).join(', ') || 'none'}
- Total gallery images: ${galleryImages.length} (${notableImages.length} with detections or pilot notes shown below)

${flightContextBlock ? `AUTHORITATIVE PILOT FLIGHT CONTEXT (first-hand pilot narrative — highest priority for grounding):
${flightContextBlock}

` : ''}DETECTION & PILOT DATA:
${notableImages.length > 0 ? detectionLines : '[NO DATA — No AI detections and no pilot notes have been added to any images. Generate observations based ONLY on the agent detection events and site context. Do NOT fabricate specific findings tied to imagery. If there is insufficient data, return an empty observations array.]'}
${noDataWarning}

TEMPLATE SECTIONS (generate content for each):
${sectionsSpec}

OUTPUT JSON SCHEMA:
{
  "title": "Report title (uppercase, max 10 words)",
  "executiveSummary": "3-4 sentence executive summary reflecting all findings",
  "observations": [
${depthMode ? `    {
      "title": "Short observation title (no markdown)",
      "severity": "critical|high|moderate|low",
      "status": "acknowledged|requires_action|resolved",
      "aiDescription": "Observable facts with **bold** on critical terms. 3-5 sentences.",
      "impactAssessment": "Consequences + priority classification. Start with '**[Priority] priority** — ...'. 2-4 sentences.",
      "assetId": "Specific asset identifier when applicable, else omit",
      "imageSubheader": "1-3 word finding label (e.g. 'Corrosion')",
      "imageIds": ["gallery image IDs that support this observation"],
      "confidence": 0-100
    }` : `    {
      "title": "Short observation title",
      "severity": "critical|high|moderate|low",
      "status": "acknowledged|requires_action|resolved",
      "aiDescription": "Detailed description based on detection data and pilot notes",
      "imageIds": ["gallery image IDs that support this observation"],
      "confidence": 0-100
    }`}
  ],
  "sectionContents": {
    "<section_id>": "Content in markdown. Follow the section's structureHint (when provided) exactly — use the bullet lists, tables, and **bold** emphasis it specifies. Respect maxLength: brief=1 paragraph, standard=2-3 paragraphs or short bulleted list, detailed=no limit. Do NOT include the section's name as a heading (it's already rendered)."
  },
  "recommendations": {
    "immediate": ["action 1", "action 2"],
    "shortTerm": ["action 1"],
    "longTerm": ["action 1"]
  }
}

RULES:
1. Only include observations for detections that match enabled agent detection events OR pilot notes.
2. Respect the analysis depth setting — ${agent.analysisDepth} analysis.
3. For section content, follow the section's promptInstruction precisely. When structureHint is present, follow it exactly.
4. For kinds executive_summary, patrol_overview, observations, recommendations: populate the top-level fields (executiveSummary, observations, recommendations) AND leave sectionContents[sectionId] empty — rendering uses the top-level fields. For kinds compliance, perimeter_status, custom: populate sectionContents[sectionId] with markdown content following the structureHint.
5. Use the site context to inform your narrative.
6. Apply toneOverride if it differs from "default"; otherwise use the agent's tone.
7. For each observation, the imageIds array should reference real gallery image IDs from the data above.
8. Base observations ONLY on provided data. Never fabricate findings.

Respond with ONLY the JSON object. No preamble, no markdown fences.`;

  const imagesToInclude = galleryImages.filter(img => img.url && (img.url.startsWith('data:') || img.url.startsWith('http'))).slice(0, 10);

  let userContent: MessageContent;
  if (imagesToInclude.length > 0) {
    userContent = [
      { type: 'text', text: userText },
      ...imagesToInclude.map(img => ({
        type: 'image_url' as const,
        image_url: { url: img.url! },
      })),
      {
        type: 'text' as const,
        text: `\n\nImage reference table (in order shown above):\n${imagesToInclude.map((img, i) => `Image ${i + 1} (id: "${img.id}"): ${img.filename}${img.pilotNote ? ` — Pilot note: "${img.pilotNote}"` : ''}${img.hasDetection ? ` — DAA: ${img.detectionLabel}` : ''}`).join('\n')}\n\nWhen creating observations, reference images by their id in the imageIds array.`,
      },
    ];
  } else {
    userContent = userText;
  }

  return {
    systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  };
}

function buildSectionAssistPrompts(body: SectionAssistRequest): { systemPrompt: string; messages: Array<{ role: string; content: MessageContent }> } {
  const { target, agent, site, reportContext, observation, sectionName, promptInstruction, maxLength, toneOverride } = body;
  const currentDraft = body.currentDraft || '';

  const effectiveTone = toneOverride && toneOverride !== 'default' ? toneOverride : agent.tone;

  const personaBlock = body.templatePersona
    ? `\n\nREADER PERSONA:\n- Role: ${body.templatePersona.role}\n- Use: ${body.templatePersona.primaryUse}\n- Priorities: ${body.templatePersona.priorities}`
    : '';
  const styleBlock = body.templateNarrativeStyle
    ? `\n\nNARRATIVE STYLE:\n- Voice: ${body.templateNarrativeStyle.voice}\n- Structure: ${body.templateNarrativeStyle.structure}\n- Vocabulary: ${body.templateNarrativeStyle.vocabulary}`
    : '';

  const detectionEventsBlock = agent.detectionEvents && agent.detectionEvents.length > 0
    ? `\n\nAGENT DETECTION POLICIES (these define what this agent is watching for and why):\n${agent.detectionEvents
        .filter(e => e.enabled)
        .map(e => `- ${e.name} [${e.defaultSeverity}]: ${e.description}`)
        .join('\n')}`
    : '';

  const systemPrompt = `You are a drone patrol report writer for Verkos. You help pilots draft individual sections of reports.${personaBlock}${styleBlock}${detectionEventsBlock}

CRITICAL RULES:
- If the pilot has typed a DRAFT for this section, your job is to POLISH and EXPAND their draft — keep their core observations and wording where possible, fill in structure and detail. Do NOT throw away what the pilot wrote.
- If there are images attached, describe what you ACTUALLY SEE. Do not invent details absent from the images.
- If the pilot has left a note on an image, treat it as authoritative first-hand observation.
- If there is NEITHER pilot draft NOR images NOR observations to work from, return an empty or minimal response. Do NOT fabricate findings.

AGENT: ${agent.name} (${agent.domain}). Tone: ${effectiveTone}. Depth: ${agent.analysisDepth}.
SITE: ${site.name} (${site.siteType}). Context: ${site.context || 'none'}.

Use tones: operational (direct, ops-focused), executive (polished, brief), compliance (formal), forensic (evidentiary).
Use severity: critical | high | moderate | low.

Return ONLY JSON. No markdown fences, no preamble.`;

  let taskText = '';
  let responseSchema = '';
  const imageAttachments: Array<{ type: 'image_url'; image_url: { url: string } }> = [];

  switch (target) {
    case 'executive_summary':
      taskText = `Write or polish the executive summary for report "${reportContext.title}".

${currentDraft ? `PILOT'S CURRENT DRAFT:\n"""${currentDraft}"""\n\nPolish and expand this draft.` : 'No draft yet. Write from scratch based on observations below.'}

OBSERVATIONS IN THIS REPORT (${reportContext.observations.length}):
${reportContext.observations.length > 0
  ? reportContext.observations.map(o => `- #${o.number} ${o.title} [${o.severity}, ${o.confidence}% conf]`).join('\n')
  : '[No observations yet]'}

TEMPLATE INSTRUCTION: ${promptInstruction || 'Provide a 3-4 sentence overview of key findings, prioritized by severity.'}
LENGTH: ${maxLength === 'brief' ? '2-3 sentences' : maxLength === 'detailed' ? '6-8 sentences with depth' : '3-4 sentences'}`;
      responseSchema = '{ "content": "executive summary text" }';
      break;

    case 'perimeter_status':
      taskText = `Write a perimeter/sector status assessment.

${currentDraft ? `PILOT'S CURRENT DRAFT:\n"""${currentDraft}"""\n\nPolish and expand.` : 'No draft yet.'}

OBSERVATIONS IN THIS REPORT:
${reportContext.observations.length > 0
  ? reportContext.observations.map(o => `- #${o.number} ${o.title} [${o.severity}]`).join('\n')
  : '[No observations yet — return minimal text or empty]'}

TEMPLATE INSTRUCTION: ${promptInstruction || 'Assess overall perimeter condition based on observations.'}`;
      responseSchema = '{ "content": "perimeter status text" }';
      break;

    case 'compliance':
      taskText = `Write a compliance assessment.

${currentDraft ? `PILOT'S CURRENT DRAFT:\n"""${currentDraft}"""\n\nPolish.` : ''}

TEMPLATE INSTRUCTION: ${promptInstruction || 'Formal compliance statement covering operational standards.'}`;
      responseSchema = '{ "content": "compliance text" }';
      break;

    case 'custom':
      taskText = `Write content for a custom section titled "${sectionName || 'Custom section'}".

${currentDraft ? `PILOT'S CURRENT DRAFT:\n"""${currentDraft}"""\n\nPolish and expand.` : 'No draft. Write appropriate content for this section name.'}

TEMPLATE INSTRUCTION: ${promptInstruction || 'Write content appropriate to the section name.'}`;
      responseSchema = '{ "content": "section text" }';
      break;

    case 'observation_description': {
      if (observation?.imageUrls && observation.imageUrls.length > 0) {
        observation.imageUrls.filter(u => u && (u.startsWith('data:') || u.startsWith('http'))).slice(0, 5).forEach(url => {
          imageAttachments.push({ type: 'image_url', image_url: { url } });
        });
      }
      const pilotNoteBlock = observation?.imageNotes?.length
        ? `\n\nPILOT NOTES on these images:\n${observation.imageNotes.map((n, i) => `Image ${i + 1}: "${n}"`).join('\n')}`
        : '';
      const pilotContextBlock = observation?.pilotContext
        ? `\n\nPILOT'S OBSERVATION CONTEXT: "${observation.pilotContext}"`
        : '';

      const matchedEventBlock = observation?.matchedEvent
        ? (() => {
            const event = agent.detectionEvents?.find(e => e.name === observation.matchedEvent);
            if (!event) return '';
            return `\n\nTHIS OBSERVATION MATCHED DETECTION EVENT: "${event.name}"\nEvent description (why this matters under the agent's policy): "${event.description}"\nWhen writing, explain WHY this detection is flagged — reference the policy above.`;
          })()
        : '';

      const hasImages = imageAttachments.length > 0;
      const hasPilotContext = !!(observation?.pilotContext?.trim());
      const hasImageNotes = !!(observation?.imageNotes?.length);

      taskText = `Write the AI analysis description for this observation.

OBSERVATION META:
- Title: ${observation?.title || '[untitled]'}
- Severity: ${observation?.severity || 'low'}
- Number of attached images: ${observation?.imageUrls?.length ?? 0}${matchedEventBlock}${pilotContextBlock}${pilotNoteBlock}

${currentDraft ? `PILOT'S CURRENT DRAFT:\n"""${currentDraft}"""\n\nPolish and expand this draft using the images and pilot notes.\n` : ''}

${hasImages ? 'IMAGES ARE ATTACHED ABOVE. Describe what you actually see in the images. DO NOT say "no images were provided" — the images are literally in this message.' : ''}

${!hasImages && hasPilotContext ? `The pilot wrote: "${observation?.pilotContext}". Write the analysis BASED ON THE PILOT'S CONTEXT. The pilot is reporting a real observation — treat their words as the authoritative description of what was seen. Expand the pilot\'s note into a fuller narrative. DO NOT refuse to write because images aren\'t attached — the pilot\'s context is enough.` : ''}

${!hasImages && !hasPilotContext && !hasImageNotes ? 'No images, pilot context, or notes provided. Return a short 1-sentence placeholder like "Observation details pending." — do not fabricate findings.' : ''}

GROUNDING RULES:
- NEVER say "no images were provided" or "visual data unavailable" or any variant. If images are attached, use them. If not, use the pilot's context.
- The pilot's observation context is AUTHORITATIVE. If the pilot says "this is a truck", the subject is a truck — do not describe something else.
- Match the observation title. If the title is "White vehicle", write about a white vehicle — not fence damage or other findings.

LENGTH: ${maxLength === 'brief' ? '2-3 sentences' : '4-6 sentences with specifics'}`;
      responseSchema = '{ "content": "observation analysis" }';
      break;
    }

    case 'recommendations':
      taskText = `Generate recommendations based on the observations.

OBSERVATIONS:
${reportContext.observations.length > 0
  ? reportContext.observations.map(o => `- #${o.number} ${o.title} [${o.severity}]`).join('\n')
  : '[No observations — return empty arrays]'}

${currentDraft ? `PILOT'S CURRENT DRAFTS:\n"""${currentDraft}"""\n\nPolish and expand.` : ''}

Split into immediate (within 24 hours), short-term (this week), long-term (this month+).`;
      responseSchema = '{ "immediate": ["action"], "shortTerm": ["action"], "longTerm": ["action"] }';
      break;
  }

  const userContent: MessageContent =
    imageAttachments.length > 0
      ? [{ type: 'text', text: taskText }, ...imageAttachments, { type: 'text', text: `\n\nOUTPUT JSON: ${responseSchema}` }]
      : `${taskText}\n\nOUTPUT JSON: ${responseSchema}`;

  return {
    systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  };
}

function buildSiteContextPrompts(body: SiteContextRequest): { systemPrompt: string; userPrompt: string } {
  const { siteData } = body;

  const systemPrompt = `You are a drone operations expert helping configure site profiles. Given minimal data from a site registration API, infer reasonable defaults for missing fields and draft a context paragraph that will help AI generate accurate patrol reports for this site.

You must be honest about uncertainty. Where you're guessing, use hedge language ("likely", "appears to be") so the user knows what to verify.

Return ONLY JSON. No preamble.`;

  const userPrompt = `Infer site profile fields from this minimal data:

Site name: "${siteData.name}"
Coordinates: ${siteData.coordinates.lat}°N, ${siteData.coordinates.lng}°E
Devices registered: ${siteData.deviceCount}
Missions logged: ${siteData.missionCount}
Sample mission names: ${siteData.missionNames.slice(0, 5).join(', ') || 'none'}

Return JSON matching this schema:
{
  "description": "1-2 sentence description of what this site likely is, based on its name and device count. Hedge with 'likely' where uncertain.",
  "siteType": "one of: Industrial facility | Storage facility | Power plant | Solar farm | Warehouse | Data center | Construction site | Oil & gas facility | Agricultural site | Port / terminal | Transportation hub | Other",
  "timezone": "IANA timezone name plus abbreviation based on coordinates. e.g. 'Asia/Kolkata (IST)', 'America/New_York (EST)'. Be accurate — coordinates determine timezone precisely.",
  "operatingHours": "Best guess at operating hours. Options: '24/7' | 'Day operations only: 08:00-18:00' | 'Two shifts: 06:00-22:00' | 'Three shifts: 06:00-14:00, 14:00-22:00, 22:00-06:00'. Default to '24/7' if unclear — safer for security/patrol use cases.",
  "location": "Human-readable location string. Format: '{lat}°N, {lng}°E · {City}, {Region/Country}'. Use the coordinates to identify the city. Be accurate — if you're not sure of the exact city, use the nearest major city.",
  "context": "A 3-4 sentence AI context paragraph to help downstream report generation. Include: (1) What this site likely is based on name/coordinates/devices, (2) Any assumptions about operating patterns, (3) A note that the user should add specific details like known problem areas, authorized equipment, security concerns. Use hedging language throughout since this is inferred, not confirmed."
}

Respond with ONLY the JSON object.`;

  return { systemPrompt, userPrompt };
}

function buildExtractTemplatePrompts(body: ExtractTemplateRequest): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are a template extraction assistant for Verkos, a drone patrol report platform. Analyze a sample report and extract a structured template config that will generate future reports in the same voice and structure.
Match the SAMPLE's voice exactly. Do NOT rewrite in a different voice.
For each inferred field, briefly explain which part of the sample led to that inference (store in provenance).
If the sample is NOT a drone/security/patrol/inspection report, flag sampleRelevance: 'low' but still extract what you can.
Extract 2-3 sample observations from the most richly-described findings. Use their actual content — these become few-shot examples.
sampleExecutiveSummary: pull verbatim from the sample if one exists, else synthesize from the first substantive paragraph.
Return ONLY JSON. No preamble, no markdown fences.`;

  const schema = `{
  "sampleRelevance": "high | medium | low",
  "sampleRelevanceNote": "empty string if high, else short note",
  "persona": { "role": "string", "primaryUse": "string", "readingTime": "string", "priorities": "string", "provenance": "string" },
  "narrativeStyle": { "voice": "string", "structure": "string", "vocabulary": "string", "provenance": "string" },
  "sections": [{
    "name": "string",
    "kind": "executive_summary | patrol_overview | observations | perimeter_status | compliance | recommendations | custom",
    "promptInstruction": "how future reports should write this section, in the template's voice",
    "maxLength": "brief | standard | detailed",
    "dataFeeds": { "images": true, "structuredData": false, "narrativeContext": true },
    "provenance": "string"
  }],
  "sampleObservations": [{
    "title": "string",
    "severity": "critical | high | moderate | low",
    "aiDescription": "full description in the sample's voice",
    "provenance": "string"
  }],
  "sampleExecutiveSummary": "1 paragraph in the sample's voice"
}`;

  const userPrompt = `Extract a Verkos patrol report template from this sample.

SOURCE: ${body.sourceLabel || 'sample text'}

SAMPLE TEXT:
"""
${body.sampleText}
"""

Return JSON matching this exact schema:
${schema}

RULES:
- 3-6 sections is typical
- Sections' dataFeeds defaults: observations→images=true, executive_summary/patrol_overview→images=false, most→narrativeContext=true, compliance/perimeter_status→structuredData=true
- 2-3 sampleObservations max. Empty array if none clearly described — note in persona.provenance
- Be honest in provenance sentences when uncertain`;

  return { systemPrompt, userPrompt };
}

function inferSectionKind(name: string): string {
  const lower = name.toLowerCase().trim();
  if (lower.includes('executive') || lower.includes('summary')) return 'executive_summary';
  if (lower.includes('patrol') || lower.includes('overview') || lower.includes('flight')) return 'patrol_overview';
  if (lower.includes('observation') || lower.includes('finding') || lower.includes('detection')) return 'observations';
  if (lower.includes('perimeter') || lower.includes('status') || lower.includes('sector')) return 'perimeter_status';
  if (lower.includes('compliance') || lower.includes('regulation')) return 'compliance';
  if (lower.includes('recommend') || lower.includes('action')) return 'recommendations';
  return 'custom';
}
