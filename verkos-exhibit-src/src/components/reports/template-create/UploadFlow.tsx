import React, { useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  EXTRACTOR_LIMITS,
  ExtractedText,
  ExtractionError,
  extractFromFile,
  extractFromPasted,
} from '@/services/sample-text-extractor';
import {
  extractTemplateFromSample,
  TemplateExtractionError,
  TemplateExtractionResult,
} from '@/services/ai-template-service';
import { useReportStore } from '@/store/report.store';
import { buildTemplateFromExtraction } from './extractionToTemplate';
import ExtractionVerification from './ExtractionVerification';

interface UploadFlowProps {
  onBack: () => void;
  onPicked?: () => void;
}

const ACCEPT =
  '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const countWords = (s: string) => {
  const t = s.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
};

type UploadView = 'upload' | 'verifying';

const UploadFlow: React.FC<UploadFlowProps> = ({ onBack, onPicked }) => {
  const navigate = useNavigate();
  const addTemplate = useReportStore((s) => s.addTemplate);

  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [extracted, setExtracted] = useState<ExtractedText | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadView, setUploadView] = useState<UploadView>('upload');
  const [extraction, setExtraction] = useState<TemplateExtractionResult | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sourceLabel = file ? file.name : 'pasted text';

  const pasteWordCount = countWords(pastedText);
  const pasteUsable = pasteWordCount >= EXTRACTOR_LIMITS.MIN_WORDS;
  const fileLocked = !!file;
  const pasteLocked = pastedText.length > 0 && !file;
  const canAnalyze = !extracting && (fileLocked || pasteUsable);

  const resetExtractionState = () => {
    setExtracted(null);
    setError(null);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (pasteLocked) return;
    setDragActive(true);
  };
  const onDragLeave = () => setDragActive(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (pasteLocked) return;
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setFile(f);
      resetExtractionState();
    }
  };

  const onPickFile = () => {
    if (pasteLocked) return;
    inputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      resetExtractionState();
    }
    e.target.value = '';
  };

  const clearFile = () => {
    setFile(null);
    resetExtractionState();
  };

  const onPasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPastedText(e.target.value);
    resetExtractionState();
  };

  const handleAnalyze = async () => {
    setExtracting(true);
    setError(null);
    setExtracted(null);
    setExtraction(null);
    try {
      const result = file ? await extractFromFile(file) : extractFromPasted(pastedText);
      setExtracted(result);
      const extractionResult = await extractTemplateFromSample(
        result.text,
        file ? file.name : 'pasted text',
      );
      setExtraction(extractionResult);
      setUploadView('verifying');
    } catch (e) {
      if (e instanceof ExtractionError) {
        setError({ code: e.code, message: e.message });
      } else if (e instanceof TemplateExtractionError) {
        setError({ code: e.code, message: e.message });
      } else {
        setError({
          code: 'read_failed',
          message: 'Failed to read the file. Please try a different file or paste text.',
        });
      }
    } finally {
      setExtracting(false);
    }
  };

  const handleTryAgain = () => {
    setExtraction(null);
    setUploadView('upload');
    setError(null);
  };

  const persistTemplate = () => {
    if (!extraction) return null;
    const template = buildTemplateFromExtraction(extraction, sourceLabel);
    addTemplate(template);
    return template;
  };

  const handleSaveAndUse = async () => {
    if (saving || !extraction) return;
    setSaving(true);
    try {
      persistTemplate();
      onPicked?.();
    } finally {
      setSaving(false);
    }
  };

  const handleAdjust = async () => {
    if (saving || !extraction) return;
    setSaving(true);
    try {
      const template = persistTemplate();
      if (!template) return;
      onPicked?.();
      navigate({
        to: '/template/$templateId',
        params: { templateId: template.id } as never,
      });
    } finally {
      setSaving(false);
    }
  };

  if (uploadView === 'verifying' && extraction) {
    return (
      <ExtractionVerification
        extraction={extraction}
        sourceLabel={sourceLabel}
        saving={saving}
        onTryAgain={handleTryAgain}
        onSaveAndUse={handleSaveAndUse}
        onAdjust={handleAdjust}
      />
    );
  }

  return (
    <div className="flex flex-col max-h-[85vh]">
      <div className="px-6 pt-6 pb-4 shrink-0">
        <button
          onClick={onBack}
          className="text-[12px] text-white/[0.45] hover:text-white/[0.75] mb-3 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <i className="fa-solid fa-arrow-left text-[10px]" />
          Back to options
        </button>
        <h2 className="text-[16px] font-semibold text-white/[0.92] mb-1">Upload a sample report</h2>
        <p className="text-[13px] text-white/[0.42]">
          We'll extract structure, voice, and sample observations
        </p>
      </div>

      <div
        className="px-6 pb-4 space-y-3 overflow-y-auto"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}
      >
        {/* Dropzone / file chip */}
        {file ? (
          <div className="bg-[#1C1C1F] border border-white/[0.10] rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-200/10 flex items-center justify-center shrink-0">
              <i className="fa-solid fa-file-lines text-primary-200 text-[14px]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] text-white/[0.88] font-medium truncate">{file.name}</div>
              <div className="text-[11px] text-white/[0.40]">{formatBytes(file.size)}</div>
            </div>
            <button
              onClick={clearFile}
              className="w-7 h-7 rounded-md hover:bg-white/[0.06] text-white/[0.45] hover:text-white/[0.85] transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Remove file"
            >
              <i className="fa-solid fa-xmark text-[12px]" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onPickFile}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            disabled={pasteLocked}
            className={[
              'w-full rounded-xl py-8 px-6 text-center transition-colors border border-dashed',
              pasteLocked
                ? 'bg-[#161618] border-white/[0.06] cursor-not-allowed opacity-50'
                : dragActive
                ? 'bg-primary-200/5 border-primary-200/50 cursor-pointer'
                : 'bg-[#1C1C1F] border-white/[0.10] hover:border-primary-200/30 cursor-pointer',
            ].join(' ')}
          >
            <div className="w-11 h-11 mx-auto mb-2.5 rounded-full bg-white/[0.04] flex items-center justify-center">
              <i className="fa-solid fa-file-arrow-up text-white/[0.40] text-[16px]" />
            </div>
            <p className="text-[13px] text-white/[0.78] font-medium mb-0.5">
              Drop PDF or Word doc here
            </p>
            <p className="text-[11px] text-white/[0.40]">
              {pasteLocked ? 'Using pasted text' : 'or click to browse'}
            </p>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={onFileChange}
          className="hidden"
        />

        {/* Divider */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-[10px] uppercase tracking-wider text-white/[0.30]">or</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        {/* Paste area */}
        <div>
          <textarea
            value={pastedText}
            onChange={onPasteChange}
            disabled={fileLocked}
            rows={5}
            placeholder={
              fileLocked
                ? 'Using uploaded file'
                : 'Paste a report, section, or a few paragraphs...'
            }
            className="w-full bg-[#1C1C1F] border border-white/[0.10] rounded-xl px-3.5 py-2.5 text-[13px] text-white/[0.88] placeholder:text-white/[0.30] focus:outline-none focus:border-primary-200/40 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ scrollbarWidth: 'thin' }}
          />
          {!fileLocked && (
            <div className="mt-1.5 text-[11px] text-white/[0.40] flex items-center justify-between">
              <span>
                {pasteWordCount === 0
                  ? `Need at least ${EXTRACTOR_LIMITS.MIN_WORDS} words`
                  : pasteUsable
                  ? `${pasteWordCount} words`
                  : `${pasteWordCount} / ${EXTRACTOR_LIMITS.MIN_WORDS} words`}
              </span>
              {pasteWordCount > EXTRACTOR_LIMITS.MAX_WORDS && (
                <span className="text-caution-30">
                  Will truncate to {EXTRACTOR_LIMITS.MAX_WORDS}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-error-30/10 border border-error-30/30 rounded-lg p-3 flex items-start gap-2.5">
            <i className="fa-solid fa-circle-exclamation text-error-30 text-[13px] mt-0.5" />
            <p className="text-[13px] text-error-30 leading-snug">{error.message}</p>
          </div>
        )}

        {/* Success */}
        {extracted && !error && (
          <div className="bg-success-30/10 border border-success-30/30 rounded-lg p-3 flex items-start gap-2.5">
            <i className="fa-solid fa-circle-check text-success-30 text-[13px] mt-0.5" />
            <div className="min-w-0">
              <p className="text-[13px] text-success-30 leading-snug font-medium">
                Ready to analyze — {extracted.wordCount} words extracted
                {extracted.pageCount ? ` from ${extracted.pageCount} pages` : ''}
                {extracted.truncated
                  ? ` (truncated from ${extracted.originalWordCount})`
                  : ''}
              </p>
              <p className="text-[12px] text-white/[0.45] leading-snug mt-0.5">
                Coming next: AI extracts template structure from your sample
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/[0.05] flex justify-between items-center shrink-0">
        <button
          onClick={onBack}
          className="text-white/[0.50] hover:text-white/[0.75] px-4 py-2 rounded-lg transition-colors duration-150 text-[13px] cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          className="bg-primary-200 hover:bg-primary-200/90 disabled:bg-white/[0.05] disabled:text-white/[0.25] disabled:cursor-not-allowed text-black font-medium px-4 py-2 rounded-lg transition-colors duration-150 text-[13px] cursor-pointer flex items-center gap-2"
        >
          {extracting ? (
            <>
              <i className="fa-solid fa-circle-notch fa-spin text-[12px]" />
              Analyzing...
            </>
          ) : (
            <>
              Analyze sample
              <i className="fa-solid fa-arrow-right text-[11px]" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default UploadFlow;
