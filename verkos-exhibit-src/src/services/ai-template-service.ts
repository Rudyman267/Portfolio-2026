import { supabase } from '../integrations/supabase/client';
import type { ReportSectionKind, Severity } from '../types/report.types';

export interface TemplateExtractionResult {
  sampleRelevance: 'high' | 'medium' | 'low';
  sampleRelevanceNote: string;
  persona: {
    role: string;
    primaryUse: string;
    readingTime: string;
    priorities: string;
    provenance: string;
  };
  narrativeStyle: {
    voice: string;
    structure: string;
    vocabulary: string;
    provenance: string;
  };
  sections: Array<{
    name: string;
    kind: ReportSectionKind;
    promptInstruction: string;
    maxLength: 'brief' | 'standard' | 'detailed';
    dataFeeds: {
      images: boolean;
      structuredData: boolean;
      narrativeContext: boolean;
    };
    provenance: string;
  }>;
  sampleObservations: Array<{
    title: string;
    severity: Severity;
    aiDescription: string;
    provenance: string;
  }>;
  sampleExecutiveSummary: string;
}

export type TemplateExtractionErrorCode =
  | 'credit_limit'
  | 'invalid_json'
  | 'empty_response'
  | 'network_error'
  | 'unknown';

export class TemplateExtractionError extends Error {
  code: TemplateExtractionErrorCode;
  constructor(code: TemplateExtractionErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'TemplateExtractionError';
  }
}

export async function extractTemplateFromSample(
  sampleText: string,
  sourceLabel?: string,
): Promise<TemplateExtractionResult> {
  const { data, error } = await supabase.functions.invoke('generate-report', {
    body: { mode: 'extract_template', sampleText, sourceLabel },
  });

  if (error) {
    if (error.message?.toLowerCase().includes('credit') || error.message?.includes('429')) {
      throw new TemplateExtractionError('credit_limit', 'Credit limit reached. Please try again later.');
    }
    throw new TemplateExtractionError('network_error', error.message ?? 'Network error');
  }

  if (!data?.ok) {
    const code = (data?.error as TemplateExtractionErrorCode) ?? 'unknown';
    const message = data?.message ?? 'Template extraction failed.';
    throw new TemplateExtractionError(
      ['credit_limit', 'invalid_json', 'empty_response', 'network_error'].includes(code) ? code : 'unknown',
      message,
    );
  }

  return data.data as TemplateExtractionResult;
}
