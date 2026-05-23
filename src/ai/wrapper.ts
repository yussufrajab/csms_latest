'use server';

/**
 * Wrapper for AI functionality that handles errors gracefully
 */

import { logger } from '@/lib/logger';

export interface StandardizeComplaintFormattingInput {
  complaintText: string;
}

export interface StandardizeComplaintFormattingOutput {
  rewrittenComplaint: string;
}

export async function standardizeComplaintFormatting(
  input: StandardizeComplaintFormattingInput
): Promise<StandardizeComplaintFormattingOutput> {
  try {
    // Try to import the AI functionality
    const { standardizeComplaintFormatting: originalFunction } =
      await import('@/ai/flows/complaint-rewriter');
    return await originalFunction(input);
  } catch (error) {
    logger.warn({ err: error }, 'AI functionality unavailable, returning original text');
    // Fallback: return the original text
    return {
      rewrittenComplaint: input.complaintText,
    };
  }
}
