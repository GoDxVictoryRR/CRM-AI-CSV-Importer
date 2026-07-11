import { GoogleGenAI } from '@google/genai';
import { AIProvider, BatchExtractionResult } from './aiProvider.js';
import { CrmRecord, ALLOWED_CRM_STATUSES, ALLOWED_DATA_SOURCES } from '../types/crm.js';
import { logger } from '../utils/logger.js';

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.warn('GEMINI_API_KEY environment variable is not defined.');
    }
    // Initialize standard Google Gen AI SDK
    this.ai = new GoogleGenAI({ apiKey });
  }

  async extractBatch(
    headers: string[],
    rows: Record<string, string>[]
  ): Promise<BatchExtractionResult> {
    const prompt = this.buildPrompt(headers, rows);

    try {
      // gemini-flash-latest: confirmed available on this API key's quota tier
      const response = await this.ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          // Temperature is set low to prevent hallucinating extra data
          temperature: 0.1,
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Gemini returned an empty response.');
      }

      return this.parseResponse(responseText, rows.length);
    } catch (err: any) {
      logger.error('Gemini API call failed:', err);
      throw err;
    }
  }

  private buildPrompt(headers: string[], rows: Record<string, string>[]): string {
    const formattedRows = rows.map((row, index) => ({
      batchRowIndex: index,
      ...row
    }));

    return `You are a data migration expert assisting with importing leads into GrowEasy CRM.
Your task is to analyze raw key-value records from a CSV file and map them into the target CRM lead schema.

### TARGET SCHEMA FIELDS
- created_at: Lead creation date. Must be convertible in JavaScript via new Date(created_at).
- name: Full name of the lead.
- email: Primary email address.
- country_code: Phone country code (e.g. "91", "1", "44"). No leading "+" sign.
- mobile_without_country_code: Mobile number without country code.
- company: Company or business name.
- city: City name.
- state: State name.
- country: Country name.
- lead_owner: Owner/assignee of the lead.
- crm_status: Current status of the lead. Must strictly match one of the ALLOWED CRM STATUS values.
- crm_note: Free-text catch-all. Use for: remarks, follow-up notes, additional comments, extra email addresses beyond the first (prefix with "Extra emails: "), extra phone numbers beyond the first (prefix with "Extra phones: "), and any useful information from the row that does not fit another specific field.
- data_source: Lead data source. Must strictly match one of the ALLOWED DATA SOURCE values.
- possession_time: Property possession timeline or information.
- description: Additional comments/description of the lead.

### CONSTRAINED VALUES
Allowed CRM Statuses (only these are valid, case-sensitive):
${ALLOWED_CRM_STATUSES.map(s => `- "${s}"`).join('\n')}

Allowed Data Sources (only these are valid, case-sensitive):
${ALLOWED_DATA_SOURCES.map(s => `- "${s}"`).join('\n')}

### MAPPING & CLEANING INSTRUCTIONS
1. Analyze both header column names and sample values to map inputs to the target fields. Col names are messy/ambiguous.
2. If crm_status does not map to any of the ALLOWED CRM STATUS values, set crm_status to null or "". Do not invent status values.
3. If data_source does not map to any of the ALLOWED DATA SOURCE values, set data_source to null or "". Do not invent source values.
4. If multiple email addresses are found in a row (e.g. comma-separated, space-separated, or in multiple email-like columns): map the FIRST one to "email", and append the rest into "crm_note" as "Additional Emails: ...".
5. If multiple mobile/phone numbers are found in a row: map the FIRST one to "mobile_without_country_code" (extracting country code to "country_code" if present), and append the rest to "crm_note" as "Additional Mobiles: ...".
6. If the record contains NEITHER an email nor a mobile/phone number, map "skip" to true and state a brief reason in "skip_reason".
7. Avoid unintended line breaks in text values. Escape any mandatory line breaks as "\\n" to keep JSON valid.
8. Do not invent/hallucinate any information. If a target field is not present in the input row, map it as null or "".

### INPUT BATCH DATA
Source Headers: ${JSON.stringify(headers)}
Rows to Map:
${JSON.stringify(formattedRows, null, 2)}

### OUTPUT FORMAT
Return a JSON object containing a "records" array. The array must contain exactly ${rows.length} items, corresponding index-for-index with the input rows.
If an item is skipped, set "skip" to true and provide "skip_reason", leaving other fields empty/null.
Output JSON schema shape:
{
  "records": [
    {
      "batchRowIndex": number,
      "skip": boolean,
      "skip_reason": string,
      "created_at": string | null,
      "name": string | null,
      "email": string | null,
      "country_code": string | null,
      "mobile_without_country_code": string | null,
      "company": string | null,
      "city": string | null,
      "state": string | null,
      "country": string | null,
      "lead_owner": string | null,
      "crm_status": string | null,
      "crm_note": string | null,
      "data_source": string | null,
      "possession_time": string | null,
      "description": string | null
    }
  ]
}

Return ONLY clean, minified, parseable JSON content. Do not wrap output in markdown code blocks or write explanatory text.`;
  }

  private parseResponse(text: string, expectedCount: number): BatchExtractionResult {
    // Strip possible markdown wraps (e.g. ```json ... ```)
    let jsonText = text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
    }

    try {
      const parsed = JSON.parse(jsonText);
      const extractedRecords = parsed.records;

      if (!Array.isArray(extractedRecords)) {
        throw new Error('JSON response does not contain a "records" array.');
      }

      // Map back to index-aligned array
      const records: (CrmRecord | null)[] = Array.from({ length: expectedCount }, () => null);

      for (const item of extractedRecords) {
        const idx = item.batchRowIndex;
        if (typeof idx === 'number' && idx >= 0 && idx < expectedCount) {
          if (item.skip) {
            records[idx] = null; // Marked for skipping
          } else {
            const rec: CrmRecord = {
              created_at: item.created_at || undefined,
              name: item.name || undefined,
              email: item.email || undefined,
              country_code: item.country_code || undefined,
              mobile_without_country_code: item.mobile_without_country_code || undefined,
              company: item.company || undefined,
              city: item.city || undefined,
              state: item.state || undefined,
              country: item.country || undefined,
              lead_owner: item.lead_owner || undefined,
              crm_status: item.crm_status || '',
              crm_note: item.crm_note || undefined,
              data_source: item.data_source || '',
              possession_time: item.possession_time || undefined,
              description: item.description || undefined,
            };
            records[idx] = rec;
          }
        }
      }

      return { records };
    } catch (err: any) {
      logger.error('Failed to parse Gemini JSON output:', jsonText);
      throw new Error(`AI returned invalid JSON: ${err.message}`);
    }
  }
}
