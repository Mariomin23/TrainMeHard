# Backend Foundation — Design Spec

**Fase 1 de 5 | TrainMeHard Marketplace**
Fecha: 2026-06-03
Estado: Aprobado

---

## Contexto

El `fitness-backend` actual tiene un skeleton funcional básico (auth single-token, modelos incompletos, sin config/, todo en `src/index.js`) que no coincide con la arquitectura definida en `context.md`. Esta fase hace una reescritura limpia de `fitness-backend/src/` para llevar el backend al 100% del spec.

---

## Arquitectura

### Estructura de directorios

```
fitness-backend/
├── server.js                         # Solo: importa app + app.listen()
├── src/
│   ├── app.js                        # Express config: middlewares globales + mount rutas
│   ├── config/
│   │   ├── env.js                    # Zod parse de process.env — falla al arranque si falta var
│   │   ├── db.js                     # mongoose.connect() usando env.MONGODB_URI
│   │   └── stripe.js                 # new Stripe(env.STRIPE_SECRET_KEY) — singleton
│   ├── models/
│   │   ├── User.model.js
│   │   ├── Professional.model.js
│   │   ├── Session.model.js
│   │   └── Review.model.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── professional.controller.js
│   │   ├── session.controller.js
│   │   └── review.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── professional.service.js
│   │   ├── payment.service.js
│   │   ├── payout.service.js
│   │   ├── search.service.js
│   │   └── notification.service.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── professional.routes.js
│   │   ├── session.routes.js
│   │   └── review.routes.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── rbac.middleware.js
│   │   ├── validate.middleware.js
│   │   ├── rateLimiter.middleware.js
│   │   └── errorHandler.middleware.js
│   └── utils/
│       ├── jwt.util.js
│       ├── apiResponse.util.js
│       ├── logger.util.js
│       └── priceFormatter.util.js
```

**Regla de oro (del context.md):** `routes/` nunca importa `models/`. `controllers/` nunca importan Stripe directamente.

---

## Modelos de datos

### User.model.js

```js
{
  email: String (unique, required),
  passwordHash: String (required),
  role: enum['user', 'professional', 'admin', 'super_admin'] (default: 'user'),
  firstName: String (required),
  lastName: String (required),
  avatar: String (URL, optional),
  isVerified: Boolean (default: false),
  refreshTokenHash: String (optional),   // hash del refresh token actual
  createdAt: Date (default: Date.now)
}
```

### Professional.model.js

```js
{
  userId: ObjectId → User (required, unique),
  professionalType: enum['trainer', 'nutritionist', 'physiotherapist'] (required),
  bio: String (maxlength: 500),
  specialties: [String],
  location: {
    city: String,
    country: String,
    coordinates: { type: { type: String, default: 'Point' }, coordinates: [Number] }
  },
  sessionPrice: Number (required, min: 0),
  stripeAccountId: String,
  isApproved: Boolean (default: false),
  rating: Number (default: 0),
  reviewCount: Number (default: 0)
}
// Índice 2dsphere en location.coordinates para búsquedas geoespaciales futuras
```

### Session.model.js

```js
{
  userId: ObjectId → User (required),
  professionalId: ObjectId → Professional (required),
  status: enum['pending', 'paid', 'completed', 'cancelled', 'disputed'] (default: 'pending'),
  sessionPrice: Number (required),
  platformFee: Number (required),           // sessionPrice * 0.50
  professionalPayout: Number (required),    // sessionPrice * 0.50
  stripePaymentIntentId: String,
  scheduledAt: Date,
  createdAt: Date (default: Date.now)
}
```

### Review.model.js

```js
{
  userId: ObjectId → User (required),
  professionalId: ObjectId → Professional (required),
  sessionId: ObjectId → Session (required, unique),  // 1 review por sesión
  rating: Number (required, min: 1, max: 5),
  comment: String (maxlength: 1000),
  createdAt: Date (default: Date.now)
}
```

---

## Auth — Flujo JWT + Refresh Tokens

### Tokens

| Token | Expiración | Almacenamiento | Payload |
|---|---|---|---|
| Access Token | 15 min | Response body | `{ id, role }` |
| Refresh Token | 7 días | Cookie `httpOnly; Secure; SameSite=Strict; Path=/api/auth/refresh` | opaco (UUID v4) |

El refresh token se guarda como `bcrypt.hash(token, 10)` en `user.refreshTokenHash`. Nunca se almacena en texto plano.

### Endpoints de auth

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Crea User. Si `role=professional`, crea Professional con `isApproved:false` |
| POST | `/api/auth/login` | Devuelve accessToken + Set-Cookie refreshToken |
| POST | `/api/auth/refresh` | Lee cookie, valida hash, rota ambos tokens |
| POST | `/api/auth/logout` | Borra `refreshTokenHash` en DB + limpia cookie |

### Rotación de refresh token

```
POST /api/auth/refresh
  1. Lee cookie refreshToken
  2. Busca user con refreshTokenHash válido (bcrypt.compare)
  3. Si no coincide → 401 INVALID_REFRESH_TOKEN (posible robo)
  4. Genera nuevo accessToken + nuevo refreshToken
  5. Actualiza refreshTokenHash en DB
  6. Set-Cookie nuevo refreshToken (reemplaza el anterior)
  7. Response: { accessToken, user }
```

---

## Services

### auth.service.js
- `register({ firstName, lastName, email, password, role })` → `{ accessToken, user }` + side-effect cookie
- `login({ email, password })` → `{ accessToken, user }` + side-effect cookie
- `refreshTokens(rawToken)` → `{ accessToken, user }` + rota cookie
- `logout(userId)` → borra refreshTokenHash

### professional.service.js
- `createProfile(userId, data)` — crea o actualiza perfil del profesional autenticado
- `getProfile(professionalId)` — perfil público (solo `isApproved:true` para usuarios normales)
- `updateProfile(professionalId, data, requesterId)` — requiere owner o admin
- `approveProfile(professionalId)` — solo admin/super_admin
- `getProfessionalByUserId(userId)` — para dashboard del profesional

### payment.service.js
- `calculateFees(sessionPrice)` → `{ platformFee, professionalPayout }` (50/50)
- `createPaymentIntent(sessionId, amount)` → `{ clientSecret, paymentIntentId }`
- `constructWebhookEvent(payload, signature)` → Stripe event

### payout.service.js
- `createTransfer(stripeAccountId, amount, sessionId)` → Stripe transfer
- Solo llamado desde el webhook handler tras confirmar pago

### search.service.js
- `searchProfessionals({ type, specialty, city, minPrice, maxPrice, minRating, page, limit })` → `{ professionals, total, page }`
- Filtra solo `isApproved:true`
- Paginación por offset simple (cursor-based en fase futura)

### notification.service.js
- Stub vacío: `sendEmail(to, template, data)` — no-op en dev, preparado para Resend

---

## Middlewares

### auth.middleware.js — `requireAuth`
```js
// Extrae "Bearer <token>" del header Authorization
// Verifica con jwt.util.js
// Cuelga req.user = { id, role }
// Lanza 401 UNAUTHORIZED si falla
```

### rbac.middleware.js — `requireRole(...roles)`
```js
// Factory que retorna middleware
// Compara req.user.role con la lista de roles permitidos
// Lanza 403 FORBIDDEN si no coincide
```

### validate.middleware.js — `validate(schema, target?)`
```js
// target: 'body' | 'query' | 'params' (default: 'body')
// Zod schema.parse() sobre req[target]
// Lanza 400 VALIDATION_ERROR con detalles de Zod si falla
```

### rateLimiter.middleware.js
```js
// 100 req / 15 min por IP
// Aplicado a rutas públicas en app.js
// Rutas de auth tienen límite más estricto: 10 req / 15 min
```

### errorHandler.middleware.js
```js
// Único punto de formato de errores al cliente
// Formato: { success: false, error: { code, message, statusCode } }
// Stack trace solo en NODE_ENV=development
// Errores de Zod → 400 VALIDATION_ERROR
// Errores de Mongoose duplicate key → 409 DUPLICATE_ENTRY
// Errores no controlados → 500 INTERNAL_ERROR
```

---

## Config

### config/env.js

Valida todas las variables de entorno con Zod al iniciar. Si falta cualquier variable requerida, el proceso falla con mensaje descriptivo antes de conectar a la DB.

Variables requeridas: `PORT`, `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.

### config/db.js

`connectDB()` — conecta mongoose, loguea con winston. Llamado desde `server.js`.

### config/stripe.js

Exporta singleton de Stripe inicializado con `env.STRIPE_SECRET_KEY`.

---

## Utils

### logger.util.js (Winston)
- `info`: acciones de negocio (login, nueva sesión, pago exitoso)
- `warn`: auth fallida, rate limit alcanzado, token inválido
- `error`: excepciones no manejadas, fallos de Stripe, errores de DB

### apiResponse.util.js
```js
success(res, data, statusCode = 200)
// → { success: true, data }

error(res, code, message, statusCode = 500)
// → { success: false, error: { code, message, statusCode } }
```

### jwt.util.js
```js
signAccessToken(payload)   // 15m
signRefreshToken()         // UUID v4, 7d expiry tracked en DB
verifyAccessToken(token)   // lanza si expirado o inválido
```

### priceFormatter.util.js
```js
formatPrice(cents, currency = 'EUR')  // → "€10.00"
centsToEur(cents)                     // → 10.00
eurToCents(eur)                       // → 1000
```

---

## Rutas y permisos

| Método | Ruta | Auth | Roles |
|---|---|---|---|
| POST | `/api/auth/register` | No | — |
| POST | `/api/auth/login` | No | — |
| POST | `/api/auth/refresh` | Cookie | — |
| POST | `/api/auth/logout` | Bearer | any |
| GET | `/api/professionals` | No | — |
| GET | `/api/professionals/:id` | No | — |
| POST | `/api/professionals` | Bearer | professional |
| PATCH | `/api/professionals/:id` | Bearer | professional (owner), admin |
| POST | `/api/professionals/:id/approve` | Bearer | admin, super_admin |
| POST | `/api/sessions` | Bearer | user |
| GET | `/api/sessions` | Bearer | user (propio), professional (propio) |
| GET | `/api/sessions/:id` | Bearer | owner |
| POST | `/api/sessions/:id/checkout` | Bearer | user |
| POST | `/api/webhook` | Stripe-Signature | — | raw body, montado antes de express.json() |
| POST | `/api/reviews` | Bearer | user |
| GET | `/api/professionals/:id/reviews` | No | — |

---

## Dependencias a añadir

```bash
npm install winston cookie-parser express-mongo-sanitize uuid
```

(`express-mongo-sanitize` es el paquete actualizado de `mongo-sanitize` para Express 5)

---

## Lo que NO incluye esta fase

- Subida de imágenes (Cloudinary) — Fase 3
- Emails reales (Resend) — Fase 3
- Dashboard admin — Fase 5
- Tests (Vitest + Supertest) — Fase posterior
- Frontend — Fase 2

---

## Decisiones de diseño

| Decisión | Razón |
|---|---|
| `refreshTokenHash` en User (no tabla separada) | Simplicidad; 1 sesión activa por usuario es suficiente para MVP |
| Paginación offset (no cursor) | Simpler para MVP; search.service.js puede migrar a cursor sin cambiar la API |
| `notification.service.js` stub | YAGNI; la interfaz existe para no cambiar callers cuando se conecte Resend |
| GeoJSON en Professional.location | Permite `$near` queries sin cambiar el schema más adelante |
