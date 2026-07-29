import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// pdfjs-dist v5 ships the worker as an .mjs file. unpkg reliably hosts
// the exact installed version; cdnjs does not always have pdfjs-dist builds.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const MAX_WORDS = 4000;
const MIN_WORDS = 50;

export interface ExtractedText {
  text: string;
  wordCount: number;
  originalWordCount: number;
  pageCount?: number;
  truncated: boolean;
}

export class ExtractionError extends Error {
  code: 'empty' | 'too_short' | 'unsupported' | 'read_failed';
  constructor(code: ExtractionError['code'], message: string) {
    super(message);
    this.code = code;
    this.name = 'ExtractionError';
  }
}

function capWords(text: string): {
  text: string;
  wordCount: number;
  originalWordCount: number;
  truncated: boolean;
} {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const words = cleaned.length === 0 ? [] : cleaned.split(' ');
  const originalWordCount = words.length;
  const truncated = originalWordCount > MAX_WORDS;
  const finalWords = truncated ? words.slice(0, MAX_WORDS) : words;
  return {
    text: finalWords.join(' '),
    wordCount: finalWords.length,
    originalWordCount,
    truncated,
  };
}

function ensureMinWords(result: ReturnType<typeof capWords>) {
  if (result.wordCount < MIN_WORDS) {
    throw new ExtractionError(
      'too_short',
      `Please provide at least ${MIN_WORDS} words. We found only ${result.wordCount}.`,
    );
  }
}

export async function extractFromPdf(file: File): Promise<ExtractedText> {
  let pdf;
  try {
    const data = await file.arrayBuffer();
    pdf = await pdfjsLib.getDocument({ data }).promise;
  } catch (err) {
    console.error('[extractFromPdf] getDocument failed:', err);
    const rawMessage = err instanceof Error ? err.message : String(err);
    const isWorkerIssue =
      /worker/i.test(rawMessage) ||
      /fetch/i.test(rawMessage) ||
      /network/i.test(rawMessage) ||
      /failed to load/i.test(rawMessage);
    throw new ExtractionError(
      'read_failed',
      isWorkerIssue
        ? "Couldn't load the PDF reader. Check your network connection and try again, or paste the report text instead."
        : `Couldn't open the PDF (${rawMessage.slice(0, 120)}). If the file looks fine, try pasting the text instead.`,
    );
  }

  const pageLimit = Math.min(pdf.numPages, 20);
  const pageTexts: string[] = [];
  for (let i = 1; i <= pageLimit; i++) {
    try {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: unknown) => (item as { str?: string }).str ?? '')
        .join(' ');
      pageTexts.push(pageText);
    } catch (err) {
      console.warn(`[extractFromPdf] page ${i} failed, skipping:`, err);
    }
  }

  const joined = pageTexts.join('\n\n').trim();
  if (!joined) {
    throw new ExtractionError(
      'empty',
      "We couldn't read text from this PDF. It may be a scanned image. Try pasting text instead.",
    );
  }

  const capped = capWords(joined);
  ensureMinWords(capped);
  return { ...capped, pageCount: pdf.numPages };
}

export async function extractFromDocx(file: File): Promise<ExtractedText> {
  let result;
  try {
    const arrayBuffer = await file.arrayBuffer();
    result = await mammoth.extractRawText({ arrayBuffer });
  } catch (err) {
    console.error('[extractFromDocx] mammoth failed:', err);
    const rawMessage = err instanceof Error ? err.message : String(err);
    throw new ExtractionError(
      'read_failed',
      `Couldn't open the Word document (${rawMessage.slice(0, 120)}). Try saving as PDF, or paste the text instead.`,
    );
  }

  const value = (result?.value ?? '').trim();
  if (!value) {
    throw new ExtractionError('empty', "We couldn't read text from this Word document.");
  }

  const capped = capWords(value);
  ensureMinWords(capped);
  return capped;
}

export function extractFromPasted(text: string): ExtractedText {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new ExtractionError('empty', 'Please paste some text first.');
  }
  const capped = capWords(trimmed);
  ensureMinWords(capped);
  return capped;
}

export async function extractFromFile(file: File): Promise<ExtractedText> {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (name.endsWith('.pdf') || type === 'application/pdf') {
    return extractFromPdf(file);
  }
  if (
    name.endsWith('.docx') ||
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return extractFromDocx(file);
  }

  throw new ExtractionError(
    'unsupported',
    'Only PDF and Word (.docx) files are supported. You can also paste text directly.',
  );
}

export const EXTRACTOR_LIMITS = { MAX_WORDS, MIN_WORDS };
