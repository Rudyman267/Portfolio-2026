import React, { useRef, useEffect } from 'react';

interface ExecutiveSummaryProps {
  summary: string;
  editable?: boolean;
  onSummaryChange?: (summary: string) => void;
}

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ summary, editable = false, onSummaryChange }) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, [summary]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
    onSummaryChange?.(e.target.value);
  };

  return (
    <div
      className="mb-4 bg-[#161618] border border-white/[0.08] rounded-xl p-5"
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
    >
      <div className="mb-3">
        <p className="text-[11px] uppercase tracking-wider text-white/[0.30] font-medium">Executive Summary</p>
      </div>
      {editable ? (
        <textarea
          ref={ref}
          value={summary}
          onChange={handleInput}
          className="bg-transparent border-0 p-0 m-0 w-full resize-none text-[14px] text-white/[0.80] leading-[1.7] focus:outline-none placeholder:text-white/[0.20]"
          placeholder="Executive summary..."
        />
      ) : (
        <p className="fb-body-2 text-white/[0.85] leading-relaxed max-w-[65ch]">{summary}</p>
      )}
    </div>
  );
};

export default ExecutiveSummary;
