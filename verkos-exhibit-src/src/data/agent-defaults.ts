import type { AgentDomain, AgentDetectionEvent } from '../types/report.types';

export interface DomainInfo {
  value: AgentDomain;
  label: string;
  icon: string;
  description: string;
  exampleDescriptions: string[];
}

export const DOMAIN_INFO: DomainInfo[] = [
  {
    value: 'security',
    label: 'Security',
    icon: 'fa-solid fa-shield-halved',
    description: 'Monitors perimeters, detects intrusions, and flags unauthorized access',
    exampleDescriptions: [
      'Monitors security perimeter and detects unauthorized access',
      'Patrols facility boundaries and reports suspicious activity',
      'Inspects access points, fences, and restricted zones for breaches',
      'Identifies vehicles and personnel in controlled areas',
    ],
  },
  {
    value: 'inspection',
    label: 'Inspection',
    icon: 'fa-solid fa-magnifying-glass',
    description: 'Assesses equipment condition, tracks degradation, and spots defects',
    exampleDescriptions: [
      'Inspects industrial equipment for wear, corrosion, and damage',
      'Monitors infrastructure condition and tracks degradation over time',
      'Identifies structural defects and maintenance needs across assets',
      'Evaluates equipment status and flags items requiring repair',
    ],
  },
  {
    value: 'surveillance',
    label: 'Surveillance',
    icon: 'fa-solid fa-eye',
    description: 'Detects movement, thermal signatures, and environmental changes',
    exampleDescriptions: [
      'Provides persistent area monitoring with thermal and visual analysis',
      'Detects movement, wildlife activity, and environmental anomalies',
      'Monitors large areas for changes in activity patterns over time',
      'Tracks thermal signatures and identifies unusual environmental shifts',
    ],
  },
  {
    value: 'custom',
    label: 'Custom',
    icon: 'fa-solid fa-robot',
    description: 'Build from scratch — define your own detection events and behavior',
    exampleDescriptions: [
      'Describe what this agent monitors and how it generates reports',
      'Custom monitoring agent for specialized operations',
      'Multi-purpose agent combining detection across domains',
    ],
  },
];

let _nextId = 1;
const makeId = () => `evt-new-${Date.now()}-${_nextId++}`;

export function defaultDetectionEventsForDomain(domain: AgentDomain): AgentDetectionEvent[] {
  switch (domain) {
    case 'security':
      return [
        {
          id: makeId(),
          name: 'Unauthorized vehicle',
          description: 'Flag any vehicle not matched against the registered fleet database. Include license plate visibility, proximity to restricted zones, and time of detection.',
          enabled: true,
          defaultSeverity: 'high',
          compareHistorical: false,
        },
        {
          id: makeId(),
          name: 'Perimeter breach',
          description: 'Detect fence damage, open gates, or any gap in the physical perimeter. Note the approximate size of the gap and whether it shows signs of forced entry vs. gradual wear.',
          enabled: true,
          defaultSeverity: 'high',
          compareHistorical: true,
        },
        {
          id: makeId(),
          name: 'Lighting failure',
          description: 'Identify non-functional or degraded lighting along patrol routes and perimeter zones. Compare against expected illumination levels from previous patrols.',
          enabled: true,
          defaultSeverity: 'moderate',
          compareHistorical: true,
        },
        {
          id: makeId(),
          name: 'Unauthorized person',
          description: 'Flag any person detected in restricted areas outside of scheduled work hours. Note clothing, direction of movement, and proximity to sensitive assets.',
          enabled: true,
          defaultSeverity: 'high',
          compareHistorical: false,
        },
      ];
    case 'inspection':
      return [
        {
          id: makeId(),
          name: 'Equipment damage',
          description: 'Identify visible physical damage to equipment including dents, cracks, broken components, or missing parts. Note the affected component and estimated severity.',
          enabled: true,
          defaultSeverity: 'high',
          compareHistorical: true,
        },
        {
          id: makeId(),
          name: 'Corrosion or wear',
          description: 'Detect surface corrosion, rust, paint degradation, or material wear on structures and equipment. Compare against baseline imagery when available.',
          enabled: true,
          defaultSeverity: 'moderate',
          compareHistorical: true,
        },
        {
          id: makeId(),
          name: 'Fluid leak',
          description: 'Identify stains, pooling, or active drips around equipment, pipes, or storage containers. Note the color and approximate volume of the leak.',
          enabled: true,
          defaultSeverity: 'high',
          compareHistorical: false,
        },
        {
          id: makeId(),
          name: 'Structural misalignment',
          description: 'Detect sagging, tilting, displacement, or deformation in structural elements like beams, supports, or panels.',
          enabled: true,
          defaultSeverity: 'moderate',
          compareHistorical: true,
        },
      ];
    case 'surveillance':
      return [
        {
          id: makeId(),
          name: 'Thermal anomaly',
          description: 'Flag unexpected heat signatures that deviate from normal baseline temperatures. Include location, estimated temperature differential, and possible cause.',
          enabled: true,
          defaultSeverity: 'moderate',
          compareHistorical: true,
        },
        {
          id: makeId(),
          name: 'Movement detection',
          description: 'Identify unexpected movement in monitored areas during off-hours or in restricted zones. Note direction, speed, and whether the source is human, vehicle, or animal.',
          enabled: true,
          defaultSeverity: 'moderate',
          compareHistorical: false,
        },
        {
          id: makeId(),
          name: 'Wildlife activity',
          description: 'Log animal sightings that may affect operations, damage equipment, or indicate environmental changes. Low severity unless near critical infrastructure.',
          enabled: true,
          defaultSeverity: 'low',
          compareHistorical: false,
        },
        {
          id: makeId(),
          name: 'Lighting failure',
          description: 'Identify non-functional lighting in surveilled areas that could create blind spots in coverage.',
          enabled: true,
          defaultSeverity: 'moderate',
          compareHistorical: true,
        },
      ];
    case 'custom':
    default:
      return [];
  }
}
