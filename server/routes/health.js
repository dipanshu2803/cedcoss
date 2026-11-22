import express from 'express';
import { config } from '../config.js';
import { cacheService } from '../services/cache.js';

const router = express.Router();

router.get('/health', (req, res) => {
  const cacheStats = cacheService.getStats();
  
  // Mask API keys for safe display
  const hasGeminiKey = Boolean(config.geminiApiKey && config.geminiApiKey !== 'your_gemini_api_key_here');
  const hasGroqKey = Boolean(config.groqApiKey && config.groqApiKey !== 'your_groq_api_key_here');
  const hasOpenRouterKey = Boolean(config.openrouterApiKey && config.openrouterApiKey !== 'your_openrouter_api_key_here');

  res.json({
    status: 'online',
    appName: 'ReviewLens',
    version: '1.0.0',
    provider: config.llmProvider,
    model: config.geminiModel,
    activeProvider: hasGeminiKey ? 'Gemini API (Live)' : (hasGroqKey ? 'Groq API (Live)' : (hasOpenRouterKey ? 'OpenRouter API (Live)' : 'Mock Provider (Offline Deterministic)')),
    cache: cacheStats,
    batchSize: config.batchSize,
    uptimeSeconds: Math.floor(process.uptime())
  });
});

export default router;
