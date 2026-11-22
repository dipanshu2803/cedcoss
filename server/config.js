import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // LLM Provider: 'gemini' | 'groq' | 'openrouter' | 'mock'
  llmProvider: (process.env.LLM_PROVIDER || 'gemini').toLowerCase(),
  
  // Gemini
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  
  // Groq
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  
  // OpenRouter
  openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
  openrouterModel: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free',
  
  // Processing settings
  batchSize: parseInt(process.env.BATCH_SIZE, 10) || 5,
  maxRetries: parseInt(process.env.MAX_RETRIES, 10) || 3,
  baseBackoffMs: parseInt(process.env.BASE_BACKOFF_MS, 10) || 1000,
  
  // Database / Storage
  dataDir: path.resolve(__dirname, '../data')
};
