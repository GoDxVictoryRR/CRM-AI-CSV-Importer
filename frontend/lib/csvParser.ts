import Papa from 'papaparse';

/** Result of a client-side CSV parse. */
export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
  fileName: string;
  totalRows: number;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Parses a CSV File client-side using PapaParse.
 * Validates file type, file size, and basic CSV structure before resolving.
 * Throws a descriptive Error if validation fails or the CSV is malformed.
 */
export function parseCSV(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      return reject(new Error('Invalid file type. Please upload a .csv file.'));
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return reject(
        new Error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`)
      );
    }

    if (file.size === 0) {
      return reject(new Error('The file is empty. Please upload a CSV with data.'));
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(), // normalise header whitespace
      complete: (results) => {
        const headers = results.meta.fields ?? [];

        if (headers.length === 0) {
          return reject(new Error('CSV has no headers. Please check your file.'));
        }

        const rows = results.data;

        if (rows.length === 0) {
          return reject(new Error('CSV has headers but no data rows.'));
        }

        resolve({
          headers,
          rows,
          fileName: file.name,
          totalRows: rows.length,
        });
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
}
