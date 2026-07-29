/**
 * Print-ready HTML view of a Verkos report.
 *
 * This component is NOT rendered inside the app UI. It is serialized via
 * react-dom/server's renderToStaticMarkup, injected into a new window, and
 * then the browser's native print engine renders it to PDF.
 *
 * All styling is inline (no Tailwind, no shared CSS) so the serialized HTML
 * is fully self-contained. The print window loads DM Sans from Google Fonts
 * via an @import in a <style> tag, which the service file controls.
 *
 * Layout matches the Figma-extracted template: A4 (210mm × 297mm), 32pt
 * page padding, 55/47 inner content padding, 469pt text column.
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Severity, FlightContext } from '../../types/report.types';
import { assetUrl } from '@/exhibit/asset-url';

export interface ReportPrintInput {
  cover: {
    title: string;
    site: string;
    date: string;
    author: string;
  };
  executiveSummary: string;
  flightMetadata?: {
    drone: string;
    dock: string;
    missionType: string;
    durationFormatted: string;
    imagesCaptured: number;
    waypointsCompleted: number;
    waypointsTotal: number;
    maxAltitudeM: number;
    batteryStart: number;
    batteryEnd: number;
  };
  statistics?: {
    totalDetections: number;
    severityBreakdown: Record<Severity, number>;
  };
  observations: Array<{
    number: number;
    title: string;
    severity: Severity;
    confidence: number;
    aiDescription: string;
    pilotContext: string | null;
    imageCaption: string;
    rawImageUrl?: string | null;
    annotatedImageUrl?: string | null;
    images?: Array<{
      id: string;
      url: string;
      label: string;
      confidence?: number;
    }>;
    // NEW — depth-mode fields (inspection/compliance personas)
    impactAssessment?: string;
    assetId?: string;
    imageSubheader?: string;
  }>;
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  sections?: Array<{
    id: string;
    kind: 'executive_summary' | 'patrol_overview' | 'observations' | 'perimeter_status' | 'compliance' | 'recommendations' | 'custom';
    name: string;
    content: string;
    order: number;
    enabled: boolean;
    // Present only when builder emits structural previews (template preview path).
    // When undefined, normal content rendering runs unchanged.
    structural?: {
      maxLength: 'brief' | 'standard' | 'detailed';
      showsImages: boolean;
      showsStructuredData: boolean;
      contentHint: string;
    };
  }>;
  customSections?: Array<{
    id: string;
    name: string;
    content: string;
    order: number;
  }>;
  flightContextSnapshot?: FlightContext[];
}

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High priority',
  moderate: 'Moderate priority',
  low: 'Low priority',
};

const SEVERITY_COLOR: Record<Severity, string> = {
  critical: '#EF4444',
  high: '#F97316',
  moderate: '#EAB308',
  low: '#22C55E',
};

// Shared font-family string. Inline so every element inherits.
const DM = "'DM Sans', sans-serif";

// ─── MarkdownBlock ────────────────────────────────────────────────────
// Inline-styled markdown renderer. Used inside ReportPrintView, which is
// serialized via renderToStaticMarkup — no external CSS, every style inline.
type MarkdownSize = 'body' | 'small';

const mdBaseStyle = (size: MarkdownSize): React.CSSProperties =>
  size === 'small'
    ? { fontFamily: DM, fontWeight: 400, fontSize: '12px', lineHeight: 1.55, color: '#000' }
    : { fontFamily: DM, fontWeight: 500, fontSize: '14px', lineHeight: 1.6, color: '#000' };

export const MarkdownBlock: React.FC<{ children: string; size?: MarkdownSize }> = ({ children, size = 'body' }) => {
  const base = mdBaseStyle(size);
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children: c }) => <p style={{ ...base, marginTop: 0, marginBottom: '10px' }}>{c}</p>,
        strong: ({ children: c }) => <strong style={{ fontWeight: 700, color: '#000' }}>{c}</strong>,
        em: ({ children: c }) => <em style={{ fontStyle: 'italic' }}>{c}</em>,
        ul: ({ children: c }) => <ul style={{ paddingLeft: '20px', margin: '0 0 12px 0', listStyleType: 'disc' }}>{c}</ul>,
        ol: ({ children: c }) => <ol style={{ paddingLeft: '20px', margin: '0 0 12px 0' }}>{c}</ol>,
        li: ({ children: c }) => <li style={{ ...base, marginBottom: '4px' }}>{c}</li>,
        h1: ({ children: c }) => <p style={{ ...base, fontWeight: 700, marginTop: '10px', marginBottom: '6px' }}>{c}</p>,
        h2: ({ children: c }) => <p style={{ ...base, fontWeight: 700, marginTop: '10px', marginBottom: '6px' }}>{c}</p>,
        h3: ({ children: c }) => <p style={{ ...base, fontWeight: 700, marginTop: '8px', marginBottom: '4px' }}>{c}</p>,
        code: ({ children: c }) => (
          <code style={{ fontFamily: 'monospace', background: '#F3F4F6', padding: '1px 4px', borderRadius: '3px', fontSize: '0.92em' }}>{c}</code>
        ),
        table: ({ children: c }) => (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontFamily: DM, fontSize: '12px' }}>{c}</table>
        ),
        thead: ({ children: c }) => <thead style={{ background: '#F5F5F5' }}>{c}</thead>,
        th: ({ children: c }) => (
          <th style={{ padding: '6px 8px', borderBottom: '1px solid #E5E7EB', fontWeight: 700, textAlign: 'left', fontFamily: DM }}>{c}</th>
        ),
        td: ({ children: c }) => (
          <td style={{ padding: '6px 8px', borderBottom: '1px solid #E5E7EB', verticalAlign: 'top', fontFamily: DM }}>{c}</td>
        ),
        a: ({ children: c, href }) => (
          <a href={href} style={{ color: '#2C7BF2', textDecoration: 'none', fontFamily: DM }}>{c}</a>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
};

// ─── Skeleton helpers (template-preview structural mode) ──────────────
const SKELETON_GREY = '#E5E7EB';
const SKELETON_GREY_LIGHT = '#F3F4F6';

const PLACEHOLDER_IMAGES = [
  '/demo/east-gate-raw.jpg',
  '/demo/south-fence-raw.jpg',
  '/demo/loading-bay-raw.jpg',
  '/demo/east-gate-annotated.jpg',
  '/demo/south-fence-annotated.jpg',
  '/demo/loading-bay-annotated.jpg',
].map(assetUrl);

const LINES_BY_LENGTH: Record<'brief' | 'standard' | 'detailed', number> = {
  brief: 3,
  standard: 6,
  detailed: 12,
};

const SKELETON_LINE_WIDTHS = [100, 95, 90, 97, 88, 93, 85, 98, 82, 91, 86, 94];

const SkeletonLines: React.FC<{ count: number }> = ({ count }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          height: '10px',
          background: SKELETON_GREY,
          borderRadius: '3px',
          width: `${SKELETON_LINE_WIDTHS[i % SKELETON_LINE_WIDTHS.length]}%`,
        }}
      />
    ))}
  </div>
);

const SkeletonImagePair: React.FC<{ seedIdx: number }> = ({ seedIdx }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxWidth: '469pt', marginBottom: '16px' }}>
    {[0, 1].map((i) => (
      <div
        key={i}
        style={{
          position: 'relative',
          aspectRatio: '16 / 10.66',
          background: SKELETON_GREY_LIGHT,
          borderRadius: '6px',
          overflow: 'hidden',
        }}
      >
        <img
          src={PLACEHOLDER_IMAGES[(seedIdx + i) % PLACEHOLDER_IMAGES.length]}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.45,
            filter: 'grayscale(1)',
            display: 'block',
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.25)' }} />
      </div>
    ))}
  </div>
);

const SkeletonDataGrid: React.FC = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          background: SKELETON_GREY_LIGHT,
          borderRadius: '8px',
          padding: '16px',
          minHeight: '72px',
        }}
      >
        <div style={{ height: '18px', width: '40%', background: SKELETON_GREY, borderRadius: '3px', marginBottom: '8px' }} />
        <div style={{ height: '10px', width: '70%', background: SKELETON_GREY, borderRadius: '3px' }} />
      </div>
    ))}
  </div>
);

const ContentHintText: React.FC<{ text: string }> = ({ text }) => (
  <p
    style={{
      fontFamily: DM,
      fontWeight: 400,
      fontSize: '12px',
      color: '#9CA3AF',
      fontStyle: 'italic',
      marginTop: '8px',
      marginBottom: '16px',
    }}
  >
    {text}
  </p>
);

type StructuralSection = NonNullable<ReportPrintInput['sections']>[number] & {
  structural: NonNullable<NonNullable<ReportPrintInput['sections']>[number]['structural']>;
};

const StructuralSectionPage: React.FC<{
  section: StructuralSection;
  pageStyle: (base: React.CSSProperties) => React.CSSProperties;
  contentPagePadding: React.CSSProperties;
  innerPadding: React.CSSProperties;
  seedIdx: number;
}> = ({ section, pageStyle, contentPagePadding, innerPadding, seedIdx }) => {
  const lineCount = LINES_BY_LENGTH[section.structural.maxLength];
  return (
    <section
      className="content-page"
      style={pageStyle({
        ...contentPagePadding,
        width: '210mm',
        minHeight: '297mm',
        pageBreakAfter: 'always',
        breakAfter: 'page',
        background: '#fff',
        color: '#000',
        boxSizing: 'border-box' as const,
      })}
    >
      <div style={innerPadding}>
        <h2 style={sectionHeader}>{section.name}</h2>
        <ContentHintText text={section.structural.contentHint} />
        {section.structural.showsStructuredData && <SkeletonDataGrid />}
        <SkeletonLines count={lineCount} />
        {section.structural.showsImages && (
          <>
            <SkeletonImagePair seedIdx={seedIdx} />
            <SkeletonLines count={Math.max(2, Math.floor(lineCount / 2))} />
            {section.structural.maxLength === 'detailed' && (
              <SkeletonImagePair seedIdx={seedIdx + 2} />
            )}
          </>
        )}
      </div>
    </section>
  );
};

const contentPagePadding: React.CSSProperties = {
  padding: '32pt',
};

const innerPadding: React.CSSProperties = {
  padding: '47pt 55pt',
  width: '469pt',
  margin: '0 auto',
};

const sectionHeader: React.CSSProperties = {
  fontFamily: DM,
  fontWeight: 700,
  fontSize: '24px',
  color: '#000',
  lineHeight: 1.25,
  marginBottom: '16px',
};

const sectionSubheader: React.CSSProperties = {
  fontFamily: DM,
  fontWeight: 500,
  fontSize: '14px',
  marginBottom: '6px',
};

const bodyText: React.CSSProperties = {
  fontFamily: DM,
  fontWeight: 500,
  fontSize: '14px',
  color: '#000',
  lineHeight: 1.6,
};

const PreFlightContextBlock: React.FC<{ contexts: FlightContext[] }> = ({ contexts }) => {
  const visible = contexts.filter((c) => c.text.trim() || Object.keys(c.imageNotes).length > 0);
  if (visible.length === 0) return null;
  return (
    <section
      className="pre-flight-context-block"
      style={{
        marginTop: '16pt',
        padding: '12pt',
        background: '#F5F8FC',
        borderLeft: '3pt solid #2C7BF2',
        borderRadius: '4pt',
      }}
    >
      <h3 style={{ fontFamily: DM, fontWeight: 600, fontSize: '13pt', marginBottom: '6pt' }}>
        Pre-flight context
      </h3>
      <p style={{ fontFamily: DM, fontSize: '10pt', color: '#666', marginBottom: '8pt' }}>
        Notes captured by the pilot before report generation.
      </p>
      {visible.map((ctx, i) => {
        const noteKeys = Object.keys(ctx.imageNotes);
        return (
          <div key={ctx.flightId} style={{ marginBottom: '8pt' }}>
            <div style={{ fontFamily: DM, fontSize: '10pt', fontWeight: 600, color: '#444' }}>
              Flight {i + 1} ({ctx.captureMode}) · {new Date(ctx.startedAt).toLocaleString()}
            </div>
            {ctx.text.trim() && (
              <div style={{ fontFamily: DM, fontSize: '11pt', marginTop: '2pt', whiteSpace: 'pre-wrap' }}>
                {ctx.text}
              </div>
            )}
            {noteKeys.length > 0 && (
              <div style={{ fontSize: '10pt', color: '#555', marginTop: '4pt', fontStyle: 'italic' }}>
                + {noteKeys.length} image-specific note{noteKeys.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
};


export const ReportPrintView: React.FC<{ data: ReportPrintInput; previewMode?: boolean }> = ({ data, previewMode = false }) => {
  const statFormat = (value: string | number) => <span style={{ fontFamily: DM, fontWeight: 700, fontSize: '20px', color: '#000' }}>{value}</span>;

  const pageStyle = (base: React.CSSProperties): React.CSSProperties =>
    previewMode
      ? {
          ...base,
          width: '210mm',
          minHeight: '297mm',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '24px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
          background: base.background || '#fff',
          boxSizing: 'border-box' as const,
        }
      : base;

  const isStructural =
    data.cover.site === 'Sample site' &&
    data.cover.date === 'Date' &&
    data.cover.author === 'Author';

  return (
    <div className="report-print-root">
      {/* ─── Cover ────────────────────────────────────────────────────── */}
      <section
        className="cover-page"
        style={pageStyle({
          width: '210mm',
          height: '297mm',
          background: 'linear-gradient(to bottom, #00CD96, #A539C3)',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '162pt 156pt',
          pageBreakAfter: 'always',
          breakAfter: 'page',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
          boxSizing: 'border-box',
        })}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16pt' }}>
          {/* Client logo placeholder */}
          <div
            style={{
              width: '88pt',
              height: '88pt',
              background: '#fff',
              borderRadius: '8pt',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: DM,
              fontWeight: 700,
              fontSize: '48pt',
              color: '#00CD96',
              lineHeight: 1,
            }}
          >
            T
          </div>
          {/* Report title */}
          <h1
            style={{
              fontFamily: DM,
              fontWeight: 700,
              fontSize: '23pt',
              lineHeight: 1.3,
              textAlign: 'center',
              textTransform: 'uppercase',
              maxWidth: '382pt',
              color: '#fff',
              opacity: isStructural && data.cover.title === 'PATROL REPORT' ? 0.65 : 1,
            }}
          >
            {data.cover.title}
          </h1>
        </div>

        {/* Detail rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6pt', width: '216pt' }}>
          {[
            ['Report Prepared For', data.cover.site],
            ['Inspected on', data.cover.date],
            ['Report Prepared By', data.cover.author],
            ...(data.flightContextSnapshot && data.flightContextSnapshot.length > 0
              ? [[
                  'Pilot pre-flight notes',
                  `${data.flightContextSnapshot.reduce((sum, c) => sum + c.wordCount, 0)} words · ${data.flightContextSnapshot.length} flight${data.flightContextSnapshot.length !== 1 ? 's' : ''}`,
                ] as [string, string]]
              : []),
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: DM, fontSize: '15px', color: '#fff' }}>
              <span style={{ fontWeight: 400 }}>{label}</span>
              <span style={{ fontWeight: 700, opacity: isStructural ? 0.55 : 1 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Brand row + human-reviewed */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16pt' }}>
          <div style={{ display: 'flex', gap: '32pt', alignItems: 'center' }}>
            <span style={{ fontFamily: DM, fontWeight: 700, fontSize: '18pt', color: '#fff' }}>flytbase</span>
            <span style={{ fontFamily: DM, fontWeight: 700, fontSize: '18pt', color: '#fff' }}>verkos</span>
          </div>
          <p style={{ fontFamily: DM, fontWeight: 400, fontSize: '12px', color: '#fff', textAlign: 'center' }}>
            Human-reviewed and approved prior to release.
          </p>
        </div>
      </section>

      {/* ─── Dynamic section rendering ─────────────────────────────── */}
      {data.sections && data.sections.length > 0 ? (
        (() => {
          const sortedSections = data.sections.filter((s) => s.enabled).sort((a, b) => a.order - b.order);
          const pages: React.ReactElement[] = [];

          sortedSections.forEach((section) => {
            if (section.structural) {
              pages.push(
                <StructuralSectionPage
                  key={section.id}
                  section={section as StructuralSection}
                  pageStyle={pageStyle}
                  contentPagePadding={contentPagePadding}
                  innerPadding={innerPadding}
                  seedIdx={sortedSections.indexOf(section)}
                />
              );
              return;
            }
            if (section.kind === 'executive_summary') {
              pages.push(
                <section key={section.id} className="content-page" style={pageStyle({ ...contentPagePadding, width: '210mm', minHeight: '297mm', pageBreakAfter: 'always', breakAfter: 'page', background: '#fff', color: '#000', boxSizing: 'border-box' as const })}>
                  <div style={innerPadding}>
                    <ExecutiveSummaryBlock text={data.executiveSummary} />
                    {data.flightContextSnapshot && data.flightContextSnapshot.length > 0 && (
                      <PreFlightContextBlock contexts={data.flightContextSnapshot} />
                    )}
                    {/* If patrol_overview is the next section, include it on same page */}
                    {(() => {
                      const nextSection = sortedSections.find((s) => s.kind === 'patrol_overview');
                      if (nextSection && data.flightMetadata && data.statistics) {
                        return <PatrolOverviewBlock metadata={data.flightMetadata} statistics={data.statistics} statFormat={statFormat} />;
                      }
                      return null;
                    })()}
                  </div>
                </section>
              );
            } else if (section.kind === 'patrol_overview') {
              // Already rendered with executive_summary if both exist
              const hasExecSummary = sortedSections.some((s) => s.kind === 'executive_summary');
              if (!hasExecSummary && data.flightMetadata && data.statistics) {
                pages.push(
                  <section key={section.id} className="content-page" style={pageStyle({ ...contentPagePadding, width: '210mm', minHeight: '297mm', pageBreakAfter: 'always', breakAfter: 'page', background: '#fff', color: '#000', boxSizing: 'border-box' as const })}>
                    <div style={innerPadding}>
                      <PatrolOverviewBlock metadata={data.flightMetadata} statistics={data.statistics} statFormat={statFormat} />
                    </div>
                  </section>
                );
              }
            } else if (section.kind === 'observations') {
              data.observations.forEach((obs) => {
                pages.push(
                  <section
                    key={`${section.id}-${obs.number}`}
                    className="content-page"
                    style={pageStyle({ ...contentPagePadding, width: '210mm', minHeight: '297mm', pageBreakAfter: 'always', breakAfter: 'page', pageBreakInside: 'avoid', background: '#fff', color: '#000', boxSizing: 'border-box' as const })}
                  >
                    <div style={innerPadding}>
                      <h2 style={sectionHeader}>Observation #{obs.number}: {obs.title}</h2>
                      {obs.assetId && (
                        <p style={{ fontFamily: DM, fontWeight: 700, fontSize: '12px', color: '#666', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Asset ID: <span style={{ fontWeight: 500, color: '#000', textTransform: 'none', letterSpacing: 0 }}>{obs.assetId}</span>
                        </p>
                      )}
                      <p style={{ ...sectionSubheader, color: SEVERITY_COLOR[obs.severity] }}>{SEVERITY_LABEL[obs.severity]}</p>
                      <p style={{ fontFamily: DM, fontWeight: 400, fontSize: '12px', color: '#999', marginBottom: '24px' }}>
                        AI detection confidence: {obs.confidence}%
                      </p>
                      {obs.impactAssessment ? (
                        <>
                          <p style={{ fontFamily: DM, fontWeight: 700, fontSize: '13px', color: '#000', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Description</p>
                          <div style={{ marginBottom: '20px' }}>
                            <MarkdownBlock>{obs.aiDescription}</MarkdownBlock>
                          </div>
                          <p style={{ fontFamily: DM, fontWeight: 700, fontSize: '13px', color: '#000', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Impact Assessment</p>
                          <div style={{ marginBottom: '24px' }}>
                            <MarkdownBlock>{obs.impactAssessment}</MarkdownBlock>
                          </div>
                        </>
                      ) : (
                        <div style={{ marginBottom: '24px' }}>
                          <MarkdownBlock>{obs.aiDescription}</MarkdownBlock>
                        </div>
                      )}
                      {obs.pilotContext && (
                        <div style={{ marginBottom: '24px' }}>
                          <p style={{ fontFamily: DM, fontWeight: 700, fontSize: '12px', color: '#666', marginBottom: '6px' }}>Pilot observation</p>
                          <p style={{ fontFamily: DM, fontWeight: 400, fontSize: '14px', color: '#444', fontStyle: 'italic', lineHeight: 1.6 }}>{obs.pilotContext}</p>
                        </div>
                      )}
                      {obs.imageSubheader && (
                        <p style={{ fontFamily: DM, fontWeight: 700, fontSize: '14px', color: '#000', marginBottom: '8px' }}>{obs.imageSubheader}</p>
                      )}
                      {(() => {
                        const allImages = obs.images?.length
                          ? obs.images
                          : [
                              ...(obs.rawImageUrl ? [{ id: 'raw', url: obs.rawImageUrl, label: 'Raw capture', confidence: undefined }] : []),
                              ...(obs.annotatedImageUrl ? [{ id: 'annotated', url: obs.annotatedImageUrl, label: 'AI annotated', confidence: obs.confidence }] : []),
                            ];
                        if (allImages.length === 0) {
                          return (
                            <div style={{ width: '400pt', aspectRatio: '16 / 10.66', background: '#F0F0F0', border: '1px solid #E0E0E0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontFamily: DM, fontWeight: 500, fontSize: '12px', color: '#999' }}>
                              [No images attached]
                            </div>
                          );
                        }
                        return (
                          <div style={{ display: 'grid', gridTemplateColumns: allImages.length === 1 ? '1fr' : '1fr 1fr', gap: '12px', margin: '0 auto 16px auto', maxWidth: '469pt' }}>
                            {allImages.map((img) => (
                              <div key={img.id} style={{ position: 'relative' }}>
                                <img src={img.url} alt={img.label} style={{ width: '100%', aspectRatio: '16/10.66', objectFit: 'cover', borderRadius: '6px', display: 'block' }} />
                                <span style={{ position: 'absolute', bottom: '8px', left: '8px', fontFamily: DM, fontSize: '10px', color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '3px' }}>{img.label}</span>
                                {img.confidence !== undefined && img.confidence > 0 && (
                                  <span style={{ position: 'absolute', top: '8px', right: '8px', fontFamily: DM, fontSize: '10px', color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '3px' }}>{img.confidence}%</span>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                      <p style={{ fontFamily: DM, fontWeight: 500, fontSize: '14px', color: '#666', textAlign: 'center' }}>
                        {obs.impactAssessment ? `Fig ${obs.number}: ${obs.imageCaption}` : obs.imageCaption}
                      </p>
                    </div>
                  </section>
                );
              });
            } else if (section.kind === 'recommendations') {
              pages.push(
                <section key={section.id} className="content-page" style={pageStyle({ ...contentPagePadding, width: '210mm', minHeight: '297mm', background: '#fff', color: '#000', boxSizing: 'border-box' as const })}>
                  <div style={innerPadding}>
                    <h2 style={sectionHeader}>{section.name}</h2>
                    <RecommendationGroup title="Immediate actions" items={data.recommendations.immediate} />
                    <RecommendationGroup title="Short-term" items={data.recommendations.shortTerm} />
                    <RecommendationGroup title="Long-term" items={data.recommendations.longTerm} />
                  </div>
                </section>
              );
            } else {
              // perimeter_status, compliance, custom
              pages.push(
                <section key={section.id} className="content-page" style={pageStyle({ ...contentPagePadding, width: '210mm', minHeight: '297mm', pageBreakAfter: 'always', breakAfter: 'page', background: '#fff', color: '#000', boxSizing: 'border-box' as const })}>
                  <div style={innerPadding}>
                    <h2 style={sectionHeader}>{section.name}</h2>
                    {section.content ? (
                      <MarkdownBlock>{section.content}</MarkdownBlock>
                    ) : (
                      <p style={bodyText}>[No content yet]</p>
                    )}
                  </div>
                </section>
              );
            }
          });

          return pages;
        })()
      ) : (
        // Fallback: old hardcoded rendering for reports without sections array
        <>
          <section className="content-page" style={pageStyle({ ...contentPagePadding, width: '210mm', minHeight: '297mm', pageBreakAfter: 'always', breakAfter: 'page', background: '#fff', color: '#000', boxSizing: 'border-box' as const })}>
            <div style={innerPadding}>
              <ExecutiveSummaryBlock text={data.executiveSummary} />
              {data.flightContextSnapshot && data.flightContextSnapshot.length > 0 && (
                <PreFlightContextBlock contexts={data.flightContextSnapshot} />
              )}
              {data.flightMetadata && data.statistics && (
                <PatrolOverviewBlock metadata={data.flightMetadata} statistics={data.statistics} statFormat={statFormat} />
              )}
            </div>
          </section>
          {data.observations.map((obs) => (
            <section key={obs.number} className="content-page" style={pageStyle({ ...contentPagePadding, width: '210mm', minHeight: '297mm', pageBreakAfter: 'always', breakAfter: 'page', pageBreakInside: 'avoid', background: '#fff', color: '#000', boxSizing: 'border-box' as const })}>
              <div style={innerPadding}>
                <h2 style={sectionHeader}>Observation #{obs.number}: {obs.title}</h2>
                <p style={{ ...sectionSubheader, color: SEVERITY_COLOR[obs.severity] }}>{SEVERITY_LABEL[obs.severity]}</p>
                <p style={{ fontFamily: DM, fontWeight: 400, fontSize: '12px', color: '#999', marginBottom: '24px' }}>AI detection confidence: {obs.confidence}%</p>
                <p style={{ ...bodyText, marginBottom: '24px' }}>{obs.aiDescription}</p>
                {obs.pilotContext && (
                  <div style={{ marginBottom: '24px' }}>
                    <p style={{ fontFamily: DM, fontWeight: 700, fontSize: '12px', color: '#666', marginBottom: '6px' }}>Pilot observation</p>
                    <p style={{ fontFamily: DM, fontWeight: 400, fontSize: '14px', color: '#444', fontStyle: 'italic', lineHeight: 1.6 }}>{obs.pilotContext}</p>
                  </div>
                )}
                <p style={{ fontFamily: DM, fontWeight: 500, fontSize: '14px', color: '#666', textAlign: 'center' }}>{obs.imageCaption}</p>
              </div>
            </section>
          ))}
          <section className="content-page" style={pageStyle({ ...contentPagePadding, width: '210mm', minHeight: '297mm', background: '#fff', color: '#000', boxSizing: 'border-box' as const })}>
            <div style={innerPadding}>
              <h2 style={sectionHeader}>Recommendations</h2>
              <RecommendationGroup title="Immediate actions" items={data.recommendations.immediate} />
              <RecommendationGroup title="Short-term" items={data.recommendations.shortTerm} />
              <RecommendationGroup title="Long-term" items={data.recommendations.longTerm} />
            </div>
          </section>
        </>
      )}

      {/* Custom pilot-added sections */}
      {data.customSections?.map((section) => (
        <section
          key={section.id}
          className="content-page"
          style={pageStyle({ ...contentPagePadding, width: '210mm', minHeight: '297mm', pageBreakAfter: 'always', breakAfter: 'page', background: '#fff', color: '#000', boxSizing: 'border-box' as const })}
        >
          <div style={innerPadding}>
            <h2 style={sectionHeader}>{section.name || 'Untitled section'}</h2>
            <MarkdownBlock>{section.content || '[No content]'}</MarkdownBlock>
          </div>
        </section>
      ))}
    </div>
  );
};

// ─── Blocks ──────────────────────────────────────────────────────────

const ExecutiveSummaryBlock: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ marginBottom: '32px' }}>
    <h2 style={sectionHeader}>Executive Summary</h2>
    <MarkdownBlock>{text}</MarkdownBlock>
  </div>
);

const PatrolOverviewBlock: React.FC<{
  metadata: NonNullable<ReportPrintInput['flightMetadata']>;
  statistics: NonNullable<ReportPrintInput['statistics']>;
  statFormat: (v: string | number) => React.ReactElement;
}> = ({ metadata: f, statistics: s, statFormat }) => {
  const sev = s.severityBreakdown;
  return (
    <div>
      <h2 style={sectionHeader}>Patrol Overview</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        {[
          ['Flight duration', f.durationFormatted],
          ['Detections', String(s.totalDetections)],
          ['Coverage', `${f.waypointsCompleted}/${f.waypointsTotal}`],
        ].map(([label, value]) => (
          <div key={label} style={{ background: '#F5F5F5', borderRadius: '8px', padding: '16px' }}>
            {statFormat(value)}
            <div style={{ fontFamily: DM, fontWeight: 400, fontSize: '14px', color: '#666', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>
      <p style={{ fontFamily: DM, fontWeight: 400, fontSize: '14px', color: '#666', marginBottom: '8px' }}>
        Severity: {sev.critical} critical · {sev.high} high · {sev.moderate} moderate · {sev.low} low
      </p>
      <p style={{ fontFamily: DM, fontWeight: 400, fontSize: '13px', color: '#888', lineHeight: 1.5 }}>
        {f.drone} · {f.dock} · {f.missionType} · altitude {f.maxAltitudeM}m · battery {f.batteryStart}% to {f.batteryEnd}% · {f.imagesCaptured} images captured
      </p>
    </div>
  );
};

const RecommendationGroup: React.FC<{ title: string; items: string[] }> = ({ title, items }) => {
  if (items.length === 0) return null;
  return (
    <div style={{ marginBottom: '16px' }}>
      <h3 style={{ fontFamily: DM, fontWeight: 700, fontSize: '16px', color: '#000', marginBottom: '8px' }}>{title}</h3>
      <ol style={{ listStylePosition: 'outside', paddingLeft: '20px', margin: 0 }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontFamily: DM, fontWeight: 400, fontSize: '14px', color: '#000', lineHeight: 1.6, marginBottom: '6px' }}>
            {item}
          </li>
        ))}
      </ol>
    </div>
  );
};

export default ReportPrintView;
