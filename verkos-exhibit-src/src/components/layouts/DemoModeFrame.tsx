import React from 'react';
import { useReportStore } from '../../store/report.store';

const DemoModeFrame: React.FC = () => {
  const demoMode = useReportStore((s) => s.demoMode);

  if (!demoMode) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
      aria-hidden="true"
    >
      {/* Gradient border via pseudo-element technique: outer gradient, inner dark cutout */}
      <div
        className="absolute inset-0 animate-demoFramePulse"
        style={{
          background: 'linear-gradient(135deg, #00CD96, #A539C3)',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: '2px',
        }}
      />
      {/* Soft inner glow */}
      <div
        className="absolute inset-0 animate-demoFramePulse"
        style={{
          boxShadow: 'inset 0 0 40px rgba(0, 205, 150, 0.08), inset 0 0 40px rgba(165, 57, 195, 0.08)',
        }}
      />
    </div>
  );
};

export default DemoModeFrame;
