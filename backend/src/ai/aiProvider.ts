import { CrmRecord } from '../types/crm.js';

export interface BatchExtractionResult {
  /** Array of parsed records or null for skipped rows in the batch. */
  records: (CrmRecord | null)[];
}

export interface AIProvider {
  /**
   * Intelligently extract CRM records from a batch of raw CSV rows.
   * @param headers List of source column headers.
   * @param rows Array of CSV rows in key-value format.
   * @returns Array of extracted CrmRecord structures matching index-for-index with the input.
   */
  extractBatch(
    headers: string[],
    rows: Record<string, string>[]
  ): Promise<BatchExtractionResult>;
}
