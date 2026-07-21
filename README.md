# TrainMeHard

> **Full-stack wellness professional marketplace.** Users browse and book certified trainers, nutritionists, and physiotherapists. Payments split automatically 50/50 between platform and professional via **Stripe Connect**.

**Live demo → [trainmehard.vercel.app](https://trainmehard.vercel.app)**

<p align="center">
  <img src="docs/screenshot.png" width="800" alt="TrainMeHard — homepage">
</p>

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js_15-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express_5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Stripe](https://img.shields.io/badge/Stripe_Connect-635BFF?logo=stripe&logoColor=white)](https://stripe.com/connect)
[![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Zod](https://img.shields.io/badge/Zod-3E67B1?logo=zod&logoColor=white)](https://zod.dev/)

---

## What it does

TrainMeHard is a **"one-shot" marketplace** — users can browse profiles for free and unlock access to a professional by paying a single Initial Session fee. The platform takes 50% as commission; the professional receives the other 50% instantly via Stripe Connect's automatic transfer.

Three professional verticals share the same infrastructure, differentiated by `professionalType`:

| Vertical | Description |
|---|---|
| Fitness trainers | In-person or online sessions |
| Nutritionists | Meal planning and dietary consultations |
| Physiotherapists | Physical assessment and rehabilitation |

---

## Architecture

```
TrainMeHard/
├── fitness-frontend/   # Next.js 15 — App Router, TypeScript
└── fitness-backend/    # Node.js + Express 5 — REST API, TypeScript
```

The backend follows a **strict layered pattern** — nothing bleeds between layers:

```
Request → Route (validation) → Controller (orchestration) → Service (business logic) → Model (data)
```

The Stripe integration lives exclusively in `payment.service` and `payout.service`. Controllers never touch the Stripe SDK directly.

---

## Tech stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 15 · React 19 · TypeScript · Tailwind CSS · shadcn/ui · Zustand · React Hook Form · Axios |
| **Backend** | Node.js 20 · Express 5 · TypeScript · MongoDB (Mongoose) · Zod · Stripe Connect SDK |
| **Auth** | JWT (access + refresh) · httpOnly cookies · refresh token rotation |
| **Security** | Helmet · express-rate-limit · mongo-sanitize · CORS whitelist · Zod (backend re-validation) |
| **Logging** | Winston (structured) · Morgan (HTTP) |
| **Testing** | Vitest · Supertest |
| **Deploy** | Vercel (frontend) · Render (API) · MongoDB Atlas |

---

## Key features

### Payments — Stripe Connect
The most complex piece. When a user pays for a session:

```
User triggers checkout
        │
        ▼
PaymentIntent created in backend (amount determined server-side only)
        │
        ▼
Stripe processes charge
        │
        ├──► 50% transferred to professional's Connect account (automatic)
        └──► 50% retained as application_fee_amount (platform)
        │
        ▼
Stripe webhook confirms payment (idempotent)
        │
        ▼
Session marked as `paid` in MongoDB — stripePaymentIntentId stored for audit
```

The webhook is the source of truth — the browser redirect is never trusted.

### Authentication
- Short-lived **access tokens** (15 min) in `Authorization` header
- Long-lived **refresh tokens** (7 days) in `httpOnly; Secure; SameSite=Strict` cookie
- **Refresh token rotation** on every renewal — previous token invalidated immediately (stolen token detection)

### RBAC — 4 roles

| Role | Capabilities |
|---|---|
| `super_admin` | Full access, admin management |
| `admin` | Moderation panel, dispute resolution, metrics |
| `professional` | Profile CRUD, availability, payout tracking |
| `user` | Search, book, pay, review |

Role is embedded in the JWT payload. A `requireRole(...roles)` middleware composes on routes:

```js
router.delete('/users/:id', requireAuth, requireRole('admin', 'super_admin'), deleteUser);
```

### Professionals require admin approval
After onboarding, a professional's profile is `isApproved: false`. An admin reviews and approves before the profile is publicly discoverable. Prevents fraudulent listings.

### Dashboards
Three separate dashboard experiences:
- **User** — session history, booking status, reviews left
- **Professional** — profile management, availability calendar, payout history, onboarding wizard
- **Admin** — professional approval queue, dispute resolution, platform metrics

---

## Security hardening

| Measure | Tool | Detail |
|---|---|---|
| HTTP headers | `helmet` | XSS, clickjacking, MIME sniffing protection |
| Rate limiting | `express-rate-limit` | 100 req / 15 min per IP on public routes |
| NoSQL injection | `mongo-sanitize` + `zod` | Input sanitization before any DB write |
| CORS | `cors` | Explicit origin whitelist only |
| Data validation | `zod` | Backend always re-validates — never trusts client |
| Prices | Backend only | `amount` is calculated server-side; front end never sends a price |
| Error exposure | `errorHandler` middleware | Stack traces never reach the client in production |

---

## Design decisions

| Decision | Why |
|---|---|
| **Stateless JWT** over server sessions | Future mobile app compatibility |
| **Stripe Connect** over manual transfers | Automatic split, regulatory compliance, no payout logic to maintain |
| **MongoDB** over PostgreSQL | Flexible schema across 3 professional verticals with different field sets |
| **Zustand** over Redux | 80% less boilerplate for this project scope |
| **Shared Zod schemas** (front + back) | Single source of truth — if the schema changes, both sides break at compile time |
| **Express 5** over Fastify | Better ecosystem fit; native async/await error propagation in v5 |

---

## Standardized API responses

Every endpoint returns the same envelope — no guessing the shape:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "PROFESSIONAL_NOT_FOUND", "message": "...", "statusCode": 404 } }
```

Error codes in `SCREAMING_SNAKE_CASE` for machine-readable handling.

---

## Run locally

**Backend**
```bash
cd fitness-backend
npm install
cp .env.example .env   # fill in MONGODB_URI, JWT secrets, STRIPE keys
npm run dev            # http://localhost:3001
```

**Frontend**
```bash
cd fitness-frontend
npm install
npm run dev            # http://localhost:3000
```

**Run tests**
```bash
cd fitness-backend && npm test
cd fitness-frontend && npm test
```

---

## Environment variables

```env
# App
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb+srv://...

# JWT
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=

# Optional
CLOUDINARY_URL=
RESEND_API_KEY=
SENTRY_DSN=
```

---

## License

[MIT](LICENSE)
