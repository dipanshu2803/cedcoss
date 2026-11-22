import express from 'express';
import { generateMerchantReply } from '../services/reply.js';

const router = express.Router();

/**
 * POST /api/reply
 * On-demand reply generator for a review marked needs_reply
 * Core Requirement 7: "A suggested reply for each review marked needs_reply (generated on click, not upfront)"
 */
router.post('/', async (req, res) => {
  try {
    const { review } = req.body;
    if (!review) {
      return res.status(400).json({
        success: false,
        error: 'Review data is required to generate a suggested reply.'
      });
    }

    const suggestedReply = await generateMerchantReply(review);

    return res.json({
      success: true,
      review_id: review.review_id,
      suggested_reply: suggestedReply
    });
  } catch (err) {
    console.error('[ReviewLens] Reply generation error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to generate suggested reply'
    });
  }
});

export default router;
