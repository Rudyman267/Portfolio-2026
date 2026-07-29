export type ReportStatus = 'draft_ready' | 'in_review' | 'finalized' | 'processing';
export type ReportProfile = 'full_operational' | 'executive_summary' | 'compliance' | 'incident' | 'shift_summary';
export type Severity = 'critical' | 'high' | 'moderate' | 'low';
export type ObservationStatus = 'acknowledged' | 'requires_action' | 'resolved';

export interface Mission {
  id: string;
  flightId: string;
  name: string;
  date: string;
  time: string;
  droneName: string;
  dockName: string;
  durationSeconds: number;
  imageCount: number;
  detectionCount: number;
  pilotNoteCount: number;
  highestSeverity: Severity;
  status: ReportStatus;
}

export interface ObservationImage {
  id: string;
  url: string;
  label: string;
  timestamp?: string;
  confidence?: number;
}

export interface Observation {
  id: string;
  number: number;
  title: string;
  severity: Severity;
  status: ObservationStatus;
  aiDescription: string;
  pilotContext: string | null;
  rawImageUrl: string | null;
  annotatedImageUrl: string | null;
  images?: ObservationImage[];
  imageCaption: string;
  confidence: number;
  timestamp: string;
  // NEW — present only when template persona is inspection/compliance-oriented
  impactAssessment?: string;     // priority + consequences paragraph (markdown supported)
  assetId?: string;              // e.g. "Storage Tank 651", inferred from pilot/site context
  imageSubheader?: string;       // short caption above the image, e.g. "Corrosion" or "Vegetation Growth"
  // Note: aiDescription may now contain markdown (**bold**, lists) when depth mode is active
}

// ─── Report Sections ──────────────────────────────────────────────────────

export type ReportSectionKind =
  | 'executive_summary'
  | 'patrol_overview'
  | 'observations'
  | 'perimeter_status'
  | 'compliance'
  | 'recommendations'
  | 'custom';

export interface ReportSection {
  id: string;
  templateSectionId: string | null;
  kind: ReportSectionKind;
  name: string;
  content: string;
  order: number;
  enabled: boolean;
}

export interface Report {
  id: string;
  title: string;
  profile: ReportProfile;
  status: ReportStatus;
  siteName: string;
  date: string;
  author: string;
  missionCount: number;
  executiveSummary: string;
  observations: Observation[];
  shortTermRecommendations: string[];
  longTermRecommendations: string[];
  createdAt: string;
  updatedAt: string;
  agentId: string;
  agentName: string;
  templateId: string;
  flightIds: string[];
  droneName: string | null;
  missionName: string | null;
  sections: ReportSection[];
  isDemo?: boolean;
  customSections?: Array<{
    id: string;
    name: string;
    content: string;
    order: number;
  }>;
  flightContextSnapshot?: FlightContext[];
}

export interface DraftReport {
  id: string;
  mission: Mission;
  status: 'ready_for_review' | 'in_review';
  createdAt: string;
}

// ─── Agents ────────────────────────────────────────────────────────────

export type AgentStatus = 'active' | 'inactive';
export type AgentDomain = 'security' | 'inspection' | 'surveillance' | 'custom';

export type SectionMaxLength = 'brief' | 'standard' | 'detailed';

export interface AgentDetectionEvent {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  defaultSeverity: Severity;
  compareHistorical: boolean;
}

// ─── Template Sections ─────────────────────────────────────────────────

export interface TemplateSectionDataFeeds {
  images: boolean;
  structuredData: boolean;
  narrativeContext: boolean;
}

export interface TemplateSection {
  id: string;
  kind: ReportSectionKind;
  name: string;
  description: string;
  promptInstruction: string;
  enabled: boolean;
  order: number;
  maxLength: SectionMaxLength;
  toneOverride: 'default' | 'operational' | 'executive' | 'compliance' | 'forensic';
  dataFeeds: TemplateSectionDataFeeds;
}

/** @deprecated Use TemplateSection instead */
export type AgentSection = TemplateSection;

export interface Agent {
  id: string;
  name: string;
  description: string;
  domain: AgentDomain;
  status: AgentStatus;
  icon: string;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
  config: {
    detectionEvents: AgentDetectionEvent[];
    analysisDepth: 'basic' | 'standard' | 'detailed';
    tone: 'operational' | 'executive' | 'compliance' | 'forensic';
    autoGenerate: boolean;
    defaultTemplateId: string;
  };
}

// ─── Sites ─────────────────────────────────────────────────────────────

export interface SiteAsset {
  id: string;
  name: string;
  type: string;
  description: string;
}

export interface Site {
  id: string;
  name: string;
  description: string;
  location: string;
  timezone: string;
  operatingHours: string;
  siteType: string;
  assets: SiteAsset[];
  context: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Templates ─────────────────────────────────────────────────────────

export type TemplateStatus = 'active' | 'draft';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  status: TemplateStatus;
  previewImageUrl: string | null;
  isDefault: boolean;
  sections: TemplateSection[];
  coverStyle: 'gradient' | 'minimal' | 'branded';
  pageSize: 'A4' | 'letter';
  createdAt: string;
  updatedAt: string;
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
    severity: Severity;
    aiDescription: string;
  }>;
  sampleExecutiveSummary?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────

export function templateSectionToKind(name: string): ReportSectionKind {
  const lower = name.toLowerCase().trim();
  if (lower.includes('executive') || lower.includes('summary')) return 'executive_summary';
  if (lower.includes('patrol') || lower.includes('overview') || lower.includes('flight')) return 'patrol_overview';
  if (lower.includes('observation') || lower.includes('finding') || lower.includes('detection')) return 'observations';
  if (lower.includes('perimeter') || lower.includes('status') || lower.includes('sector')) return 'perimeter_status';
  if (lower.includes('compliance') || lower.includes('regulation')) return 'compliance';
  if (lower.includes('recommend') || lower.includes('action')) return 'recommendations';
  return 'custom';
}

// ─── Flight Context (HITL) ─────────────────────────────────────────────

export type FlightContextSource = 'typed' | 'transcribed';
export type FlightContextCaptureMode = 'live' | 'retrospective';

export interface FlightContext {
  flightId: string;
  siteId: string;
  text: string;
  imageNotes: Record<string, string>;
  wordCount: number;
  startedAt: string;
  lastEditedAt: string;
  markedComplete: boolean;
  source: FlightContextSource;
  captureMode: FlightContextCaptureMode;
}

// ─── Webhook Flight Events ─────────────────────────────────────────────

export type WebhookEventType =
  | 'mission.execution.started'
  | 'mission.execution.completed'
  | 'mission.waypoint.reached'
  | 'single_media.uploaded.completed';

interface WebhookEnvelope<T extends WebhookEventType, D> {
  eventId: string;
  eventType: T;
  organizationId: string;
  timestamp: string;
  data: D;
}

interface FlightDetailsMission {
  flightId: string; bindingId: string;
  droneId: string | null; droneName: string | null;
  dockId: string | null; dockName: string | null;
}
interface FlightDetailsMedia {
  flightId: string; taskId: string | null;
  droneId: string | null; droneName: string | null;
  dockId: string | null; dockName: string | null;
}
interface SiteDetails { siteId: string; siteName: string | null; }

export type MissionExecutionStartedEvent = WebhookEnvelope<'mission.execution.started', {
  flightDetails: FlightDetailsMission;
  siteDetails: SiteDetails | null;
  missionDetails: {
    missionId: string; missionName: string;
    missionType: 'path' | 'grid' | null;
    totalWaypoints: number; requestType: string;
  };
}>;

export type MissionExecutionCompletedEvent = WebhookEnvelope<'mission.execution.completed', {
  flightDetails: FlightDetailsMission;
  siteDetails: SiteDetails | null;
  missionDetails: {
    missionId: string; missionName: string;
    missionType: 'path' | 'grid' | null;
    totalWaypoints: number; achievedWaypoints: number;
    outcome: 'completed' | 'unaccomplished';
  };
}>;

export type MissionWaypointReachedEvent = WebhookEnvelope<'mission.waypoint.reached', {
  flightDetails: FlightDetailsMission;
  siteDetails: SiteDetails | null;
  missionDetails: {
    missionId: string; missionName: string;
    missionType: 'path' | 'grid' | null;
    totalWaypoints: number;
    currentWaypointNumber: number;
    waypointId: string | null;
  };
}>;

export type SingleMediaUploadedEvent = WebhookEnvelope<'single_media.uploaded.completed', {
  flightDetails: FlightDetailsMedia;
  siteDetails: SiteDetails | null;
  missionDetails: {
    missionId: string; missionName: string | null;
    waypointId: string | null;
  } | null;
  mediaDetails: {
    mediaId: string; fileName: string;
    fileType: 'image' | 'panorama' | 'video';
    size: number | null; uploadedAt: string;
    dataUrl: string | null; thumbnailUrl: string | null;
    location?: { latitude?: number; longitude?: number; altitude?: number };
    lensType?: string | null;
  };
}>;

export type WebhookFlightEvent =
  | MissionExecutionStartedEvent
  | MissionExecutionCompletedEvent
  | MissionWaypointReachedEvent
  | SingleMediaUploadedEvent;

export interface LiveFlight {
  flightId: string; bindingId: string;
  droneName: string | null; dockName: string | null;
  siteId: string; siteName: string | null;
  missionId: string; missionName: string;
  missionType: 'path' | 'grid' | null;
  totalWaypoints: number;
  currentWaypointNumber: number;
  requestType: string;
  startedAt: string;
  latestMediaThumbnailUrl?: string;
  latestMediaCapturedAt?: string;
}

// ─── Wizard Resume State ───────────────────────────────────────────────

export interface WizardResumeState {
  siteIds: string[];
  selectedFlightIds: string[];
  agentId: string | null;
  templateId: string | null;
  returnPath: string;
}
