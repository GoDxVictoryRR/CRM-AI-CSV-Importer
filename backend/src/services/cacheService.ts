import crypto from 'crypto';
import { ImportResponse } from '../types/crm.js';
import { logger } from '../utils/logger.js';

/**
 * P1 — SHA-256 in-memory result cache.
 *
 * Key  : SHA-256 of normalized CSV content (headers+rows as JSON — 
 *        not raw bytes, so whitespace/line-ending differences still hit cache).
 * Value: { result, expiresAt }
 *
 * Hard limits: max MAX_ENTRIES entries (LRU-evict oldest on overflow),
 * TTL of CACHE_TTL_MS per entry.
 * This cache is intentionally in-memory (resets on restart/sleep) — documented
 * tradeoff acceptable for a free-tier stateless backend.
 */

const MAX_ENTRIES = 200;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  result: ImportResponse;
  expiresAt: number;
}

/** Compute a stable SHA-256 cache key from normalized CSV rows. */
export function computeCsvHash(headers: string[], rows: Record<string, string>[]): string {
  // Normalize: lowercase trimmed headers + row values
  const normalized = {
    headers: headers.map(h => h.trim().toLowerCase()),
    rows: rows.map(row =>
      Object.fromEntries(
        Object.entries(row).map(([k, v]) => [k.trim().toLowerCase(), (v ?? '').trim()])
      )
    ),
  };
  return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}

class ResultCache {
  private store = new Map<string, CacheEntry>();

  get(key: string): ImportResponse | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    // Move to end (LRU pattern using Map insertion order)
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.result;
  }

  set(key: string, result: ImportResponse): void {
    // Evict oldest entry if at capacity
    if (this.store.size >= MAX_ENTRIES) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.store.delete(oldestKey);
    }
    this.store.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
    logger.info(`Cache SET key=${key.slice(0, 8)}… (total entries: ${this.store.size})`);
  }

  size(): number {
    return this.store.size;
  }
}

export const resultCache = new ResultCache();
