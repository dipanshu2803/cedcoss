import test from 'node:test';
import assert from 'node:assert/strict';
import { cacheService } from '../services/cache.js';
import { hashText } from '../services/cleaner.js';

test('Cache Service: Stores and retrieves review analysis by SHA-256 hash', () => {
  const text = 'Super soft fabric, colours did not fade after 3 washes. Worth the price.';
  const hash = hashText(text);

  const sampleAnalysis = {
    sentiment: 'positive',
    topics: ['quality', 'price'],
    summary: 'Great durable fabric that retains colour well.',
    needs_reply: false,
    provider: 'test-runner'
  };

  // Set in cache
  cacheService.set(hash, sampleAnalysis);

  // Check cache has
  assert.equal(cacheService.has(hash), true);

  // Retrieve
  const cached = cacheService.get(hash);
  assert.ok(cached, 'Cached entry should exist');
  assert.equal(cached.sentiment, 'positive');
  assert.deepEqual(cached.topics, ['quality', 'price']);
  assert.equal(cached.needs_reply, false);
  assert.equal(cached.cached, true);
});

test('Cache Service: Normalized text produces identical cache keys', () => {
  const textA = 'Sound quality is great for this price. Battery lasts around 5 hours.';
  const textB = '  Sound quality is great for this price.  Battery lasts around 5 hours.  \n';

  const hashA = hashText(textA);
  const hashB = hashText(textB);

  assert.equal(hashA, hashB, 'Whitespace variations should produce identical hashes');
});
