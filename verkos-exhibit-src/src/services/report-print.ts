/**
 * HTML-to-PDF report service.
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Report, Observation, Severity } from '../types/report.types';
import ReportPrintView, { type ReportPrintInput } from '../components/reports/ReportPrintView';

export type { ReportPrintInput };

// EXHIBIT: the print window is a separate document, so it needs its own font
// reference. Point it at the self-hosted stylesheet (absolute, since the popup
// starts at about:blank and cannot resolve a relative path) instead of Google.
const FONTS_HREF =
  typeof window !== 'undefined'
    ? `${window.location.origin}${import.meta.env.BASE_URL || '/'}fonts.css`
    : '/fonts.css';

const PRINT_CSS = `
@import url('${FONTS_HREF}');

@page {
  size: A4;
  margin: 0;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

html, body {
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #fff;
  color: #000;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.report-print-root {
  width: 210mm;
}

.content-page {
  width: 210mm;
  min-height: 297mm;
}

.cover-page {
  break-after: page;
  page-break-after: always;
}

.content-page {
  break-after: page;
  page-break-after: always;
}

.content-page:last-of-type {
  break-after: auto;
  page-break-after: auto;
}

@media print {
  body {
    margin: 0;
  }
  .report-print-root {
    width: 210mm;
  }
}
`;

// ─── Demo input ───────────────────────────────────────────────────────────

export function getDemoPrintInput(): ReportPrintInput {
  return {
    cover: {
      title: 'ROUTINE PERIMETER SECURITY PATROL REPORT',
      site: 'SKYBASE ALPHA',
      date: '2026-04-11',
      author: 'Priya Sharma',
    },
    executiveSummary:
      'Scheduled morning patrol of the east perimeter at Skybase Alpha on April 11, 2026. The M4TD drone completed a full sweep of all 24 waypoints in 12 minutes 45 seconds. AI analysis identified 14 detections across 187 captured images. Three observations require follow-up: an unregistered vehicle near the east gate (high severity), progressive fence deterioration at the south boundary (moderate severity), and authorized construction equipment in the northern loading area (low severity, confirmed by pilot). Overall perimeter status is assessed as operational with targeted attention required at the east gate and south fence section.',
    flightMetadata: {
      drone: 'M4TD',
      dock: 'Dock 3',
      missionType: 'Scheduled patrol',
      durationFormatted: '12m 45s',
      imagesCaptured: 187,
      waypointsCompleted: 24,
      waypointsTotal: 24,
      maxAltitudeM: 25,
      batteryStart: 98,
      batteryEnd: 71,
    },
    statistics: {
      totalDetections: 14,
      severityBreakdown: { critical: 0, high: 1, moderate: 1, low: 12 },
    },
    observations: [
      {
        number: 1,
        title: 'Unauthorized vehicle near east gate',
        severity: 'high',
        confidence: 98,
        aiDescription:
          "A white pickup truck was detected stationary approximately 12 metres from the eastern perimeter gate. The vehicle's license plate is partially obscured by the capture angle. Cross-referencing against the registered fleet database returned no match. The vehicle does not correspond to any scheduled delivery or contractor visit logged for April 11, 2026. Detection confidence is 98%.",
        pilotContext:
          "White truck wasn't here during yesterday's evening patrol. Unfamiliar vehicle. East gate has had two unauthorized access attempts in the past month. Flagging for security team follow-up and access log cross-check.",
        imageCaption: 'East gate approach — 06:22:14 · altitude 18m · M4TD',
        rawImageUrl: '/demo/east-gate-raw.jpg',
        annotatedImageUrl: '/demo/east-gate-annotated.jpg',
      },
      {
        number: 2,
        title: 'Fence damage near south boundary',
        severity: 'moderate',
        confidence: 87,
        aiDescription:
          'Chain-link deformation detected along the southern boundary perimeter fence. The estimated ground-level gap measures approximately 0.5 metres. Vegetation overgrowth partially obscures the full extent of the damage. The deformation pattern is consistent with progressive mechanical stress rather than deliberate forced entry. Compared to imagery from the March 28 patrol, the gap has widened by approximately 15 centimetres.',
        pilotContext:
          'This section was flagged two weeks ago as a minor outward bend. It has clearly worsened since the last ground inspection. The vegetation around it is also getting thicker, making visual checks harder from ground level. Recommend repair priority before next scheduled maintenance window.',
        imageCaption: 'South boundary fence — 06:34:07 · altitude 12m · M4TD',
        rawImageUrl: '/demo/south-fence-raw.jpg',
        annotatedImageUrl: '/demo/south-fence-annotated.jpg',
      },
      {
        number: 3,
        title: 'Construction equipment in loading area',
        severity: 'low',
        confidence: 98,
        aiDescription:
          'Two cement mixer trucks and one forklift identified in the northern loading bay. All vehicles are stationary with no personnel detected in the immediate vicinity at time of capture. Equipment configuration matches the construction crew staging pattern observed during the previous seven patrol cycles. Vehicle identification numbers are consistent with the registered contractor fleet.',
        pilotContext:
          "Construction crew equipment — fully authorized. They've been using this area for the building expansion project for the past three weeks. Equipment count matches the manifest. All accounted for, no concerns.",
        imageCaption: 'Northern loading bay — 06:41:33 · altitude 22m · M4TD',
        rawImageUrl: '/demo/loading-bay-raw.jpg',
        annotatedImageUrl: '/demo/loading-bay-annotated.jpg',
      },
    ],
    recommendations: {
      immediate: [
        "Cross-reference white pickup truck (east gate, 06:22) against today's site access register and CCTV footage from gate camera",
        'Dispatch ground security to verify vehicle identity and current status at east gate',
        'Schedule ground inspection of south boundary fence within 24 hours — gap has widened since last flag',
      ],
      shortTerm: [
        'Confirm construction crew authorization documentation for northern loading area is current and on file',
        'Increase patrol frequency for east gate sector from 2x to 3x daily until vehicle identity is resolved',
        'Clear vegetation along south boundary fence to improve ground-level visibility',
      ],
      longTerm: [
        'Install secondary sensor coverage (fixed camera or motion sensor) on east gate approach to reduce detection latency between drone patrols',
        'Establish monthly fence integrity scoring baseline from aerial imagery to track degradation trends across all perimeter sectors',
        'Evaluate automated alert escalation workflow for high-severity detections to reduce response time from patrol completion to ground action',
      ],
    },
    sections: [
      { id: 'demo-1', kind: 'executive_summary', name: 'Executive summary', content: '', order: 1, enabled: true },
      { id: 'demo-2', kind: 'patrol_overview', name: 'Patrol overview', content: '', order: 2, enabled: true },
      { id: 'demo-3', kind: 'observations', name: 'Observations', content: '', order: 3, enabled: true },
      { id: 'demo-4', kind: 'perimeter_status', name: 'Perimeter status', content: 'Perimeter integrity maintained across monitored sectors. 1 high-severity finding identified requiring targeted response. East gate and south fence sectors flagged for follow-up. All other sectors assessed as operational with no active concerns.', order: 4, enabled: true },
      { id: 'demo-5', kind: 'recommendations', name: 'Recommendations', content: '', order: 5, enabled: true },
    ],
  };
}

// ─── Adapter: in-app Report → PrintInput ─────────────────────────────────

export function reportToPrintInput(report: Report): ReportPrintInput {
  const severityBreakdown: Record<Severity, number> = { critical: 0, high: 0, moderate: 0, low: 0 };
  report.observations.forEach((o: Observation) => {
    severityBreakdown[o.severity] = (severityBreakdown[o.severity] ?? 0) + 1;
  });

  return {
    cover: {
      title: report.title.toUpperCase(),
      site: report.siteName.toUpperCase(),
      date: report.date,
      author: report.author,
    },
    executiveSummary: report.executiveSummary,
    flightMetadata: {
      drone: 'M4TD',
      dock: 'Dock 3',
      missionType: 'Scheduled patrol',
      durationFormatted: '12m 45s',
      imagesCaptured: 187,
      waypointsCompleted: 24,
      waypointsTotal: 24,
      maxAltitudeM: 25,
      batteryStart: 98,
      batteryEnd: 71,
    },
    statistics: {
      totalDetections: report.observations.length,
      severityBreakdown,
    },
    observations: report.observations.map((o: Observation) => ({
      number: o.number,
      title: o.title,
      severity: o.severity,
      confidence: o.confidence,
      aiDescription: o.aiDescription,
      pilotContext: o.pilotContext,
      imageCaption: o.imageCaption,
      rawImageUrl: o.rawImageUrl,
      annotatedImageUrl: o.annotatedImageUrl,
      images: o.images,
    })),
    recommendations: {
      immediate: report.shortTermRecommendations,
      shortTerm: [],
      longTerm: report.longTermRecommendations,
    },
    sections: report.sections?.map((s) => ({
      id: s.id,
      kind: s.kind,
      name: s.name,
      content: s.content,
      order: s.order,
      enabled: s.enabled,
    })),
    customSections: report.customSections,
    flightContextSnapshot: report.flightContextSnapshot,
  };
}

// ─── The actual print flow ─────────────────────────────────────────────────

function resolveUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function openReportPrintWindow(input: ReportPrintInput, filename = 'Verkos Report'): boolean {
  const resolvedInput: ReportPrintInput = {
    ...input,
    observations: input.observations.map((obs) => ({
      ...obs,
      rawImageUrl: resolveUrl(obs.rawImageUrl),
      annotatedImageUrl: resolveUrl(obs.annotatedImageUrl),
      images: obs.images?.map((img) => ({
        ...img,
        url: resolveUrl(img.url) ?? img.url,
      })),
    })),
  };

  const markup = renderToStaticMarkup(React.createElement(ReportPrintView, { data: resolvedInput }));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(filename)}</title>
<style>${PRINT_CSS}</style>
</head>
<body>
${markup}
<script>
  (function waitAndPrint() {
    var trigger = function () {
      window.focus();
      window.print();
    };
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { setTimeout(trigger, 300); });
    } else {
      setTimeout(trigger, 800);
    }
  })();
<\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=1100');
  if (!win) {
    console.error('Pop-up blocked — cannot open print window');
    return false;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
