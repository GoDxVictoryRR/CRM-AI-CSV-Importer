import Papa from 'papaparse';

/**
 * Service to parse and normalize CSV content server-side.
 */
export const csvService = {
  /**
   * Parses CSV string contents into raw records.
   * Re-validates layout, checks if columns exist, and returns clean strings.
   */
  parseCsvContent(csvString: string): Record<string, string>[] {
    if (!csvString || csvString.trim() === '') {
      throw new Error('CSV content is empty.');
    }

    const results = Papa.parse<Record<string, string>>(csvString, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });

    if (results.errors.length > 0 && results.data.length === 0) {
      const errorMsg = results.errors.map(e => e.message).join(', ');
      throw new Error(`Failed to parse CSV on server: ${errorMsg}`);
    }

    const headers = results.meta.fields ?? [];
    if (headers.length === 0) {
      throw new Error('CSV has no columns/headers.');
    }

    // Clean up empty objects or records
    return results.data.filter(row => {
      return Object.values(row).some(val => val !== undefined && val !== null && val.trim() !== '');
    });
  }
};
