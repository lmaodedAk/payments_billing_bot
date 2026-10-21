// server.js — entry point for the Zia Assistant backend
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config, isOriginAllowed } from './config.js';
import healthRouter from './routes/health.js';
import chatRouter from './routes/chat.js';
import { apiKeyMiddleware } from './middleware/apiKey.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no Origin header (same-origin, curl, health checks) or allowed origins
      if (!origin || isOriginAllowed(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin not allowed — ${origin}`));
    },
    credentials: true,
  })
);

// ── Body parsing (10 KB limit) ────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ── Rate limit on /api/chat: 20 req / min / IP ────────────────────────────────
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down and try again.' },
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Zia Payment & Billing Assistant Backend',
    endpoints: {
      health: '/health',
      chat: 'POST /api/chat',
    },
  });
});
app.use('/health', healthRouter);
app.use('/api/chat', chatLimiter, apiKeyMiddleware, chatRouter);

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start (only listen if not running in a serverless environment like Vercel) ──
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(config.PORT, () => {
    console.log(`✓ Zia Assistant backend listening on http://localhost:${config.PORT}`);
    console.log(`  Allowed origins : ${config.ALLOWED_ORIGINS.join(', ') || '(none)'}`);
    console.log(`  API keys active : ${config.API_KEYS.length > 0 ? 'yes' : 'no'}`);
  });
}

export default app;
