import { analyzeReviewWithValidation } from './llm.js';
import { cacheService } from './cache.js';
import { config } from '../config.js';

/**
 * Calculates exponential backoff delay with random jitter
 */
export function getBackoffDelay(attempt, baseMs = config.baseBackoffMs) {
  const exponential = baseMs * Math.pow(2, attempt);
  const jitter = Math.floor(Math.random() * 500);
  return Math.min(10000, exponential + jitter);
}

/**
 * Sleeps for specified milliseconds
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Checks if star rating and AI sentiment mismatch
 * e.g. R008: 5 stars, but negative text ("Terrible. Both handles came off...")
 */
export function checkRatingMismatch(rating, sentiment) {
  if (rating === null || rating === undefined || !sentiment) {
    return { isMismatch: false, reason: null };
  }

  // Rating 4-5 with negative sentiment
  if (rating >= 4 && sentiment === 'negative') {
    return {
      isMismatch: true,
      type: 'high_rating_negative_sentiment',
      reason: `Customer gave ${rating} stars but review text sentiment is negative`
    };
  }

  // Rating 1-2 with positive sentiment
  if (rating <= 2 && sentiment === 'positive') {
    return {
      isMismatch: true,
      type: 'low_rating_positive_sentiment',
      reason: `Customer gave ${rating} stars but review text sentiment is positive`
    };
  }

  return { isMismatch: false, reason: null };
}

/**
 * Processes a single batch of reviews with retries and exponential backoff
 */
async function processBatch(batch, batchIndex, totalBatches, onProgress) {
  const results = [];

  for (const row of batch) {
    // 1. If row was empty, skip AI call
    if (row.is_empty) {
      results.push({
        ...row,
        status: 'skipped_empty',
        analysis: null
      });
      continue;
    }

    // 2. Check Cache
    const cached = cacheService.get(row.text_hash);
    if (cached) {
      const mismatch = checkRatingMismatch(row.rating, cached.sentiment);
      results.push({
        ...row,
        status: 'cached',
        from_cache: true,
        rating_mismatch: mismatch,
        analysis: cached
      });
      continue;
    }

    // 3. Process with AI with exponential backoff on transient errors (429 / 5xx)
    let attempt = 0;
    let completed = false;
    let finalResult = null;

    while (attempt < config.maxRetries && !completed) {
      try {
        const analysisResponse = await analyzeReviewWithValidation(
          row.review_text,
          row.review_id,
          row.product,
          row.rating
        );

        if (analysisResponse.success) {
          finalResult = analysisResponse.data;
          completed = true;

          // Save to cache
          cacheService.set(row.text_hash, finalResult);
        } else {
          // Schema validation failure after retries
          finalResult = {
            status: 'analysis_failed',
            error: analysisResponse.error,
            retries: analysisResponse.retries
          };
          completed = true; // do not retry transiently if schema permanently failed
        }
      } catch (err) {
        attempt++;
        const isRateLimitOrServer = err.status === 429 || (err.status >= 500 && err.status < 600);

        if (isRateLimitOrServer && attempt < config.maxRetries) {
          const delay = getBackoffDelay(attempt);
          console.warn(`[ReviewLens] Rate limited or server error (status ${err.status}). Backing off for ${delay}ms (attempt ${attempt}/${config.maxRetries})...`);
          await sleep(delay);
        } else if (attempt >= config.maxRetries) {
          finalResult = {
            status: 'analysis_failed',
            error: `Max retries exceeded: ${err.message}`
          };
          completed = true;
        } else {
          // Non-retryable error
          finalResult = {
            status: 'analysis_failed',
            error: err.message
          };
          completed = true;
        }
      }
    }

    const isSuccess = finalResult && finalResult.status !== 'analysis_failed';
    const mismatch = isSuccess ? checkRatingMismatch(row.rating, finalResult.sentiment) : { isMismatch: false };

    results.push({
      ...row,
      status: isSuccess ? 'analyzed' : 'analysis_failed',
      from_cache: false,
      rating_mismatch: mismatch,
      analysis: finalResult
    });
  }

  if (typeof onProgress === 'function') {
    onProgress({
      batchIndex: batchIndex + 1,
      totalBatches,
      batchSize: batch.length
    });
  }

  return results;
}

/**
 * Splits array into chunks of given size
 */
export function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * Core Requirement 5: Batch processing with rate-limit handling & backoff
 * Processes all cleaned rows in batches (default 5 per batch)
 */
export async function processAllReviewsInBatches(cleanedRows, options = {}) {
  const startTime = Date.now();
  const batchSize = options.batchSize || config.batchSize;
  const onProgress = options.onProgress || null;

  // Map to hold analyzed results by hash for duplicate resolution
  const hashToAnalysisMap = new Map();

  // First pass: identify unique non-empty items to analyze
  const uniqueRowsToAnalyze = [];
  for (const row of cleanedRows) {
    if (row.is_empty) continue;
    if (!hashToAnalysisMap.has(row.text_hash)) {
      hashToAnalysisMap.set(row.text_hash, null);
      uniqueRowsToAnalyze.push(row);
    }
  }

  // Split unique reviews into batches
  const batches = chunkArray(uniqueRowsToAnalyze, batchSize);
  const analyzedUniqueResults = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const batchResults = await processBatch(batch, i, batches.length, onProgress);
    analyzedUniqueResults.push(...batchResults);

    // Update map with fresh results
    for (const res of batchResults) {
      if (res.text_hash && res.analysis) {
        hashToAnalysisMap.set(res.text_hash, res.analysis);
      }
    }

    // Gentle pacing between batches if multiple batches exist
    if (i < batches.length - 1) {
      await sleep(100);
    }
  }

  // Second pass: reconstruct full dataset with resolved duplicates and empty reviews
  let cacheHits = 0;
  let aiCalls = 0;
  let failedCount = 0;

  const finalRows = cleanedRows.map(row => {
    if (row.is_empty) {
      return {
        ...row,
        status: 'skipped_empty',
        analysis: null,
        rating_mismatch: { isMismatch: false }
      };
    }

    // Retrieve analysis result for this hash
    const analysis = hashToAnalysisMap.get(row.text_hash);

    // Determine if it was from cache or duplicate
    const wasCached = cacheService.has(row.text_hash);
    if (row.is_duplicate) {
      const mismatch = analysis ? checkRatingMismatch(row.rating, analysis.sentiment) : { isMismatch: false };
      return {
        ...row,
        status: 'duplicate_resolved',
        from_cache: true,
        rating_mismatch: mismatch,
        analysis
      };
    }

    // If analyzed in this run
    const uniqueMatch = analyzedUniqueResults.find(r => r.review_id === row.review_id);
    if (uniqueMatch) {
      if (uniqueMatch.from_cache) {
        cacheHits++;
      } else if (uniqueMatch.status === 'analysis_failed') {
        failedCount++;
      } else {
        aiCalls++;
      }
      return uniqueMatch;
    }

    // Fallback
    const mismatch = analysis ? checkRatingMismatch(row.rating, analysis.sentiment) : { isMismatch: false };
    return {
      ...row,
      status: analysis ? 'analyzed' : 'analysis_failed',
      from_cache: wasCached,
      rating_mismatch: mismatch,
      analysis
    };
  });

  const durationMs = Date.now() - startTime;

  return {
    rows: finalRows,
    metrics: {
      total_reviews: finalRows.length,
      analyzed_count: finalRows.filter(r => r.analysis && r.status !== 'analysis_failed').length,
      failed_count: finalRows.filter(r => r.status === 'analysis_failed').length,
      empty_count: finalRows.filter(r => r.is_empty).length,
      duplicate_count: finalRows.filter(r => r.is_duplicate).length,
      cache_hits: cacheHits,
      ai_calls: aiCalls,
      duration_ms: durationMs,
      estimated_cost_usd: '0.00 (Free Tier)'
    }
  };
}
