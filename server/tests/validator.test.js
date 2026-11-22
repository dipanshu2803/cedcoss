import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAnalysis, sanitizeRawLLMOutput, ReviewAnalysisSchema } from '../services/validator.js';

test('Schema Validator: Accepts valid structured analysis', () => {
  const validOutput = JSON.stringify({
    sentiment: 'positive',
    topics: ['quality', 'delivery'],
    summary: 'The customer was very pleased with the fabric quality and fast shipping.',
    needs_reply: false
  });

  const res = validateAnalysis(validOutput);
  assert.equal(res.success, true);
  assert.equal(res.data.sentiment, 'positive');
  assert.deepEqual(res.data.topics, ['quality', 'delivery']);
  assert.equal(res.data.needs_reply, false);
});

test('Schema Validator: Strips markdown code blocks and repairs casing', () => {
  const markdownWrapped = `\`\`\`json
  {
    "sentiment": "NEGATIVE",
    "topics": ["QUALITY", "SUPPORT"],
    "summary": "Product broke and support was non-responsive.",
    "needs_reply": "true"
  }
  \`\`\``;

  const res = validateAnalysis(markdownWrapped);
  assert.equal(res.success, true);
  assert.equal(res.data.sentiment, 'negative');
  assert.deepEqual(res.data.topics, ['quality', 'support']);
  assert.equal(res.data.needs_reply, true, 'String "true" should be coerced to boolean true');
});

test('Schema Validator: Rejects invalid sentiment values', () => {
  const invalidSentiment = JSON.stringify({
    sentiment: 'ecstatic', // not allowed
    topics: ['quality'],
    summary: 'Awesome item',
    needs_reply: false
  });

  const res = validateAnalysis(invalidSentiment);
  assert.equal(res.success, false);
  assert.match(res.error, /Sentiment must be 'positive', 'neutral', or 'negative'/);
});

test('Schema Validator: Rejects missing summary or empty topics', () => {
  const missingSummary = JSON.stringify({
    sentiment: 'neutral',
    topics: [],
    summary: '',
    needs_reply: false
  });

  const res = validateAnalysis(missingSummary);
  assert.equal(res.success, false);
});
