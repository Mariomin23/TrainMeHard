# Phase 4: Stripe Connect Payment Flow — Design

**Date:** 2026-06-04  
**Status:** Approved

---

## Context

TrainMeHard allows users to book sessions with professionals (trainers, nutritionists, physiotherapists). The platform takes a 50% commission on each session. Stripe Connect Express is used so professionals receive their 50% automatically at payment time — no manual payouts needed.

Most of the plumbing already exists:
- `payment.service.js` — `createPaymentIntent` with `transfer_data.destination` + `application_fee_amount`
- `session.controller.js` — `checkout` handler (POST `/sessions/:id/checkout`)
- `Session.model.js` — `stripePaymentIntentId`, status enum
- `Professional.model.js` — `stripeAccountId`
- `CheckoutModal.tsx` + `PaymentForm.tsx` — fully functional Stripe Elements components
- Webhook at `POST /api/webhook` handles `payment_intent.succeeded` → marks session `paid`

**Two gaps remain:**
1. Professionals have no way to connect their Stripe account (no onboarding endpoints)
2. `CheckoutModal.tsx` calls `/pay` but backend route is `/checkout` — bug

---

## Architecture

### Payment Flow (user pays)

```
User clicks "Reservar" 
  → POST /sessions         (creates Session{status:pending})
  → CheckoutModal opens
  → POST /sessions/:id/checkout  (creates PaymentIntent, saves intent ID)
  → PaymentForm: stripe.confirmPayment()
  → Stripe calls POST /api/webhook (payment_intent.succeeded)
  → Session{status:paid}
  → Professional receives 50% via transfer_data.destination (automatic)
```

### Stripe Connect Onboarding (professional)

```
Professional dashboard → "Pagos" tab
  → POST /professionals/me/stripe/connect
  → Backend: stripe.accounts.create({type:'express'}) → saves stripeAccountId
  → Backend: stripe.accountLinks.create(...) → returns onboardingUrl
  → Frontend: window.location.href = onboardingUrl
  → Professional completes Stripe KYC
  → Stripe redirects to /dashboard/professional/stripe/return?success=true
  → Return page shows success + back to dashboard link
  → GET /professionals/me/stripe/status → {connected, detailsSubmitted, chargesEnabled}
```

---

## Backend Changes

### `professional.service.js` — 2 new functions

**`createStripeConnectAccount(userId)`**
- Checks if professional already has `stripeAccountId` — if so, generates new onboarding link (resume flow)
- Otherwise: `stripe.accounts.create({ type: 'express', country: 'ES', email })` → saves `stripeAccountId`
- `stripe.accountLinks.create({ account, refresh_url, return_url, type: 'account_onboarding' })`
- Returns `{ onboardingUrl }`

**`getStripeConnectStatus(userId)`**
- If no `stripeAccountId` → `{ connected: false }`
- `stripe.accounts.retrieve(stripeAccountId)` → `{ connected: true, detailsSubmitted, chargesEnabled }`

### `professional.controller.js` — 2 new handlers

`connectStripe` / `getStripeStatus` — thin wrappers calling service, `success(res, data)`

### `professional.routes.js` — 2 new routes

```
POST /professionals/me/stripe/connect   requireAuth + requireRole('professional')
GET  /professionals/me/stripe/status    requireAuth + requireRole('professional')
```

---

## Frontend Changes

### Bug fix: `CheckoutModal.tsx`
`/sessions/${sessionId}/pay` → `/sessions/${sessionId}/checkout`

### `professional.service.ts` — 2 new functions
`connectStripe()` → `POST /professionals/me/stripe/connect` → `{ onboardingUrl }`  
`getStripeStatus()` → `GET /professionals/me/stripe/status` → `{ connected, detailsSubmitted, chargesEnabled }`

### `professional.ts` types
Add `stripeAccountId?: string` to `Professional` interface.  
Add `StripeStatus` interface.

### Professional dashboard — "Pagos" tab
New 4th tab. Shows:
- If not connected: yellow banner + "Conectar cuenta Stripe" button → calls `connectStripe()` → redirect to onboarding URL
- If connected but pending: "Cuenta en revisión" status
- If connected + charges enabled: green "Cuenta activa ✓" banner

### `/dashboard/professional/stripe/return/page.tsx`
Simple page. URL params: `?success=true` or redirect from Stripe after error.  
Shows success state + button back to dashboard.  
On mount: calls `getStripeStatus()` to confirm account state.

---

## Error Handling

- `STRIPE_ACCOUNT_NOT_CONNECTED` (409): shown in CheckoutModal as "El profesional aún no ha configurado su cuenta de pago"
- Stripe API errors: logged server-side, generic message to client
- Onboarding link expired: `POST /stripe/connect` again generates fresh link

---

## Not in Scope (Phase 5)

- Admin dashboard for transaction monitoring
- Refunds
- Disputes resolution UI
- Email notifications on payment
