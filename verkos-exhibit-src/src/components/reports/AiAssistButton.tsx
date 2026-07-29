import React, { useState } from 'react';

interface AiAssistButtonProps {
  hasContent: boolean;
  onGenerate: () => Promise<void> | void;
  onError?: (err: unknown) => void;
}

const AiAssistButton: React.FC<AiAssistButtonProps> = ({ hasContent, onGenerate, onError }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onGenerate();
    } catch (err) {
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1.5 text-[12px] text-primary-200/70 hover:text-primary-200 transition-colors duration-150 px-2 py-1 rounded-md hover:bg-primary-200/[0.06] disabled:opacity-50 cursor-pointer"
    >
      {loading ? (
        <>
          <i className="fa-solid fa-spinner fa-spin text-[10px]" />
          Generating…
        </>
      ) : (
        <>
          <i className="fa-solid fa-wand-magic-sparkles text-[10px]" />
          {hasContent ? 'Polish with AI' : 'Generate with AI'}
        </>
      )}
    </button>
  );
};

export default AiAssistButton;
