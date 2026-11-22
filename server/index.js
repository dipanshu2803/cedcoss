import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import uploadRouter from './routes/upload.js';
import replyRouter from './routes/reply.js';
import healthRouter from './routes/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[ReviewLens] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Mount API Routes
app.use('/api', healthRouter);
app.use('/api', uploadRouter);
app.use('/api/reply', replyRouter);

// Serve Frontend Static Assets if built
const clientDistPath = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // If client is not yet built, provide a developer welcome info route
  app.get('/', (req, res) => {
    res.json({
      name: 'ReviewLens API Server',
      status: 'active',
      endpoints: {
        health: 'GET /api/health',
        upload: 'POST /api/upload',
        sample: 'GET /api/sample',
        suggestReply: 'POST /api/reply'
      },
      note: 'Run `npm run build` or start the React dev server to view the frontend dashboard.'
    });
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[ReviewLens Server Error]', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Start Server
const server = app.listen(config.port, () => {
  console.log(`===============================================`);
  console.log(` ReviewLens Backend running at http://localhost:${config.port}`);
  console.log(` Active LLM Provider: ${config.llmProvider}`);
  console.log(` Environment: ${config.nodeEnv}`);
  console.log(`===============================================`);
});

export default app;
