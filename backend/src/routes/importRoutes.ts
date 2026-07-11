import { Router } from 'express';
import multer from 'multer';
import { importController } from '../controllers/importController.js';
import { importRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Configure multer memory storage with size limit of 10MB
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit
  },
  fileFilter: (req, file, cb) => {
    // Validate uploaded files are actually CSV
    const isCsv = file.originalname.toLowerCase().endsWith('.csv') || file.mimetype === 'text/csv';
    if (isCsv) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed.'));
    }
  }
});

// POST /api/import route
router.post('/import', importRateLimiter, upload.single('file'), importController.importLeads);

export default router;
