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
 * Parses a CSV File client-side incrementally using PapaParse's chunking logic.
 *
 * It reads the file chunk-by-chunk (using a 64KB reader), avoiding loading the entire parsed
 * grid structure into a single memory block. An optional `onProgress` callback can be provided
 * to track incremental parsing progress as rows are yielded.
 */
export function parseCSV(
  file: File,
  onProgress?: (chunkRows: Record<string, string>[], totalLoaded: number) => void
): Promise<ParsedCSV> {
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

    let headers: string[] = [];
    const rows: Record<string, string>[] = [];

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim(),
      chunkSize: 64 * 1024, // 64KB chunk buffer size for incremental reading
      chunk: (results) => {
        // Collect headers from the first chunk
        if (headers.length === 0 && results.meta.fields) {
          headers = results.meta.fields;
        }
        
        const chunkData = results.data;
        rows.push(...chunkData);

        if (onProgress) {
          onProgress(chunkData, rows.length);
        }
      },
      complete: () => {
        if (headers.length === 0) {
          return reject(new Error('CSV has no headers. Please check your file.'));
        }

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
