import React from 'react';

interface ScratchFlowProps {
  onBack: () => void;
}

const ScratchFlow: React.FC<ScratchFlowProps> = ({ onBack }) => {
  return (
    <div>
      <div className="px-6 pt-6 pb-4">
        <button
          onClick={onBack}
          className="text-[12px] text-white/[0.45] hover:text-white/[0.75] mb-3 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <i className="fa-solid fa-arrow-left text-[10px]" />
          Back to options
        </button>
        <h2 className="text-[16px] font-semibold text-white/[0.92] mb-1">Start from scratch</h2>
        <p className="text-[13px] text-white/[0.42]">
          A few questions and we'll build a template tailored to your reader
        </p>
      </div>

      <div className="px-6 pb-8">
        <div className="bg-[#1C1C1F] border border-dashed border-white/[0.10] rounded-xl py-12 px-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/[0.04] flex items-center justify-center">
            <i className="fa-solid fa-wand-magic-sparkles text-white/[0.30] text-[18px]" />
          </div>
          <p className="text-[14px] text-white/[0.70] font-medium mb-1">Coming next</p>
          <p className="text-[12px] text-white/[0.40]">Guided template builder is on the way</p>
        </div>
      </div>
    </div>
  );
};

export default ScratchFlow;
