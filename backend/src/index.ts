import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import importRouter from './routes/importRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Set up CORS
app.use(cors({
  origin: (origin, callback) => {
    // Dynamically echo the origin back to bypass local CORS blocks
    callback(null, true);
  },
  credentials: true
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Healthcheck route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Import API routes
app.use('/api', importRouter);

// Centralized error handler (must be registered last)
app.use(errorHandler);

// Start Server
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});

export default app;
