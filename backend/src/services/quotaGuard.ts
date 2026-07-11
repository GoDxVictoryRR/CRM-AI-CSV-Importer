import { logger } from '../utils/logger.js';

/**
 * P2 — Global Gemini API call quota guard.
 *
 * Tracks ACTUAL Gemini API calls (not requests) across ALL users in-memory.
 * Resets daily at midnight Pacific time (Gemini's free-tier billing window).
 *
 * DAILY_CAP is set conservatively below the documented free-tier limit to
 * leave headroom for burst traffic and avoid hitting the hard API limit.
 *
 * Cache hits do NOT count — they saved an AI call, so they are exempt.
 */

// Gemini free-tier free quota is ~1500 req/day on gemini-flash-latest.
// We cap at 1000 to leave 33% headroom for burst/retries.
const DAILY_CAP = 1000;
const WARN_THRESHOLD = 0.90; // Warn logs at 90% usage

/**
 * Pacific midnight in a given UTC date.
 * Gemini's billing window resets at 00:00 PT (UTC-8 standard / UTC-7 daylight).
 */
function nextPacificMidnightMs(): number {
  const now = new Date();
  // Approximate: use UTC-8 (conservative — may be 1h off during daylight saving, acceptable)
  const ptOffset = 8 * 60 * 60 * 1000;
  const ptNow = new Date(now.getTime() - ptOffset);

  const ptMidnight = new Date(
    Date.UTC(ptNow.getUTCFullYear(), ptNow.getUTCMonth(), ptNow.getUTCDate() + 1, 0, 0, 0)
  );

  return ptMidnight.getTime() + ptOffset;
}

class QuotaGuard {
  private callCount = 0;
  private resetAt: number = nextPacificMidnightMs();
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.scheduleReset();
  }

  private scheduleReset() {
    const msUntilReset = Math.max(0, this.resetAt - Date.now());
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      logger.info(`[QuotaGuard] Daily Gemini call counter reset. Previous count: ${this.callCount}`);
      this.callCount = 0;
      this.resetAt = nextPacificMidnightMs();
      this.scheduleReset();
    }, msUntilReset);
  }

  /** Returns null if allowed, or an error message string if blocked. */
  checkAndIncrement(): string | null {
    if (this.callCount >= DAILY_CAP) {
      logger.warn(`[QuotaGuard] Daily AI cap reached (${this.callCount}/${DAILY_CAP}). Request blocked.`);
      return 'AI processing is temporarily paused due to high demand. Please try again later or tomorrow when the daily quota resets.';
    }
    this.callCount++;
    const usage = this.callCount / DAILY_CAP;
    if (usage >= WARN_THRESHOLD) {
      logger.warn(`[QuotaGuard] AI quota at ${Math.round(usage * 100)}% (${this.callCount}/${DAILY_CAP}).`);
    }
    return null; // allowed
  }

  /** Call when a Gemini call was NOT actually made (e.g. retried batch that ultimately failed, or cache hit — but cache hits should skip this entirely). */
  decrement(): void {
    if (this.callCount > 0) this.callCount--;
  }

  getStatus(): { used: number; cap: number; resetsAt: string } {
    return {
      used: this.callCount,
      cap: DAILY_CAP,
      resetsAt: new Date(this.resetAt).toISOString(),
    };
  }
}

export const quotaGuard = new QuotaGuard();
