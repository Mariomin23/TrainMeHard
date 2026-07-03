# 🏋️ TrainMeHard — Personal Trainer Marketplace

> Find, compare and book certified personal trainers in minutes. Full-stack TypeScript monorepo with user accounts and **Stripe payments**.

**🌐 Live demo: [trainmehard.vercel.app](https://trainmehard.vercel.app)**

<p align="center">
  <img src="docs/screenshot.png" width="720" alt="TrainMeHard — landing page">
</p>

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js 16](https://img.shields.io/badge/Next.js_16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express_5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Stripe](https://img.shields.io/badge/Stripe-635BFF?logo=stripe&logoColor=white)](https://stripe.com/)
[![Zod](https://img.shields.io/badge/Zod-3E67B1?logo=zod&logoColor=white)](https://zod.dev/)

## Features

- 🔍 **Trainer marketplace** — search, compare and book certified personal trainers
- 🔐 **User authentication** — JWT + httpOnly cookies, bcrypt hashing
- 💳 **Payments** — subscription and checkout via **Stripe**
- 🛡️ **Hardened API** — Helmet, rate limiting, Mongo sanitization, Zod validation
- 📋 **Structured logging** — Winston + Morgan
- ✅ **Frontend tests** — Vitest

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | Next.js 16 · React 19 · TypeScript · Tailwind CSS · shadcn/ui · Zustand · Axios |
| Backend | Node.js · Express 5 · MongoDB (Mongoose) · JWT · Stripe · Zod · Helmet · Winston |
| Deploy | Vercel (frontend) · Render (API) |

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

Structuring a full-stack monorepo, integrating Stripe payments, securing an Express API end-to-end, and building a modern Next.js + Tailwind UI with state management and tests.

## License

[MIT](LICENSE)
