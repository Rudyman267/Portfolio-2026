import React from 'react';

interface RecommendationsSectionProps {
  shortTerm: string[];
  longTerm: string[];
  editable?: boolean;
  onShortTermChange?: (items: string[]) => void;
  onLongTermChange?: (items: string[]) => void;
}

const EditableList: React.FC<{
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
  muted?: boolean;
}> = ({ title, items, onChange, muted }) => {
  const handleItemChange = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const handleDelete = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    onChange([...items, '']);
  };

  return (
    <div className={items.length === 0 ? '' : 'mb-6'}>
      <p className="text-[14px] font-medium text-white/[0.88] mb-2">{title}</p>
      <div className="space-y-1">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-2 group">
            <span className="text-[13px] text-white/[0.30] tabular-nums mt-1 w-5 flex-shrink-0">
              {String(index + 1).padStart(2, '0')}
            </span>
            <input
              type="text"
              value={item}
              onChange={(e) => handleItemChange(index, e.target.value)}
              className={`flex-1 bg-transparent border border-transparent rounded px-1 py-0.5 text-[14px] leading-relaxed focus:bg-[#1C1C1F] focus:border-white/[0.08] transition-all duration-150 ${
                muted ? 'text-white/[0.50]' : 'text-white/[0.80]'
              }`}
            />
            <button
              onClick={() => handleDelete(index)}
              className="opacity-0 group-hover:opacity-100 text-white/[0.25] hover:text-error-30 transition-all duration-150 p-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 rounded"
              aria-label={`Delete recommendation ${index + 1}`}
            >
              <i className="fa-solid fa-xmark text-xs" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={handleAdd}
        className="text-[13px] text-white/[0.30] hover:text-white/[0.55] mt-2 flex items-center gap-1 transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary-200/50 rounded"
      >
        <i className="fa-solid fa-plus text-xs" />
        Add recommendation
      </button>
    </div>
  );
};

const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({
  shortTerm,
  longTerm,
  editable = false,
  onShortTermChange,
  onLongTermChange,
}) => {
  if (!editable && shortTerm.length === 0 && longTerm.length === 0) return null;

  return (
    <div
      className="mt-6 bg-[#161618] border border-white/[0.08] rounded-xl p-5"
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
    >
      <div className="mb-4">
        <p className="text-[12px] uppercase tracking-wider text-white/[0.35] font-medium">Recommendations</p>
      </div>

      {editable ? (
        <>
          {shortTerm.length === 0 && longTerm.length === 0 ? (
            <p className="text-[13px] text-white/[0.25] italic">
              No recommendations yet. Add items below.
            </p>
          ) : null}
          <EditableList title="Immediate actions" items={shortTerm} onChange={(v) => onShortTermChange?.(v)} />
          <EditableList title="Long-term recommendations" items={longTerm} onChange={(v) => onLongTermChange?.(v)} muted />
        </>
      ) : (
        <>
          {shortTerm.length > 0 && (
            <div className="mb-6">
              <p className="text-[14px] font-medium text-white/[0.88] mb-2">Immediate actions</p>
              <ul className="space-y-2">
                {shortTerm.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 fb-body-2 text-white/[0.85]">
                    <span className="text-white/[0.30] mt-0.5">·</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {longTerm.length > 0 && (
            <div>
              <p className="text-[14px] font-medium text-white/[0.88] mb-2">Long-term recommendations</p>
              <ul className="space-y-2">
                {longTerm.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 fb-body-2 text-white/[0.50]">
                    <span className="text-white/[0.30] mt-0.5">·</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RecommendationsSection;
