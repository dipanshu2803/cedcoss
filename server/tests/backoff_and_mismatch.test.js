import test from 'node:test';
import assert from 'node:assert/strict';
import { getBackoffDelay, checkRatingMismatch } from '../services/batcher.js';

test('Exponential Backoff: Computes increasing delay within bounds with jitter', () => {
  const delay0 = getBackoffDelay(0, 1000);
  const delay1 = getBackoffDelay(1, 1000);
  const delay2 = getBackoffDelay(2, 1000);

  assert.ok(delay0 >= 1000 && delay0 <= 1500, `Delay 0 (${delay0}) within range`);
  assert.ok(delay1 >= 2000 && delay1 <= 2500, `Delay 1 (${delay1}) within range`);
  assert.ok(delay2 >= 4000 && delay2 <= 4500, `Delay 2 (${delay2}) within range`);

  // Max delay clamp check
  const delayHigh = getBackoffDelay(10, 1000);
  assert.ok(delayHigh <= 10000, `Delay High (${delayHigh}) should be clamped to 10000ms`);
});

test('Rating Mismatch Check (Bonus): Flags reviews where star rating and sentiment disagree', () => {
  // Case 1: 5 stars but negative sentiment (e.g. R008: handles broke)
  const mismatch1 = checkRatingMismatch(5, 'negative');
  assert.equal(mismatch1.isMismatch, true);
  assert.equal(mismatch1.type, 'high_rating_negative_sentiment');

  // Case 2: 1 star but positive sentiment
  const mismatch2 = checkRatingMismatch(1, 'positive');
  assert.equal(mismatch2.isMismatch, true);
  assert.equal(mismatch2.type, 'low_rating_positive_sentiment');

  // Case 3: 5 stars with positive sentiment (Agreement)
  const match1 = checkRatingMismatch(5, 'positive');
  assert.equal(match1.isMismatch, false);

  // Case 4: Missing rating (null)
  const nullRating = checkRatingMismatch(null, 'positive');
  assert.equal(nullRating.isMismatch, false);
});
