import React from 'react';
import { useNavigate } from '@tanstack/react-router';

interface Props {
  returnPath: string;
}

const ResumeWizardBanner: React.FC<Props> = ({ returnPath }) => {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-primary-200/10 border border-primary-200/20 rounded-lg mb-3">
      <div className="flex items-center gap-2 text-[13px] text-white/[0.85]">
        <i className="fa-solid fa-circle-arrow-left text-primary-200" />
        You were creating a report. Return when context is added.
      </div>
      <button
        onClick={() => navigate({ to: returnPath })}
        className="px-3 py-1 rounded-md bg-primary-200 text-black text-[12px] font-medium cursor-pointer hover:bg-primary-200/90"
      >
        Resume report creation
      </button>
    </div>
  );
};

export default ResumeWizardBanner;
