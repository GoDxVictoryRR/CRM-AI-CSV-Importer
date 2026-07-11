/**
 * Standard server logger.
 * Allows simple filtering and consistent formatting without direct console.log usage.
 */
export const logger = {
  info: (message: string, ...meta: any[]) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[INFO] [${new Date().toISOString()}]: ${message}`, ...meta);
    }
  },
  warn: (message: string, ...meta: any[]) => {
    console.warn(`[WARN] [${new Date().toISOString()}]: ${message}`, ...meta);
  },
  error: (message: string, error?: any, ...meta: any[]) => {
    console.error(`[ERROR] [${new Date().toISOString()}]: ${message}`, error || '', ...meta);
  }
};
