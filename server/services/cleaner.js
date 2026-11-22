import crypto from 'crypto';
import { parse } from 'csv-parse/sync';

/**
 * Strips HTML tags from text (e.g. <b>Love it!</b> -> Love it!)
 */
export function stripHtml(input) {
  if (!input) return '';
  return input.replace(/<\/?[^>]+(>|$)/g, '').trim();
}

/**
 * Normalizes text for hashing and duplicate detection
 */
export function normalizeText(text) {
  if (!text) return '';
  return stripHtml(text)
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Calculates SHA-256 hash of normalized text
 */
export function hashText(text) {
  const normalized = normalizeText(text);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Safely parses rating into 1-5 integer or null ('unknown')
 * Handles empty ratings (,,), non-numeric words ('five'), nulls
 */
export function parseRating(rawRating) {
  if (rawRating === undefined || rawRating === null) {
    return { rating: null, rating_status: 'unknown' };
  }
  
  const trimmed = String(rawRating).trim().toLowerCase();
  if (trimmed === '') {
    return { rating: null, rating_status: 'unknown' };
  }
  
  // Try direct integer parse
  const num = Number(trimmed);
  if (!Number.isNaN(num) && Number.isInteger(num) && num >= 1 && num <= 5) {
    return { rating: num, rating_status: 'valid' };
  }

  // Common word representations that should still be recognized or flagged
  const wordMap = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5
  };
  if (wordMap[trimmed] !== undefined) {
    // Word rating present: treated as unknown numeric per requirement, but parsed value noted
    return { rating: null, raw_value: rawRating, rating_status: 'unknown' };
  }

  return { rating: null, raw_value: rawRating, rating_status: 'unknown' };
}

/**
 * Parses and cleans CSV review data
 * Handles bad rows without crashing:
 * - Empty reviews
 * - Missing or invalid ratings
 * - Duplicate reviews (same text)
 * - HTML tags
 */
export function cleanReviewsCsv(csvContent) {
  if (!csvContent || !csvContent.trim()) {
    throw new Error('CSV file is empty');
  }

  // Parse CSV with robust options
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    relax_quotes: true
  });

  const seenHashes = new Map(); // hash -> first review_id seen
  const cleanedRows = [];
  let emptyCount = 0;
  let duplicateCount = 0;
  let unknownRatingCount = 0;

  for (let i = 0; i < records.length; i++) {
    const raw = records[i];
    const reviewId = (raw.review_id || `R_GEN_${i + 1}`).trim();
    const product = (raw.product || 'Unknown Product').trim();
    const date = (raw.date || new Date().toISOString().split('T')[0]).trim();
    const rawText = raw.review_text !== undefined ? raw.review_text : '';
    const cleanedText = stripHtml(rawText);
    const { rating, rating_status } = parseRating(raw.rating);

    if (rating_status === 'unknown') {
      unknownRatingCount++;
    }

    // Check if review text is empty or purely whitespace
    if (!cleanedText || cleanedText.length === 0) {
      emptyCount++;
      cleanedRows.push({
        review_id: reviewId,
        product,
        rating,
        rating_status,
        date,
        review_text: '',
        raw_text: rawText,
        text_hash: '',
        is_empty: true,
        is_duplicate: false,
        status: 'empty_review',
        analysis: null
      });
      continue;
    }

    const textHash = hashText(cleanedText);
    const isDuplicate = seenHashes.has(textHash);
    const originalReviewId = isDuplicate ? seenHashes.get(textHash) : null;

    if (isDuplicate) {
      duplicateCount++;
    } else {
      seenHashes.set(textHash, reviewId);
    }

    cleanedRows.push({
      review_id: reviewId,
      product,
      rating,
      rating_status,
      date,
      review_text: cleanedText,
      raw_text: rawText,
      text_hash: textHash,
      is_empty: false,
      is_duplicate: isDuplicate,
      duplicate_of: originalReviewId,
      status: isDuplicate ? 'duplicate' : 'pending',
      analysis: null
    });
  }

  return {
    rows: cleanedRows,
    stats: {
      total_rows: cleanedRows.length,
      valid_rows: cleanedRows.filter(r => !r.is_empty).length,
      empty_rows: emptyCount,
      duplicate_rows: duplicateCount,
      unique_reviews_to_analyze: seenHashes.size,
      unknown_ratings: unknownRatingCount
    }
  };
}
