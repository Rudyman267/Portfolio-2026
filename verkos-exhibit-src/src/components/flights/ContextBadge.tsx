import React from 'react';
import type { FlightContext } from '@/types/report.types';

const ContextBadge: React.FC<{ context?: FlightContext }> = ({ context }) => {
  if (!context || (context.wordCount === 0 && Object.keys(context.imageNotes).length === 0)) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-white/[0.35] bg-white/[0.04] rounded-md px-2 py-0.5">
        <i className="fa-regular fa-microphone-lines text-[10px]" />
        No context added
      </span>
    );
  }
  const recentlyEdited = Date.now() - new Date(context.lastEditedAt).getTime() < 5 * 60 * 1000;
  const inProgress = !context.markedComplete && recentlyEdited;
  const noteCount = Object.keys(context.imageNotes).length;
  const summary = noteCount > 0
    ? `${context.wordCount}w · ${noteCount} note${noteCount !== 1 ? 's' : ''}`
    : `${context.wordCount} words`;

  if (inProgress) return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-caution-30 bg-caution-30/10 rounded-md px-2 py-0.5">
      <i className="fa-solid fa-pen-to-square text-[10px] animate-pulse" />
      In progress · {summary}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-primary-200 bg-primary-200/10 rounded-md px-2 py-0.5">
      <i className="fa-solid fa-check text-[10px]" />
      Context added · {summary}
    </span>
  );
};
export default ContextBadge;
