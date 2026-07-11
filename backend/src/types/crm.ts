/**
 * Allowed CRM Lead status values.
 */
export const ALLOWED_CRM_STATUSES = [
  'GOOD_LEAD_FOLLOW_UP',
  'DID_NOT_CONNECT',
  'BAD_LEAD',
  'SALE_DONE'
] as const;

export type CrmStatus = (typeof ALLOWED_CRM_STATUSES)[number];

/**
 * Allowed Data Source values.
 */
export const ALLOWED_DATA_SOURCES = [
  'leads_on_demand',
  'meridian_tower',
  'eden_park',
  'varah_swamy',
  'sarjapur_plots'
] as const;

export type DataSource = (typeof ALLOWED_DATA_SOURCES)[number];

/**
 * Target CRM lead schema interface.
 */
export interface CrmRecord {
  created_at?: string; // Date string or empty
  name?: string;
  email?: string;
  country_code?: string;
  mobile_without_country_code?: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  lead_owner?: string;
  crm_status?: CrmStatus | '';
  crm_note?: string;
  data_source?: DataSource | '';
  possession_time?: string;
  description?: string;
}

/**
 * Interface for skipped CSV rows.
 */
export interface SkippedRecord {
  rowIndex: number;
  rowRawData: Record<string, string>;
  reason: string;
}

/**
 * Backend structured JSON response payload.
 */
export interface ImportResponse {
  parsed: CrmRecord[];
  skipped: SkippedRecord[];
  totalParsed: number;
  totalSkipped: number;
}
