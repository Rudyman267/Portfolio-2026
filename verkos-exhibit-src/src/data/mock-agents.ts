import { Agent } from '../types/report.types';

export const mockAgents: Agent[] = [
  {
    id: 'agent-security-patrol',
    name: 'Security patrol agent',
    description:
      'Monitors perimeter security during routine patrol flights. Detects unauthorized vehicles, personnel, fence damage, and access violations. Generates operational reports for shift handoff.',
    domain: 'security',
    status: 'active',
    icon: 'fa-solid fa-shield-halved',
    reportCount: 12,
    createdAt: '2026-03-15T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
    config: {
      detectionEvents: [
        { id: 'evt-1', name: 'Vehicle detection', description: 'Identify and classify vehicles within the patrol zone', enabled: true, defaultSeverity: 'high', compareHistorical: true },
        { id: 'evt-2', name: 'Person detection', description: 'Detect individuals in restricted or monitored areas', enabled: true, defaultSeverity: 'moderate', compareHistorical: false },
        { id: 'evt-3', name: 'Perimeter breach', description: 'Identify gaps, cuts, or damage in fencing and barriers', enabled: true, defaultSeverity: 'critical', compareHistorical: true },
        { id: 'evt-4', name: 'Fence damage', description: 'Detect structural deformation, corrosion, or vegetation overgrowth on fence lines', enabled: true, defaultSeverity: 'moderate', compareHistorical: true },
        { id: 'evt-5', name: 'Unauthorized access', description: 'Flag activity at entry points outside of scheduled access windows', enabled: true, defaultSeverity: 'high', compareHistorical: false },
        { id: 'evt-6', name: 'Suspicious behavior', description: 'Detect loitering, circling, or other anomalous movement patterns', enabled: false, defaultSeverity: 'low', compareHistorical: false },
      ],
      analysisDepth: 'detailed',
      tone: 'operational',
      autoGenerate: true,
      defaultTemplateId: 'tpl-verkos-standard',
    },
  },
  {
    id: 'agent-asset-inspection',
    name: 'Asset inspection agent',
    description:
      'Analyzes structural condition of infrastructure assets including tanks, pipelines, and equipment. Detects corrosion, leaks, and damage.',
    domain: 'inspection',
    status: 'inactive',
    icon: 'fa-solid fa-magnifying-glass',
    reportCount: 0,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
    config: {
      detectionEvents: [
        { id: 'evt-10', name: 'Corrosion detection', description: 'Identify surface rust, pitting, and coating failure', enabled: true, defaultSeverity: 'moderate', compareHistorical: false },
        { id: 'evt-11', name: 'Leak detection', description: 'Detect oil, gas, or chemical seepage', enabled: true, defaultSeverity: 'moderate', compareHistorical: false },
        { id: 'evt-12', name: 'Structural damage', description: 'Identify cracks, deformation, and missing components', enabled: true, defaultSeverity: 'moderate', compareHistorical: false },
      ],
      analysisDepth: 'detailed',
      tone: 'compliance',
      autoGenerate: false,
      defaultTemplateId: 'tpl-verkos-standard',
    },
  },
  {
    id: 'agent-night-watch',
    name: 'Night surveillance agent',
    description:
      'Optimized for low-light patrol conditions. Monitors thermal signatures and activity patterns during night shift operations.',
    domain: 'surveillance',
    status: 'inactive',
    icon: 'fa-solid fa-moon',
    reportCount: 0,
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: '2026-04-10T00:00:00Z',
    config: {
      detectionEvents: [
        { id: 'evt-20', name: 'Thermal anomaly', description: 'Detect heat signatures in restricted areas', enabled: true, defaultSeverity: 'moderate', compareHistorical: false },
        { id: 'evt-21', name: 'Movement detection', description: 'Track movement patterns in low-visibility conditions', enabled: true, defaultSeverity: 'moderate', compareHistorical: false },
      ],
      analysisDepth: 'standard',
      tone: 'operational',
      autoGenerate: true,
      defaultTemplateId: 'tpl-verkos-standard',
    },
  },
];
