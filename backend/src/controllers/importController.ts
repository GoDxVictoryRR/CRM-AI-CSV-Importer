import { Request, Response, NextFunction } from 'express';
import { csvService } from '../services/csvService.js';
import { AiExtractionService } from '../services/aiExtractionService.js';
import { GeminiProvider } from '../ai/geminiProvider.js';
import { resultCache, computeCsvHash } from '../services/cacheService.js';
import { quotaGuard } from '../services/quotaGuard.js';
import { logger } from '../utils/logger.js';

export const importController = {
  /**
   * Main import endpoint controller.
   * Handles server-side file reception, validation, cache check, quota guard,
   * and AI parsing coordination.
   */
  async importLeads(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: 'No CSV file uploaded. Please upload a file.' });
      }

      logger.info(`Received file upload: ${file.originalname} (${file.size} bytes)`);

      // Read file buffer as UTF-8 string
      const csvString = file.buffer.toString('utf-8');

      // F4: Server-side parse and normalize headers
      const rawRows = csvService.parseCsvContent(csvString);

      if (rawRows.length === 0) {
        return res.status(400).json({ message: 'The uploaded CSV file contains no valid rows.' });
      }

      const headers = Object.keys(rawRows[0]);

      // P1: Compute normalized content hash and check result cache
      const csvHash = computeCsvHash(headers, rawRows);
      const cachedResult = resultCache.get(csvHash);

      if (cachedResult) {
        logger.info(`Cache HIT for hash ${csvHash.slice(0, 8)}… — skipping AI call.`);
        // Return immediately with cache flag; cache hits don't touch quotaGuard
        return res.status(200).json({ ...cachedResult, cached: true });
      }

      // P2: Check global Gemini quota BEFORE calling AI
      const quotaError = quotaGuard.checkAndIncrement();
      if (quotaError) {
        return res.status(429).json({ message: quotaError });
      }

      // Initialize AI mapping layers
      const geminiProvider = new GeminiProvider();
      const aiService = new AiExtractionService(geminiProvider);

      // Run sequential batch extraction + deterministic validation
      const result = await aiService.processImport(headers, rawRows);

      logger.info(`Completed import for ${file.originalname}. Parsed: ${result.totalParsed}, Skipped: ${result.totalSkipped}`);

      // P1: Store result in cache for identical future uploads
      resultCache.set(csvHash, result);

      // F8: Return structured JSON response (cached: false = fresh AI call)
      return res.status(200).json({ ...result, cached: false });
    } catch (err: any) {
      next(err);
    }
  }
};
