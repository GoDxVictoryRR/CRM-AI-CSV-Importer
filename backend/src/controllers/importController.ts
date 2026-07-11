import { Request, Response, NextFunction } from 'express';
import { csvService } from '../services/csvService.js';
import { AiExtractionService } from '../services/aiExtractionService.js';
import { GeminiProvider } from '../ai/geminiProvider.js';
import { logger } from '../utils/logger.js';

export const importController = {
  /**
   * Main import endpoint controller.
   * Handles server-side file reception, validation, and AI parsing coordination.
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

      // Collect source headers
      const headers = Object.keys(rawRows[0]);

      // Initialize AI mapping layers
      const geminiProvider = new GeminiProvider();
      const aiService = new AiExtractionService(geminiProvider);

      // Run sequential batch extraction + deterministic validation
      const result = await aiService.processImport(headers, rawRows);

      logger.info(`Completed import for ${file.originalname}. Parsed: ${result.totalParsed}, Skipped: ${result.totalSkipped}`);

      // F8: Return structured JSON response
      return res.status(200).json(result);
    } catch (err: any) {
      next(err);
    }
  }
};
