import { z } from 'zod';

/**
 * Permitted Sentiment Values
 */
export const ALLOWED_SENTIMENTS = ['positive', 'neutral', 'negative'];

/**
 * Permitted Topic Values
 */
export const ALLOWED_TOPICS = [
  'quality',
  'delivery',
  'size_fit',
  'price',
  'packaging',
  'support',
  'other'
];

/**
 * Zod Schema for strict validation of LLM output
 */
export const ReviewAnalysisSchema = z.object({
  sentiment: z.enum(['positive', 'neutral', 'negative'], {
    errorMap: () => ({ message: "Sentiment must be 'positive', 'neutral', or 'negative'" })
  }),
  topics: z
    .array(
      z.enum([
        'quality',
        'delivery',
        'size_fit',
        'price',
        'packaging',
        'support',
        'other'
      ])
    )
    .min(1, 'At least one topic must be specified'),
  summary: z
    .string()
    .min(1, 'Summary cannot be empty')
    .max(300, 'Summary should be concise and under 300 characters'),
  needs_reply: z.boolean({
    errorMap: () => ({ message: 'needs_reply must be a boolean (true or false)' })
  })
});

/**
 * Cleans and repairs common minor formatting anomalies in LLM JSON output
 * (e.g. Markdown code fences, trailing commas, capitalized enums)
 */
export function sanitizeRawLLMOutput(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('LLM output is empty or non-string');
  }

  let cleaned = rawText.trim();

  // Strip Markdown code block markers (```json ... ``` or ``` ... ```)
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Sometimes models prepend or append conversational chatter; find outer JSON boundary
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // Parse JSON
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Invalid JSON syntax: ${err.message}`);
  }

  // Normalize case for sentiment and topics if present
  if (parsed && typeof parsed === 'object') {
    if (typeof parsed.sentiment === 'string') {
      parsed.sentiment = parsed.sentiment.toLowerCase().trim();
    }

    if (Array.isArray(parsed.topics)) {
      parsed.topics = parsed.topics
        .map(t => (typeof t === 'string' ? t.toLowerCase().trim().replace(/[- /]/g, '_') : ''))
        .filter(t => ALLOWED_TOPICS.includes(t));
      
      // If none of the topics matched allowed list, fallback to 'other'
      if (parsed.topics.length === 0) {
        parsed.topics = ['other'];
      }
    }

    // Coerce needs_reply to boolean if it came as string "true"/"false"
    if (typeof parsed.needs_reply === 'string') {
      parsed.needs_reply = parsed.needs_reply.toLowerCase() === 'true';
    }
  }

  return parsed;
}

/**
 * Validates raw LLM output against the strict ReviewAnalysisSchema
 * Returns { success: true, data } or { success: false, error }
 */
export function validateAnalysis(rawOutput) {
  try {
    const sanitizedObj = sanitizeRawLLMOutput(rawOutput);
    const result = ReviewAnalysisSchema.safeParse(sanitizedObj);

    if (result.success) {
      return {
        success: true,
        data: result.data
      };
    }

    const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    return {
      success: false,
      error: `Schema validation failed: ${issues}`,
      raw: sanitizedObj
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}
