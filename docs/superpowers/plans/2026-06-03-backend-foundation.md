# Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reescribir `fitness-backend/src/` desde cero para que coincida exactamente con el spec `docs/superpowers/specs/2026-06-03-backend-foundation-design.md`.

**Architecture:** Clean-room rewrite usando capas estrictas: config → utils → models → middlewares → services → controllers → routes → app. Cada capa solo importa de capas más profundas. La lógica de Stripe vive exclusivamente en `payment.service.js` y `payout.service.js`.

**Tech Stack:** Node.js 20 LTS, Express 5, Mongoose 8, Zod 4, JWT, bcryptjs, Winston, Stripe SDK, cookie-parser, express-mongo-sanitize, Vitest (tests)

---

## File Map

| Acción | Archivo |
|---|---|
| DELETE all | `fitness-backend/src/**` |
| CREATE | `fitness-backend/server.js` (reemplaza entry point) |
| CREATE | `fitness-backend/src/app.js` |
| CREATE | `fitness-backend/src/config/env.js` |
| CREATE | `fitness-backend/src/config/db.js` |
| CREATE | `fitness-backend/src/config/stripe.js` |
| CREATE | `fitness-backend/src/utils/jwt.util.js` |
| CREATE | `fitness-backend/src/utils/apiResponse.util.js` |
| CREATE | `fitness-backend/src/utils/priceFormatter.util.js` |
| CREATE | `fitness-backend/src/utils/logger.util.js` |
| CREATE | `fitness-backend/src/models/User.model.js` |
| CREATE | `fitness-backend/src/models/Professional.model.js` |
| CREATE | `fitness-backend/src/models/Session.model.js` |
| CREATE | `fitness-backend/src/models/Review.model.js` |
| CREATE | `fitness-backend/src/middlewares/errorHandler.middleware.js` |
| CREATE | `fitness-backend/src/middlewares/validate.middleware.js` |
| CREATE | `fitness-backend/src/middlewares/auth.middleware.js` |
| CREATE | `fitness-backend/src/middlewares/rbac.middleware.js` |
| CREATE | `fitness-backend/src/middlewares/rateLimiter.middleware.js` |
| CREATE | `fitness-backend/src/services/notification.service.js` |
| CREATE | `fitness-backend/src/services/auth.service.js` |
| CREATE | `fitness-backend/src/services/professional.service.js` |
| CREATE | `fitness-backend/src/services/search.service.js` |
| CREATE | `fitness-backend/src/services/payment.service.js` |
| CREATE | `fitness-backend/src/services/payout.service.js` |
| CREATE | `fitness-backend/src/controllers/auth.controller.js` |
| CREATE | `fitness-backend/src/controllers/professional.controller.js` |
| CREATE | `fitness-backend/src/controllers/session.controller.js` |
| CREATE | `fitness-backend/src/controllers/review.controller.js` |
| CREATE | `fitness-backend/src/routes/auth.routes.js` |
| CREATE | `fitness-backend/src/routes/professional.routes.js` |
| CREATE | `fitness-backend/src/routes/session.routes.js` |
| CREATE | `fitness-backend/src/routes/review.routes.js` |
| CREATE | `fitness-backend/tests/setup.js` |
| CREATE | `fitness-backend/vitest.config.js` |
| CREATE | `fitness-backend/tests/utils/jwt.util.test.js` |
| CREATE | `fitness-backend/tests/utils/apiResponse.util.test.js` |
| CREATE | `fitness-backend/tests/utils/priceFormatter.util.test.js` |
| CREATE | `fitness-backend/tests/middlewares/validate.middleware.test.js` |
| CREATE | `fitness-backend/tests/middlewares/auth.middleware.test.js` |
| CREATE | `fitness-backend/tests/middlewares/rbac.middleware.test.js` |
| CREATE | `fitness-backend/tests/services/auth.service.test.js` |
| CREATE | `fitness-backend/tests/services/payment.service.test.js` |
| MODIFY | `fitness-backend/package.json` |
| MODIFY | `fitness-backend/.env` |
| CREATE | `fitness-backend/.env.example` |

---

## Task 1: Cleanup + dependencias + Vitest

**Files:**
- Modify: `fitness-backend/package.json`
- Create: `fitness-backend/vitest.config.js`
- Create: `fitness-backend/tests/setup.js`
- Delete: `fitness-backend/src/**` (todo el contenido)

- [ ] **Step 1.1: Eliminar contenido antiguo de src/**

```bash
cd fitness-backend
rm -rf src/
mkdir -p src/config src/models src/controllers src/services src/routes src/middlewares src/utils
mkdir -p tests/utils tests/middlewares tests/services
```

- [ ] **Step 1.2: Instalar nuevas dependencias**

```bash
npm install winston cookie-parser express-mongo-sanitize uuid
npm install --save-dev vitest
```

- [ ] **Step 1.3: Actualizar package.json**

Reemplazar el contenido de `fitness-backend/package.json`:

```json
{
  "name": "fitness-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "express-mongo-sanitize": "^2.2.0",
    "express-rate-limit": "^8.5.2",
    "helmet": "^8.1.0",
    "jsonwebtoken": "^9.0.3",
    "mongoose": "^9.6.2",
    "morgan": "^1.10.1",
    "stripe": "^22.1.1",
    "uuid": "^11.1.0",
    "winston": "^3.17.0",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "nodemon": "^3.1.14",
    "vitest": "^3.2.0"
  }
}
```

- [ ] **Step 1.4: Crear vitest.config.js**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
  },
});
```

- [ ] **Step 1.5: Crear tests/setup.js**

Este archivo setea variables de entorno antes de que cualquier módulo importe `config/env.js`.

```js
process.env.NODE_ENV = 'test';
process.env.PORT = '3002';
process.env.MONGODB_URI = 'mongodb://localhost:27017/trainmehard_test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_that_is_at_least_32_chars_long!!';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_that_is_at_least_32_chars!!';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder_000000000000000000000000000000';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_placeholder';
process.env.CORS_ORIGIN = 'http://localhost:3000';
```

- [ ] **Step 1.6: Verificar que vitest arranca**

```bash
npx vitest run
```
Resultado esperado: `No test files found` (no hay tests aún, pero no debe crashear)

- [ ] **Step 1.7: Commit**

> Nota: todos los comandos bash de este plan se ejecutan desde `fitness-backend/`. Git resuelve los paths desde el CWD dentro del repo.

```bash
git add package.json vitest.config.js tests/setup.js
git commit -m "chore(backend): clean slate — install deps + vitest setup"
```

---

## Task 2: config/env.js

**Files:**
- Create: `fitness-backend/src/config/env.js`

- [ ] **Step 2.1: Crear src/config/env.js**

```js
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
```

- [ ] **Step 2.2: Commit**

```bash
cd fitness-backend
git add src/config/env.js
git commit -m "feat(backend): add config/env.js with Zod validation"
```

---

## Task 3: utils/ (jwt, apiResponse, priceFormatter, logger)

**Files:**
- Create: `fitness-backend/src/utils/logger.util.js`
- Create: `fitness-backend/src/utils/jwt.util.js`
- Create: `fitness-backend/src/utils/apiResponse.util.js`
- Create: `fitness-backend/src/utils/priceFormatter.util.js`
- Create: `fitness-backend/tests/utils/jwt.util.test.js`
- Create: `fitness-backend/tests/utils/apiResponse.util.test.js`
- Create: `fitness-backend/tests/utils/priceFormatter.util.test.js`

- [ ] **Step 3.1: Escribir tests fallidos para jwt.util**

```js
// tests/utils/jwt.util.test.js
import { describe, it, expect } from 'vitest';
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from '../../src/utils/jwt.util.js';

describe('jwt.util', () => {
  it('signAccessToken crea token verificable con payload correcto', () => {
    const token = signAccessToken({ id: 'abc123', role: 'user' });
    expect(typeof token).toBe('string');
    const payload = verifyAccessToken(token);
    expect(payload.id).toBe('abc123');
    expect(payload.role).toBe('user');
  });

  it('verifyAccessToken lanza para token inválido', () => {
    expect(() => verifyAccessToken('invalid.token.here')).toThrow();
  });

  it('signRefreshToken crea JWT verificable con userId', () => {
    const token = signRefreshToken('user456');
    const payload = verifyRefreshToken(token);
    expect(payload.id).toBe('user456');
  });

  it('verifyRefreshToken lanza para token inválido', () => {
    expect(() => verifyRefreshToken('bad_token')).toThrow();
  });
});
```

- [ ] **Step 3.2: Escribir tests fallidos para apiResponse.util**

```js
// tests/utils/apiResponse.util.test.js
import { describe, it, expect, vi } from 'vitest';
import { success, error } from '../../src/utils/apiResponse.util.js';

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('apiResponse.util', () => {
  it('success responde con 200 y success:true por defecto', () => {
    const res = mockRes();
    success(res, { id: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1 } });
  });

  it('success responde con statusCode custom', () => {
    const res = mockRes();
    success(res, {}, 201);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('error responde con success:false y código de error', () => {
    const res = mockRes();
    error(res, 'NOT_FOUND', 'Resource not found', 404);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Resource not found', statusCode: 404 },
    });
  });
});
```

- [ ] **Step 3.3: Escribir tests fallidos para priceFormatter.util**

```js
// tests/utils/priceFormatter.util.test.js
import { describe, it, expect } from 'vitest';
import { eurToCents, centsToEur, formatPrice } from '../../src/utils/priceFormatter.util.js';

describe('priceFormatter.util', () => {
  it('eurToCents convierte euros a centavos', () => {
    expect(eurToCents(10)).toBe(1000);
    expect(eurToCents(9.99)).toBe(999);
    expect(eurToCents(0.5)).toBe(50);
  });

  it('centsToEur convierte centavos a euros con 2 decimales', () => {
    expect(centsToEur(1000)).toBe(10);
    expect(centsToEur(999)).toBe(9.99);
  });

  it('formatPrice formatea como moneda EUR', () => {
    const result = formatPrice(10);
    expect(result).toContain('10');
    expect(result).toContain('€');
  });
});
```

- [ ] **Step 3.4: Ejecutar tests — verificar que fallan**

```bash
npx vitest run tests/utils/
```
Resultado esperado: FAIL con `Cannot find module '../../src/utils/jwt.util.js'`

- [ ] **Step 3.5: Implementar src/utils/logger.util.js**

```js
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    process.env.NODE_ENV === 'production'
      ? format.json()
      : format.combine(format.colorize(), format.simple())
  ),
  transports: [new transports.Console()],
});

export default logger;
```

- [ ] **Step 3.6: Implementar src/utils/jwt.util.js**

```js
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signAccessToken = (payload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN });

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET);

export const signRefreshToken = (userId) =>
  jwt.sign({ id: String(userId) }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });

export const verifyRefreshToken = (token) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET);
```

- [ ] **Step 3.7: Implementar src/utils/apiResponse.util.js**

```js
export const success = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

export const error = (res, code, message, statusCode = 500) =>
  res.status(statusCode).json({ success: false, error: { code, message, statusCode } });
```

- [ ] **Step 3.8: Implementar src/utils/priceFormatter.util.js**

```js
export const eurToCents = (eur) => Math.round(eur * 100);
export const centsToEur = (cents) => +(cents / 100).toFixed(2);
export const formatPrice = (eur, currency = 'EUR') =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(eur);
```

- [ ] **Step 3.9: Ejecutar tests — verificar que pasan**

```bash
npx vitest run tests/utils/
```
Resultado esperado: `3 tests passed`

- [ ] **Step 3.10: Commit**

```bash
git add src/utils/ tests/utils/
git commit -m "feat(backend): add utils — jwt, apiResponse, priceFormatter, logger"
```

---

## Task 4: config/db.js + config/stripe.js

**Files:**
- Create: `fitness-backend/src/config/db.js`
- Create: `fitness-backend/src/config/stripe.js`

- [ ] **Step 4.1: Implementar src/config/db.js**

```js
import mongoose from 'mongoose';
import { env } from './env.js';
import logger from '../utils/logger.util.js';

export const connectDB = async () => {
  await mongoose.connect(env.MONGODB_URI);
  logger.info('MongoDB connected');
};
```

- [ ] **Step 4.2: Implementar src/config/stripe.js**

```js
import Stripe from 'stripe';
import { env } from './env.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export default stripe;
```

- [ ] **Step 4.3: Commit**

```bash
git add src/config/db.js src/config/stripe.js
git commit -m "feat(backend): add config/db.js and config/stripe.js"
```

---

## Task 5: Models (User, Professional, Session, Review)

**Files:**
- Create: `fitness-backend/src/models/User.model.js`
- Create: `fitness-backend/src/models/Professional.model.js`
- Create: `fitness-backend/src/models/Session.model.js`
- Create: `fitness-backend/src/models/Review.model.js`

- [ ] **Step 5.1: Crear src/models/User.model.js**

```js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['user', 'professional', 'admin', 'super_admin'],
    default: 'user',
  },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  avatar: { type: String },
  isVerified: { type: Boolean, default: false },
  refreshTokenHash: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('User', userSchema);
```

- [ ] **Step 5.2: Crear src/models/Professional.model.js**

```js
import mongoose from 'mongoose';

const professionalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    professionalType: {
      type: String,
      enum: ['trainer', 'nutritionist', 'physiotherapist'],
      required: true,
    },
    bio: { type: String, maxlength: 500, default: '' },
    specialties: [{ type: String }],
    location: {
      city: { type: String, default: '' },
      country: { type: String, default: '' },
      coordinates: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] },
      },
    },
    sessionPrice: { type: Number, required: true, min: 0, default: 0 },
    stripeAccountId: { type: String },
    isApproved: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

professionalSchema.index({ 'location.coordinates': '2dsphere' });

export default mongoose.model('Professional', professionalSchema);
```

- [ ] **Step 5.3: Crear src/models/Session.model.js**

```js
import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  professionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', required: true },
  status: {
    type: String,
    enum: ['pending', 'paid', 'completed', 'cancelled', 'disputed'],
    default: 'pending',
  },
  sessionPrice: { type: Number, required: true },
  platformFee: { type: Number, required: true },
  professionalPayout: { type: Number, required: true },
  stripePaymentIntentId: { type: String },
  scheduledAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Session', sessionSchema);
```

- [ ] **Step 5.4: Crear src/models/Review.model.js**

```js
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  professionalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professional',
    required: true,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    unique: true,
  },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Review', reviewSchema);
```

- [ ] **Step 5.5: Commit**

```bash
git add src/models/
git commit -m "feat(backend): add Mongoose models — User, Professional, Session, Review"
```

---

## Task 6: Middlewares (errorHandler, validate, auth, rbac, rateLimiter)

**Files:**
- Create: `fitness-backend/src/middlewares/errorHandler.middleware.js`
- Create: `fitness-backend/src/middlewares/validate.middleware.js`
- Create: `fitness-backend/src/middlewares/auth.middleware.js`
- Create: `fitness-backend/src/middlewares/rbac.middleware.js`
- Create: `fitness-backend/src/middlewares/rateLimiter.middleware.js`
- Create: `fitness-backend/tests/middlewares/validate.middleware.test.js`
- Create: `fitness-backend/tests/middlewares/auth.middleware.test.js`
- Create: `fitness-backend/tests/middlewares/rbac.middleware.test.js`

- [ ] **Step 6.1: Escribir tests fallidos para validate.middleware**

```js
// tests/middlewares/validate.middleware.test.js
import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { validate } from '../../src/middlewares/validate.middleware.js';

const mockReqRes = (body = {}) => {
  const req = { body };
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const next = vi.fn();
  return { req, res, next };
};

describe('validate middleware', () => {
  const schema = z.object({ name: z.string().min(1), age: z.number() });

  it('llama next() con body válido', () => {
    const { req, res, next } = mockReqRes({ name: 'Ana', age: 25 });
    validate(schema)(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: 'Ana', age: 25 });
  });

  it('llama next(error) con body inválido', () => {
    const { req, res, next } = mockReqRes({ name: '' });
    validate(schema)(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
```

- [ ] **Step 6.2: Escribir tests fallidos para auth.middleware**

```js
// tests/middlewares/auth.middleware.test.js
import { describe, it, expect, vi } from 'vitest';
import { requireAuth } from '../../src/middlewares/auth.middleware.js';
import { signAccessToken } from '../../src/utils/jwt.util.js';

const mockReqRes = (authHeader = '') => {
  const req = { headers: { authorization: authHeader } };
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const next = vi.fn();
  return { req, res, next };
};

describe('requireAuth middleware', () => {
  it('llama next() con token válido y cuelga req.user', () => {
    const token = signAccessToken({ id: 'u1', role: 'user' });
    const { req, res, next } = mockReqRes(`Bearer ${token}`);
    requireAuth(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual({ id: 'u1', role: 'user' });
  });

  it('responde 401 sin header Authorization', () => {
    const { req, res, next } = mockReqRes('');
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('responde 401 con token inválido', () => {
    const { req, res, next } = mockReqRes('Bearer bad.token.here');
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
```

- [ ] **Step 6.3: Escribir tests fallidos para rbac.middleware**

```js
// tests/middlewares/rbac.middleware.test.js
import { describe, it, expect, vi } from 'vitest';
import { requireRole } from '../../src/middlewares/rbac.middleware.js';

const mockReqRes = (role = null) => {
  const req = { user: role ? { id: 'u1', role } : undefined };
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const next = vi.fn();
  return { req, res, next };
};

describe('requireRole middleware', () => {
  it('llama next() cuando el rol está en la lista', () => {
    const { req, res, next } = mockReqRes('admin');
    requireRole('admin', 'super_admin')(req, res, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('responde 403 cuando el rol no está en la lista', () => {
    const { req, res, next } = mockReqRes('user');
    requireRole('admin')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('responde 401 sin req.user', () => {
    const { req, res, next } = mockReqRes(null);
    requireRole('admin')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
```

- [ ] **Step 6.4: Ejecutar tests — verificar que fallan**

```bash
npx vitest run tests/middlewares/
```
Resultado esperado: FAIL con `Cannot find module`

- [ ] **Step 6.5: Implementar src/middlewares/errorHandler.middleware.js**

```js
import { ZodError } from 'zod';
import logger from '../utils/logger.util.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { path: req.path, stack: env.NODE_ENV === 'development' ? err.stack : undefined });

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', statusCode: 400, details: err.errors },
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: { code: 'DUPLICATE_ENTRY', message: 'Resource already exists', statusCode: 409 },
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: err.message || 'Internal server error',
      statusCode,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
```

- [ ] **Step 6.6: Implementar src/middlewares/validate.middleware.js**

```js
export const validate = (schema, target = 'body') => (req, res, next) => {
  try {
    req[target] = schema.parse(req[target]);
    next();
  } catch (err) {
    next(err);
  }
};
```

- [ ] **Step 6.7: Implementar src/middlewares/auth.middleware.js**

```js
import { verifyAccessToken } from '../utils/jwt.util.js';

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token', statusCode: 401 },
    });
  }
  try {
    const token = header.slice(7);
    const payload = verifyAccessToken(token);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Token expired or invalid', statusCode: 401 },
    });
  }
};
```

- [ ] **Step 6.8: Implementar src/middlewares/rbac.middleware.js**

```js
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required', statusCode: 401 },
    });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Insufficient permissions', statusCode: 403 },
    });
  }
  next();
};
```

- [ ] **Step 6.9: Implementar src/middlewares/rateLimiter.middleware.js**

```js
import rateLimit from 'express-rate-limit';

const limiterMessage = (code) => ({
  success: false,
  error: { code, message: 'Too many requests, please try again later.', statusCode: 429 },
});

export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: limiterMessage('RATE_LIMIT_EXCEEDED'),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: limiterMessage('AUTH_RATE_LIMIT_EXCEEDED'),
});
```

- [ ] **Step 6.10: Ejecutar tests — verificar que pasan**

```bash
npx vitest run tests/middlewares/
```
Resultado esperado: `6 tests passed`

- [ ] **Step 6.11: Commit**

```bash
git add src/middlewares/ tests/middlewares/
git commit -m "feat(backend): add middlewares — errorHandler, validate, auth, rbac, rateLimiter"
```

---

## Task 7: services/auth.service.js + services/notification.service.js

**Files:**
- Create: `fitness-backend/src/services/notification.service.js`
- Create: `fitness-backend/src/services/auth.service.js`
- Create: `fitness-backend/tests/services/auth.service.test.js`

- [ ] **Step 7.1: Escribir tests fallidos para auth.service**

```js
// tests/services/auth.service.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/models/User.model.js', () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock('../../src/models/Professional.model.js', () => ({
  default: { create: vi.fn() },
}));

vi.mock('../../src/utils/logger.util.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import * as authService from '../../src/services/auth.service.js';
import User from '../../src/models/User.model.js';
import bcrypt from 'bcryptjs';

const mockRes = () => {
  const res = { cookie: vi.fn(), clearCookie: vi.fn() };
  return res;
};

describe('auth.service', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('register', () => {
    it('lanza EMAIL_ALREADY_EXISTS si el email ya existe', async () => {
      User.findOne.mockResolvedValue({ _id: 'existing' });
      await expect(authService.register({ firstName: 'A', lastName: 'B', email: 'a@b.com', password: 'pass' }, mockRes()))
        .rejects.toMatchObject({ code: 'EMAIL_ALREADY_EXISTS', statusCode: 409 });
    });

    it('crea User y devuelve accessToken + user cuando el email es nuevo', async () => {
      User.findOne.mockResolvedValue(null);
      const fakeUser = {
        _id: 'uid1',
        firstName: 'Ana',
        lastName: 'López',
        email: 'ana@test.com',
        role: 'user',
        refreshTokenHash: null,
        save: vi.fn().mockResolvedValue(true),
      };
      User.create.mockResolvedValue(fakeUser);

      const res = mockRes();
      const result = await authService.register(
        { firstName: 'Ana', lastName: 'López', email: 'ana@test.com', password: 'secret123', role: 'user' },
        res
      );

      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe('ana@test.com');
      expect(res.cookie).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('lanza INVALID_CREDENTIALS si el usuario no existe', async () => {
      User.findOne.mockResolvedValue(null);
      await expect(authService.login({ email: 'x@x.com', password: 'pw' }, mockRes()))
        .rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', statusCode: 401 });
    });

    it('lanza INVALID_CREDENTIALS si la contraseña es incorrecta', async () => {
      User.findOne.mockResolvedValue({ passwordHash: await bcrypt.hash('correct', 10) });
      await expect(authService.login({ email: 'x@x.com', password: 'wrong' }, mockRes()))
        .rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', statusCode: 401 });
    });
  });

  describe('logout', () => {
    it('borra refreshTokenHash y limpia cookie', async () => {
      User.findByIdAndUpdate.mockResolvedValue({});
      const res = mockRes();
      await authService.logout('uid1', res);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('uid1', { refreshTokenHash: null });
      expect(res.clearCookie).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 7.2: Ejecutar test — verificar que falla**

```bash
npx vitest run tests/services/auth.service.test.js
```
Resultado esperado: FAIL con `Cannot find module '../../src/services/auth.service.js'`

- [ ] **Step 7.3: Implementar src/services/notification.service.js**

```js
// Stub: no-op until Phase 3 (Resend integration)
export const sendEmail = async (_to, _template, _data) => {};
```

- [ ] **Step 7.4: Implementar src/services/auth.service.js**

```js
import bcrypt from 'bcryptjs';
import User from '../models/User.model.js';
import Professional from '../models/Professional.model.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.util.js';
import logger from '../utils/logger.util.js';

const SALT_ROUNDS = 12;
const REFRESH_HASH_ROUNDS = 10;

const makeError = (message, code, statusCode) =>
  Object.assign(new Error(message), { code, statusCode });

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth/refresh',
  });
};

const issueTokenPair = async (user, res) => {
  const accessToken = signAccessToken({ id: String(user._id), role: user.role });
  const rawRefresh = signRefreshToken(user._id);
  const refreshHash = await bcrypt.hash(rawRefresh, REFRESH_HASH_ROUNDS);

  user.refreshTokenHash = refreshHash;
  await user.save();
  setRefreshCookie(res, rawRefresh);

  return {
    accessToken,
    user: {
      id: String(user._id),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    },
  };
};

export const register = async (data, res) => {
  const { firstName, lastName, email, password, role = 'user', professionalType } = data;

  if (await User.findOne({ email })) {
    throw makeError('Email already registered', 'EMAIL_ALREADY_EXISTS', 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ firstName, lastName, email, passwordHash, role });

  if (role === 'professional') {
    await Professional.create({
      userId: user._id,
      professionalType: professionalType || 'trainer',
      sessionPrice: 0,
    });
  }

  logger.info(`User registered: ${email}`);
  return issueTokenPair(user, res);
};

export const login = async ({ email, password }, res) => {
  const user = await User.findOne({ email });
  const valid = user && (await bcrypt.compare(password, user.passwordHash));

  if (!valid) {
    logger.warn(`Failed login: ${email}`);
    throw makeError('Invalid credentials', 'INVALID_CREDENTIALS', 401);
  }

  logger.info(`User logged in: ${email}`);
  return issueTokenPair(user, res);
};

export const refreshTokens = async (rawToken, res) => {
  if (!rawToken) {
    throw makeError('Refresh token missing', 'INVALID_REFRESH_TOKEN', 401);
  }

  let payload;
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    throw makeError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN', 401);
  }

  const user = await User.findById(payload.id);
  if (!user?.refreshTokenHash) {
    throw makeError('Token revoked', 'INVALID_REFRESH_TOKEN', 401);
  }

  const matches = await bcrypt.compare(rawToken, user.refreshTokenHash);
  if (!matches) {
    user.refreshTokenHash = null;
    await user.save();
    logger.warn(`Refresh token reuse detected for user: ${user._id}`);
    throw makeError('Token reuse detected', 'INVALID_REFRESH_TOKEN', 401);
  }

  logger.info(`Tokens refreshed for user: ${user._id}`);
  return issueTokenPair(user, res);
};

export const logout = async (userId, res) => {
  await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  logger.info(`User logged out: ${userId}`);
};
```

- [ ] **Step 7.5: Ejecutar tests — verificar que pasan**

```bash
npx vitest run tests/services/auth.service.test.js
```
Resultado esperado: `4 tests passed`

- [ ] **Step 7.6: Commit**

```bash
git add src/services/notification.service.js src/services/auth.service.js tests/services/auth.service.test.js
git commit -m "feat(backend): add auth.service with JWT refresh token rotation"
```

---

## Task 8: services/professional.service.js + services/search.service.js

**Files:**
- Create: `fitness-backend/src/services/professional.service.js`
- Create: `fitness-backend/src/services/search.service.js`

- [ ] **Step 8.1: Implementar src/services/professional.service.js**

```js
import Professional from '../models/Professional.model.js';
import logger from '../utils/logger.util.js';

const makeError = (message, code, statusCode) =>
  Object.assign(new Error(message), { code, statusCode });

export const createOrUpdateProfile = async (userId, data) => {
  const profile = await Professional.findOneAndUpdate(
    { userId },
    { $set: data },
    { new: true, upsert: true, runValidators: true }
  );
  logger.info(`Professional profile updated: ${userId}`);
  return profile;
};

export const getPublicProfile = async (professionalId) => {
  const profile = await Professional.findOne({ _id: professionalId, isApproved: true })
    .populate('userId', 'firstName lastName avatar');
  if (!profile) throw makeError('Professional not found', 'PROFESSIONAL_NOT_FOUND', 404);
  return profile;
};

export const getProfileByUserId = async (userId) => {
  const profile = await Professional.findOne({ userId })
    .populate('userId', 'firstName lastName email avatar');
  if (!profile) throw makeError('Profile not found', 'PROFESSIONAL_NOT_FOUND', 404);
  return profile;
};

export const approveProfile = async (professionalId) => {
  const profile = await Professional.findByIdAndUpdate(
    professionalId,
    { isApproved: true },
    { new: true }
  );
  if (!profile) throw makeError('Professional not found', 'PROFESSIONAL_NOT_FOUND', 404);
  logger.info(`Professional approved: ${professionalId}`);
  return profile;
};
```

- [ ] **Step 8.2: Implementar src/services/search.service.js**

```js
import Professional from '../models/Professional.model.js';

export const searchProfessionals = async ({
  type,
  specialty,
  city,
  minPrice,
  maxPrice,
  minRating,
  page = 1,
  limit = 12,
} = {}) => {
  const filter = { isApproved: true };

  if (type) filter.professionalType = type;
  if (specialty) filter.specialties = specialty;
  if (city) filter['location.city'] = new RegExp(city, 'i');
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.sessionPrice = {};
    if (minPrice !== undefined) filter.sessionPrice.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.sessionPrice.$lte = Number(maxPrice);
  }
  if (minRating !== undefined) filter.rating = { $gte: Number(minRating) };

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const [professionals, total] = await Promise.all([
    Professional.find(filter)
      .populate('userId', 'firstName lastName avatar')
      .skip(skip)
      .limit(limitNum)
      .sort({ rating: -1, reviewCount: -1 }),
    Professional.countDocuments(filter),
  ]);

  return { professionals, total, page: pageNum, totalPages: Math.ceil(total / limitNum) };
};
```

- [ ] **Step 8.3: Commit**

```bash
git add src/services/professional.service.js src/services/search.service.js
git commit -m "feat(backend): add professional.service and search.service"
```

---

## Task 9: services/payment.service.js + services/payout.service.js

**Files:**
- Create: `fitness-backend/src/services/payment.service.js`
- Create: `fitness-backend/src/services/payout.service.js`
- Create: `fitness-backend/tests/services/payment.service.test.js`

- [ ] **Step 9.1: Escribir tests fallidos para payment.service**

```js
// tests/services/payment.service.test.js
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/config/stripe.js', () => ({
  default: {
    paymentIntents: {
      create: vi.fn().mockResolvedValue({
        client_secret: 'pi_test_secret_abc',
        id: 'pi_test_123',
      }),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

vi.mock('../../src/utils/logger.util.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { calculateFees, createPaymentIntent } from '../../src/services/payment.service.js';

describe('payment.service', () => {
  describe('calculateFees', () => {
    it('calcula 50% para plataforma y 50% para profesional', () => {
      const fees = calculateFees(100);
      expect(fees.platformFee).toBe(50);
      expect(fees.professionalPayout).toBe(50);
    });

    it('maneja precios con decimales correctamente', () => {
      const fees = calculateFees(30.5);
      expect(fees.platformFee + fees.professionalPayout).toBeCloseTo(30.5, 2);
    });

    it('el payout + fee siempre suma el precio original', () => {
      const prices = [10, 25, 49.99, 150, 200.5];
      prices.forEach((price) => {
        const { platformFee, professionalPayout } = calculateFees(price);
        expect(platformFee + professionalPayout).toBeCloseTo(price, 2);
      });
    });
  });

  describe('createPaymentIntent', () => {
    it('retorna clientSecret y paymentIntentId', async () => {
      const result = await createPaymentIntent('session123', 50, 'acct_stripe123');
      expect(result.clientSecret).toBe('pi_test_secret_abc');
      expect(result.paymentIntentId).toBe('pi_test_123');
    });
  });
});
```

- [ ] **Step 9.2: Ejecutar test — verificar que falla**

```bash
npx vitest run tests/services/payment.service.test.js
```
Resultado esperado: FAIL con `Cannot find module`

- [ ] **Step 9.3: Implementar src/services/payment.service.js**

```js
import stripe from '../config/stripe.js';
import { eurToCents } from '../utils/priceFormatter.util.js';
import logger from '../utils/logger.util.js';

const COMMISSION_RATE = 0.5;

export const calculateFees = (sessionPrice) => {
  const platformFee = +(sessionPrice * COMMISSION_RATE).toFixed(2);
  const professionalPayout = +(sessionPrice - platformFee).toFixed(2);
  return { platformFee, professionalPayout };
};

export const createPaymentIntent = async (sessionId, sessionPrice, stripeAccountId) => {
  const amountCents = eurToCents(sessionPrice);
  const applicationFeeCents = eurToCents(sessionPrice * COMMISSION_RATE);

  const intent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'eur',
    application_fee_amount: applicationFeeCents,
    transfer_data: { destination: stripeAccountId },
    metadata: { sessionId: String(sessionId) },
    automatic_payment_methods: { enabled: true },
  });

  logger.info(`PaymentIntent created: ${intent.id} for session: ${sessionId}`);
  return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
};

export const constructWebhookEvent = (payload, signature, secret) =>
  stripe.webhooks.constructEvent(payload, signature, secret);
```

- [ ] **Step 9.4: Implementar src/services/payout.service.js**

```js
import stripe from '../config/stripe.js';
import { eurToCents } from '../utils/priceFormatter.util.js';
import logger from '../utils/logger.util.js';

export const createTransfer = async (stripeAccountId, amountEur, sessionId) => {
  const transfer = await stripe.transfers.create({
    amount: eurToCents(amountEur),
    currency: 'eur',
    destination: stripeAccountId,
    metadata: { sessionId: String(sessionId) },
  });
  logger.info(`Transfer created: ${transfer.id} to: ${stripeAccountId}`);
  return transfer;
};
```

- [ ] **Step 9.5: Ejecutar tests — verificar que pasan**

```bash
npx vitest run tests/services/payment.service.test.js
```
Resultado esperado: `4 tests passed`

- [ ] **Step 9.6: Commit**

```bash
git add src/services/payment.service.js src/services/payout.service.js tests/services/payment.service.test.js
git commit -m "feat(backend): add payment.service (50/50 split) and payout.service"
```

---

## Task 10: controllers/auth.controller.js + routes/auth.routes.js

**Files:**
- Create: `fitness-backend/src/controllers/auth.controller.js`
- Create: `fitness-backend/src/routes/auth.routes.js`

- [ ] **Step 10.1: Implementar src/controllers/auth.controller.js**

```js
import * as authService from '../services/auth.service.js';
import { success } from '../utils/apiResponse.util.js';

export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body, res);
    success(res, result, 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body, res);
    success(res, result);
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const result = await authService.refreshTokens(req.cookies?.refreshToken, res);
    success(res, result);
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id, res);
    success(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};
```

- [ ] **Step 10.2: Implementar src/routes/auth.routes.js**

```js
import { Router } from 'express';
import { z } from 'zod';
import { register, login, refresh, logout } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

const registerSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['user', 'professional']).default('user'),
  professionalType: z.enum(['trainer', 'nutritionist', 'physiotherapist']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', requireAuth, logout);

export default router;
```

- [ ] **Step 10.3: Commit**

```bash
git add src/controllers/auth.controller.js src/routes/auth.routes.js
git commit -m "feat(backend): add auth controller and routes"
```

---

## Task 11: controllers/professional.controller.js + routes/professional.routes.js

**Files:**
- Create: `fitness-backend/src/controllers/professional.controller.js`
- Create: `fitness-backend/src/routes/professional.routes.js`

- [ ] **Step 11.1: Implementar src/controllers/professional.controller.js**

```js
import * as professionalService from '../services/professional.service.js';
import * as searchService from '../services/search.service.js';
import { success } from '../utils/apiResponse.util.js';

export const search = async (req, res, next) => {
  try {
    const result = await searchService.searchProfessionals(req.query);
    success(res, result);
  } catch (err) {
    next(err);
  }
};

export const getById = async (req, res, next) => {
  try {
    const professional = await professionalService.getPublicProfile(req.params.id);
    success(res, { professional });
  } catch (err) {
    next(err);
  }
};

export const getMyProfile = async (req, res, next) => {
  try {
    const professional = await professionalService.getProfileByUserId(req.user.id);
    success(res, { professional });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const professional = await professionalService.createOrUpdateProfile(req.user.id, req.body);
    success(res, { professional });
  } catch (err) {
    next(err);
  }
};

export const approveProfile = async (req, res, next) => {
  try {
    const professional = await professionalService.approveProfile(req.params.id);
    success(res, { professional });
  } catch (err) {
    next(err);
  }
};
```

- [ ] **Step 11.2: Implementar src/routes/professional.routes.js**

```js
import { Router } from 'express';
import { z } from 'zod';
import { search, getById, getMyProfile, updateProfile, approveProfile } from '../controllers/professional.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import { publicLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

const updateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  specialties: z.array(z.string()).optional(),
  location: z.object({
    city: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  sessionPrice: z.number().min(0).optional(),
  professionalType: z.enum(['trainer', 'nutritionist', 'physiotherapist']).optional(),
});

router.get('/', publicLimiter, search);
router.get('/me', requireAuth, requireRole('professional'), getMyProfile);
router.get('/:id', publicLimiter, getById);
router.patch('/me', requireAuth, requireRole('professional'), validate(updateProfileSchema), updateProfile);
router.post('/:id/approve', requireAuth, requireRole('admin', 'super_admin'), approveProfile);

export default router;
```

- [ ] **Step 11.3: Commit**

```bash
git add src/controllers/professional.controller.js src/routes/professional.routes.js
git commit -m "feat(backend): add professional controller and routes"
```

---

## Task 12: controllers/session.controller.js + routes/session.routes.js

**Files:**
- Create: `fitness-backend/src/controllers/session.controller.js`
- Create: `fitness-backend/src/routes/session.routes.js`

- [ ] **Step 12.1: Implementar src/controllers/session.controller.js**

```js
import Session from '../models/Session.model.js';
import Professional from '../models/Professional.model.js';
import { calculateFees, createPaymentIntent, constructWebhookEvent } from '../services/payment.service.js';
import { success } from '../utils/apiResponse.util.js';
import { env } from '../config/env.js';
import logger from '../utils/logger.util.js';

const makeError = (msg, code, statusCode) =>
  Object.assign(new Error(msg), { code, statusCode });

export const createSession = async (req, res, next) => {
  try {
    const { professionalId, scheduledAt } = req.body;

    const professional = await Professional.findOne({ _id: professionalId, isApproved: true });
    if (!professional) return next(makeError('Professional not found', 'PROFESSIONAL_NOT_FOUND', 404));

    const { platformFee, professionalPayout } = calculateFees(professional.sessionPrice);

    const session = await Session.create({
      userId: req.user.id,
      professionalId,
      sessionPrice: professional.sessionPrice,
      platformFee,
      professionalPayout,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    });

    success(res, { session }, 201);
  } catch (err) {
    next(err);
  }
};

export const checkout = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id).populate('professionalId');
    if (!session) return next(makeError('Session not found', 'SESSION_NOT_FOUND', 404));
    if (String(session.userId) !== req.user.id) return next(makeError('Forbidden', 'FORBIDDEN', 403));
    if (session.status !== 'pending') return next(makeError('Session already processed', 'SESSION_ALREADY_PROCESSED', 409));

    const { clientSecret, paymentIntentId } = await createPaymentIntent(
      session._id,
      session.sessionPrice,
      session.professionalId.stripeAccountId
    );

    session.stripePaymentIntentId = paymentIntentId;
    await session.save();

    success(res, { clientSecret });
  } catch (err) {
    next(err);
  }
};

export const getMySessions = async (req, res, next) => {
  try {
    let sessions;
    if (req.user.role === 'professional') {
      const prof = await Professional.findOne({ userId: req.user.id });
      sessions = await Session.find({ professionalId: prof?._id })
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 });
    } else {
      sessions = await Session.find({ userId: req.user.id })
        .populate('professionalId')
        .sort({ createdAt: -1 });
    }
    success(res, { sessions });
  } catch (err) {
    next(err);
  }
};

export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = constructWebhookEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.warn(`Webhook signature failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const session = await Session.findOneAndUpdate(
      { stripePaymentIntentId: intent.id },
      { status: 'paid' },
      { new: true }
    );
    if (session) logger.info(`Payment confirmed for session: ${session._id}`);
  }

  res.json({ received: true });
};
```

- [ ] **Step 12.2: Implementar src/routes/session.routes.js**

```js
import { Router } from 'express';
import { z } from 'zod';
import { createSession, checkout, getMySessions } from '../controllers/session.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

const createSessionSchema = z.object({
  professionalId: z.string().min(1),
  scheduledAt: z.string().datetime().optional(),
});

router.post('/', requireAuth, validate(createSessionSchema), createSession);
router.post('/:id/checkout', requireAuth, checkout);
router.get('/', requireAuth, getMySessions);

export default router;
```

- [ ] **Step 12.3: Commit**

```bash
git add src/controllers/session.controller.js src/routes/session.routes.js
git commit -m "feat(backend): add session controller and routes with Stripe checkout"
```

---

## Task 13: controllers/review.controller.js + routes/review.routes.js

**Files:**
- Create: `fitness-backend/src/controllers/review.controller.js`
- Create: `fitness-backend/src/routes/review.routes.js`

- [ ] **Step 13.1: Implementar src/controllers/review.controller.js**

```js
import Review from '../models/Review.model.js';
import Session from '../models/Session.model.js';
import Professional from '../models/Professional.model.js';
import { success } from '../utils/apiResponse.util.js';

const makeError = (msg, code, statusCode) =>
  Object.assign(new Error(msg), { code, statusCode });

export const createReview = async (req, res, next) => {
  try {
    const { sessionId, rating, comment } = req.body;

    const session = await Session.findById(sessionId);
    if (!session || String(session.userId) !== req.user.id) {
      return next(makeError('Session not found', 'SESSION_NOT_FOUND', 404));
    }
    if (session.status !== 'completed') {
      return next(makeError('Session not completed yet', 'SESSION_NOT_COMPLETED', 409));
    }

    const review = await Review.create({
      userId: req.user.id,
      professionalId: session.professionalId,
      sessionId,
      rating,
      comment,
    });

    const allReviews = await Review.find({ professionalId: session.professionalId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Professional.findByIdAndUpdate(session.professionalId, {
      rating: +avgRating.toFixed(2),
      reviewCount: allReviews.length,
    });

    success(res, { review }, 201);
  } catch (err) {
    next(err);
  }
};

export const getProfessionalReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ professionalId: req.params.professionalId })
      .populate('userId', 'firstName lastName avatar')
      .sort({ createdAt: -1 });
    success(res, { reviews });
  } catch (err) {
    next(err);
  }
};
```

- [ ] **Step 13.2: Implementar src/routes/review.routes.js**

```js
import { Router } from 'express';
import { z } from 'zod';
import { createReview, getProfessionalReviews } from '../controllers/review.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { publicLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

const createReviewSchema = z.object({
  sessionId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

router.post('/', requireAuth, validate(createReviewSchema), createReview);
router.get('/professional/:professionalId', publicLimiter, getProfessionalReviews);

export default router;
```

- [ ] **Step 13.3: Commit**

```bash
git add src/controllers/review.controller.js src/routes/review.routes.js
git commit -m "feat(backend): add review controller and routes"
```

---

## Task 14: src/app.js + server.js

**Files:**
- Create: `fitness-backend/src/app.js`
- Create: `fitness-backend/server.js`

- [ ] **Step 14.1: Implementar src/app.js**

```js
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
```

- [ ] **Step 14.2: Implementar server.js en la raíz del backend**

```js
import { connectDB } from './src/config/db.js';
import app from './src/app.js';
import { env } from './src/config/env.js';
import logger from './src/utils/logger.util.js';

connectDB()
  .then(() => {
    app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    });
  })
  .catch((err) => {
    logger.error('Failed to connect to MongoDB', { error: err.message });
    process.exit(1);
  });
```

- [ ] **Step 14.3: Commit**

```bash
git add src/app.js server.js
git commit -m "feat(backend): add app.js and server.js — wire all routes"
```

---

## Task 15: .env + .env.example + smoke test

**Files:**
- Modify: `fitness-backend/.env`
- Create: `fitness-backend/.env.example`

- [ ] **Step 15.1: Actualizar .env con las nuevas variables**

Añadir las variables que faltan en `fitness-backend/.env`. Renombrar las existentes si es necesario (los nombres han cambiado: `MONGO_URI` → `MONGODB_URI`, `JWT_SECRET` → `JWT_ACCESS_SECRET`).

Verificar que `.env` contenga TODAS estas variables:

```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

MONGODB_URI=mongodb+srv://...

JWT_ACCESS_SECRET=<mínimo 32 caracteres>
JWT_REFRESH_SECRET=<mínimo 32 caracteres, diferente al access>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

CLOUDINARY_URL=
RESEND_API_KEY=
SENTRY_DSN=
```

- [ ] **Step 15.2: Crear .env.example**

```env
# App
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/trainmehard

# JWT
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Storage
CLOUDINARY_URL=

# Email
RESEND_API_KEY=

# Monitoring
SENTRY_DSN=
```

- [ ] **Step 15.3: Ejecutar todos los tests**

```bash
npx vitest run
```
Resultado esperado: `13 tests passed, 0 failed`

- [ ] **Step 15.4: Arrancar el servidor en modo dev y verificar health endpoint**

En una terminal:
```bash
npm run dev
```
En otra terminal:
```bash
curl http://localhost:3001/api/health
```
Resultado esperado:
```json
{"status":"ok","env":"development"}
```

- [ ] **Step 15.5: Commit final**

```bash
git add .env.example
git commit -m "feat(backend): complete backend foundation rewrite — Phase 1 done"
```

---

## Checklist de cobertura del spec

| Req del spec | Tarea |
|---|---|
| config/ (env.js, db.js, stripe.js) | Task 2, 4 |
| server.js + app.js split | Task 14 |
| Modelos exactos del spec §6 | Task 5 |
| JWT access + refresh con rotación | Task 3, 7 |
| Refresh token httpOnly cookie | Task 7 |
| winston logging | Task 3 |
| apiResponse.util helper | Task 3 |
| errorHandler formato estandarizado | Task 6 |
| validate middleware (Zod) | Task 6 |
| requireAuth middleware | Task 6 |
| requireRole RBAC | Task 6 |
| rateLimiter 100/15min | Task 6 |
| mongo-sanitize | Task 14 |
| auth.service (register/login/refresh/logout) | Task 7 |
| professional.service CRUD | Task 8 |
| search.service con filtros | Task 8 |
| payment.service (50% split) | Task 9 |
| payout.service | Task 9 |
| notification.service (stub) | Task 7 |
| Todos los controllers y routes | Task 10-13 |
| Webhook Stripe (raw body) | Task 14 |
| .env.example completo | Task 15 |
