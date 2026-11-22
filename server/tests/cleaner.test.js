import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanReviewsCsv, parseRating, stripHtml, hashText } from '../services/cleaner.js';

test('CSV Cleaner: Strips HTML tags properly', () => {
  const dirty = '<b>Love it!</b> Keeps my desk clean &amp; neat.';
  const cleaned = stripHtml(dirty);
  assert.equal(cleaned, 'Love it! Keeps my desk clean &amp; neat.');
});

test('CSV Cleaner: Handles rating edge cases (missing, word numbers, valid)', () => {
  // Valid integer
  const valid5 = parseRating('5');
  assert.equal(valid5.rating, 5);
  assert.equal(valid5.rating_status, 'valid');

  // Missing / empty rating
  const missing = parseRating('');
  assert.equal(missing.rating, null);
  assert.equal(missing.rating_status, 'unknown');

  const nullVal = parseRating(null);
  assert.equal(nullVal.rating, null);
  assert.equal(nullVal.rating_status, 'unknown');

  // Word number e.g. "five"
  const wordRating = parseRating('five');
  assert.equal(wordRating.rating, null);
  assert.equal(wordRating.rating_status, 'unknown');

  // Out of range number
  const outOfRange = parseRating('9');
  assert.equal(outOfRange.rating, null);
  assert.equal(outOfRange.rating_status, 'unknown');
});

test('CSV Cleaner: Correctly identifies empty reviews and duplicates in a batch', () => {
  const sampleCsv = `review_id,product,rating,date,review_text
R001,Widget,5,2026-10-01,"Great widget, loved it."
R002,Widget,5,2026-10-02,""
R003,Widget,1,2026-10-03,"Broken on day one."
R004,Widget,1,2026-10-04,"Broken on day one."
R005,Widget,,2026-10-05,"Good value."
R006,Widget,five,2026-10-06,"Awesome item."`;

  const { rows, stats } = cleanReviewsCsv(sampleCsv);

  assert.equal(stats.total_rows, 6);
  assert.equal(stats.empty_rows, 1, 'Should identify 1 empty review');
  assert.equal(stats.duplicate_rows, 1, 'Should identify 1 duplicate review (R004 duplicate of R003)');
  assert.equal(stats.unknown_ratings, 2, 'Should detect 2 unknown ratings (missing and word "five")');

  // Check R002 is flagged as empty
  const r2 = rows.find(r => r.review_id === 'R002');
  assert.equal(r2.is_empty, true);
  assert.equal(r2.status, 'empty_review');

  // Check R004 is flagged as duplicate of R003
  const r4 = rows.find(r => r.review_id === 'R004');
  assert.equal(r4.is_duplicate, true);
  assert.equal(r4.duplicate_of, 'R003');
  assert.equal(r4.status, 'duplicate');

  // Check hashes are identical for identical text
  const r3 = rows.find(r => r.review_id === 'R003');
  assert.equal(r3.text_hash, r4.text_hash);
});
