import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { cleanReviewsCsv } from '../services/cleaner.js';
import { processAllReviewsInBatches } from '../services/batcher.js';
import { generateInsights } from '../services/insights.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/**
 * POST /api/upload
 * Handles file upload from browser or raw CSV text in body
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    let csvContent = '';

    if (req.file) {
      csvContent = req.file.buffer.toString('utf8');
    } else if (req.body && req.body.csvText) {
      csvContent = req.body.csvText;
    } else {
      return res.status(400).json({
        success: false,
        error: 'No CSV file or CSV text was provided. Please upload a reviews.csv file.'
      });
    }

    // Step 1: Clean and parse CSV
    const { rows: cleanedRows, stats: cleaningStats } = cleanReviewsCsv(csvContent);

    // Step 2: Process with AI in batches with caching and backoff
    const { rows: processedRows, metrics } = await processAllReviewsInBatches(cleanedRows);

    // Step 3: Compute aggregated insights and dashboard statistics
    const insights = generateInsights(processedRows);

    return res.json({
      success: true,
      cleaning_stats: cleaningStats,
      metrics,
      insights,
      reviews: processedRows
    });
  } catch (err) {
    console.error('[ReviewLens] Upload processing error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'An error occurred while processing the CSV file'
    });
  }
});

/**
 * GET /api/sample
 * Loads and processes the default bundled reviews.csv dataset
 */
router.get('/sample', async (req, res) => {
  try {
    const samplePath = path.resolve(__dirname, '../../reviews.csv');
    if (!fs.existsSync(samplePath)) {
      return res.status(404).json({
        success: false,
        error: 'Sample reviews.csv file not found on server'
      });
    }

    const csvContent = fs.readFileSync(samplePath, 'utf8');
    const { rows: cleanedRows, stats: cleaningStats } = cleanReviewsCsv(csvContent);
    const { rows: processedRows, metrics } = await processAllReviewsInBatches(cleanedRows);
    const insights = generateInsights(processedRows);

    return res.json({
      success: true,
      cleaning_stats: cleaningStats,
      metrics,
      insights,
      reviews: processedRows
    });
  } catch (err) {
    console.error('[ReviewLens] Sample processing error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'An error occurred while processing sample reviews'
    });
  }
});

export default router;
