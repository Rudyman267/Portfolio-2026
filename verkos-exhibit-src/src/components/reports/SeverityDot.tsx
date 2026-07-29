import React from 'react';
import { Severity } from '../../types/report.types';

interface SeverityDotProps {
  severity: Severity;
}

const colorMap: Record<Severity, string> = {
  critical: 'bg-error-30',
  high: 'bg-warning-30',
  moderate: 'bg-caution-30',
  low: 'bg-success-30',
};

const labelMap: Record<Severity, string> = {
  critical: 'Critical severity',
  high: 'High severity',
  moderate: 'Moderate severity',
  low: 'Low severity',
};

const SeverityDot: React.FC<SeverityDotProps> = ({ severity }) => {
  return (
    <span
      role="img"
      aria-label={labelMap[severity]}
      className={`w-2 h-2 rounded-full inline-block flex-shrink-0 ${colorMap[severity]}`}
    />
  );
};

export default SeverityDot;
