import { ImportResponse } from '@/types/api';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

/**
 * Sends the raw CSV file to the backend import API.
 * The backend re-parses and validates server-side.
 * Throws an Error with a human-readable message on any failure.
 */
export async function importCSV(file: File): Promise<ImportResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const baseUrl = BACKEND_URL.replace(/\/+$/, '');
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/import`, {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new Error(
      'Could not reach the server. Check your connection and make sure the backend is running.'
    );
  }

  if (!response.ok) {
    let message = `Server error (${response.status})`;
    try {
      const body = await response.json();
      if (typeof body?.message === 'string') message = body.message;
    } catch {
      // body is not JSON — use status text
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  return response.json() as Promise<ImportResponse>;
}
