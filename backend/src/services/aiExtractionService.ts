import { AIProvider } from '../ai/aiProvider.js';
import { CrmRecord, ALLOWED_CRM_STATUSES, ALLOWED_DATA_SOURCES, SkippedRecord, ImportResponse } from '../types/crm.js';
import { logger } from '../utils/logger.js';

const BATCH_SIZE = 30;    // Max rows per Gemini call
const MAX_RETRIES = 3;    // Attempts per batch before marking rows as skipped
const RETRY_BASE_MS = 2000; // Base backoff interval (doubles each attempt)
const RATE_LIMIT_WAIT_MS = 60_000; // Wait 60 s on 429 before retrying

export class AiExtractionService {
  private provider: AIProvider;

  constructor(provider: AIProvider) {
    this.provider = provider;
  }

  /**
   * Process raw rows in batches, call AI mapping, and run deterministic validation.
   */
  async processImport(
    headers: string[],
    rows: Record<string, string>[]
  ): Promise<ImportResponse> {
    const parsedRecords: CrmRecord[] = [];
    const skippedRecords: SkippedRecord[] = [];

    // F5: Split rows into batches
    const batches: Record<string, string>[][] = [];
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      batches.push(rows.slice(i, i + BATCH_SIZE));
    }

    logger.info(`Starting import processing of ${rows.length} rows in ${batches.length} batches.`);

    // F5: Process batches sequentially to stay under Gemini free-tier rate limits
    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batchRows = batches[batchIdx];
      const startRowIdx = batchIdx * BATCH_SIZE;

      logger.info(`Processing batch ${batchIdx + 1}/${batches.length} (Rows ${startRowIdx + 1} - ${startRowIdx + batchRows.length})...`);

      // Retry loop: up to MAX_RETRIES attempts with exponential backoff.
      // 429 responses (Gemini free-tier rate limit) get a longer fixed wait.
      // If all retries fail, rows are skipped with a reason — the import continues.
      let lastError: any;
      let succeeded = false;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const result = await this.provider.extractBatch(headers, batchRows);

          // F7: Deterministic validation layer
          for (let i = 0; i < batchRows.length; i++) {
            const rawRow = batchRows[i];
            const globalRowIndex = startRowIdx + i;
            const extracted = result.records[i];
            this.validateAndCollect(rawRow, globalRowIndex, extracted, parsedRecords, skippedRecords);
          }

          succeeded = true;
          break; // Batch processed — exit retry loop
        } catch (err: any) {
          lastError = err;
          const isRateLimit =
            err?.status === 429 ||
            (err?.message ?? '').toLowerCase().includes('quota') ||
            (err?.message ?? '').toLowerCase().includes('rate');

          if (attempt < MAX_RETRIES) {
            const waitMs = isRateLimit
              ? RATE_LIMIT_WAIT_MS
              : RETRY_BASE_MS * Math.pow(2, attempt - 1);
            logger.warn(
              `Batch ${batchIdx + 1} attempt ${attempt} failed (${isRateLimit ? '429 rate-limit' : err.message}). ` +
              `Retrying in ${waitMs / 1000}s…`
            );
            await new Promise((r) => setTimeout(r, waitMs));
          }
        }
      }

      if (!succeeded) {
        logger.error(`Batch ${batchIdx + 1} failed after ${MAX_RETRIES} attempts:`, lastError);
        // Partial failure: mark this batch's rows as skipped, keep successful batches intact
        for (let i = 0; i < batchRows.length; i++) {
          skippedRecords.push({
            rowIndex: startRowIdx + i,
            rowRawData: batchRows[i],
            reason: `AI batch failure after ${MAX_RETRIES} retries: ${lastError?.message ?? 'unknown error'}`
          });
        }
      }
    }

    return {
      parsed: parsedRecords,
      skipped: skippedRecords,
      totalParsed: parsedRecords.length,
      totalSkipped: skippedRecords.length
    };
  }

  /**
   * F7 — Enforce CRM enums, date format, multiple email/phone folding, and skip rules in code.
   */
  private validateAndCollect(
    rawRow: Record<string, string>,
    rowIndex: number,
    extracted: CrmRecord | null,
    parsedList: CrmRecord[],
    skippedList: SkippedRecord[]
  ) {
    // If AI explicitly marked to skip or failed to return a mapping
    if (!extracted) {
      skippedList.push({
        rowIndex,
        rowRawData: rawRow,
        reason: 'Record skipped by AI mapping.'
      });
      return;
    }

    // 1. Get resolved email and mobile
    let email = extracted.email ? extracted.email.trim() : '';
    let mobile = extracted.mobile_without_country_code ? extracted.mobile_without_country_code.trim() : '';

    // If AI output is blank but raw data contains values, let's extract them to be extra safe
    if (!email && !mobile) {
      // Find possible emails/mobiles in raw headers if AI missed them
      for (const [key, val] of Object.entries(rawRow)) {
        if (!val) continue;
        const normalizedKey = key.toLowerCase().replace(/[\s_-]/g, '');
        if (normalizedKey.includes('email') || normalizedKey.includes('mail')) {
          if (val.includes('@') && !email) email = val.trim();
        }
        if (normalizedKey.includes('phone') || normalizedKey.includes('mobile') || normalizedKey.includes('contact')) {
          if (/^\+?\d[\d\s-]{5,15}$/.test(val) && !mobile) mobile = val.trim();
        }
      }
    }

    // F7 Skip Rule: Skip records missing both email AND mobile/phone
    if (!email && !mobile) {
      skippedList.push({
        rowIndex,
        rowRawData: rawRow,
        reason: 'Missing both email and mobile/phone number.'
      });
      return;
    }

    // 2. Validate crm_status enum (4 allowed values, else blank)
    let crmStatus = extracted.crm_status || '';
    if (crmStatus) {
      const match = ALLOWED_CRM_STATUSES.find(s => s.toLowerCase() === crmStatus.toLowerCase());
      crmStatus = match ? match : '';
    }

    // 3. Validate data_source enum (5 allowed values, else blank)
    let dataSource = extracted.data_source || '';
    if (dataSource) {
      const match = ALLOWED_DATA_SOURCES.find(s => s.toLowerCase() === dataSource.toLowerCase());
      dataSource = match ? match : '';
    }

    // 4. Validate created_at date format
    let createdAt = extracted.created_at || '';
    if (createdAt) {
      const dateNum = Date.parse(createdAt);
      if (isNaN(dateNum)) {
        // Unparseable date -> leave blank as per specification
        createdAt = '';
      } else {
        // Format to ISO-like standard
        createdAt = new Date(dateNum).toISOString().slice(0, 19).replace('T', ' ');
      }
    }

    // Fold back validated records
    const cleanRecord: CrmRecord = {
      ...extracted,
      email: email || undefined,
      mobile_without_country_code: mobile || undefined,
      crm_status: crmStatus as any,
      data_source: dataSource as any,
      created_at: createdAt || undefined
    };

    parsedList.push(cleanRecord);
  }
}
