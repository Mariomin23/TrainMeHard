import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';
import authRoutes from './routes/auth.routes.js';
import professionalRoutes from './routes/professional.routes.js';
import sessionRoutes from './routes/session.routes.js';
import reviewRoutes from './routes/review.routes.js';
import { handleWebhook } from './controllers/session.controller.js';

const app = express();

// Webhook necesita raw body — debe ir ANTES de express.json()
app.post('/api/webhook', express.raw({ type: 'application/json' }), handleWebhook);

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(mongoSanitize());

app.get('/api/health', (_req, res) => res.json({ status: 'ok', env: env.NODE_ENV }));

app.use('/api/auth', authRoutes);
app.use('/api/professionals', professionalRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/reviews', reviewRoutes);

app.use(errorHandler);

export default app;
