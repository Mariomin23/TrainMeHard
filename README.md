# 🏋️ TrainMeHard

Fullstack fitness web app to plan and track workouts, with user accounts and **Stripe payments**. Built as a monorepo with a Next.js frontend and an Express/MongoDB backend.

🔗 **Live demo:** https://train-me-hard.vercel.app

<!-- TODO: add a screenshot or GIF -->
<!-- ![TrainMeHard screenshot](./docs/screenshot.png) -->

## Features
- User authentication (JWT + httpOnly cookies, bcrypt hashing)
- Workout planning & tracking
- Subscription / payments via **Stripe**
- Hardened API: Helmet, rate limiting, Mongo sanitization, Zod validation
- Structured logging (Winston + Morgan)
- Frontend tests with Vitest

## Tech stack
**Frontend:** Next.js 16 · React 19 · TypeScript · Tailwind CSS · shadcn/ui · Zustand · Axios
**Backend:** Node.js · Express 5 · MongoDB (Mongoose) · JWT · Stripe · Zod · Helmet · Winston

## Project structure
```
TrainMeHard/
├── fitness-frontend/   # Next.js app (UI)
└── fitness-backend/    # Express REST API
```

## Run locally
**Backend**
```bash
cd fitness-backend
npm install
cp .env.example .env    # set MONGO_URI, JWT_SECRET, STRIPE_SECRET_KEY...
npm run dev
```

**Frontend**
```bash
cd fitness-frontend
npm install
npm run dev             # http://localhost:3000
```

## What I learned
Structuring a fullstack monorepo, integrating Stripe payments, securing an Express API end-to-end, and building a modern Next.js + Tailwind UI with state management and tests.
