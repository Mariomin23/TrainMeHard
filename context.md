# context.md — Fitness Marketplace Platform

> **Documento vivo.** Actualizar ante cualquier cambio arquitectónico relevante.
> Versión: 1.1 | Última revisión: junio 2025

---

## 1. Visión General & Modelo de Negocio

### Concepto

Marketplace "One-Shot" para profesionales del bienestar. Los usuarios pueden buscar y explorar perfiles gratuitamente; el acceso a un profesional se desbloquea mediante el pago de una **Sesión Inicial** única.

### Verticales del marketplace

| Vertical | Descripción |
|---|---|
| **Entrenadores Fitness** | MVP principal. Sesiones presenciales u online. |
| **Nutricionistas** | Consultas de planificación nutricional. |
| **Fisioterapeutas** | Evaluación y rehabilitación física. |

> Cada vertical comparte la misma infraestructura pero puede tener campos de perfil y flujos específicos. Se modelan con un campo `professionalType` en el schema del profesional.

### Modelo de monetización

- **Comisión:** 50 % del precio de la Sesión Inicial (ya incluye fees de Stripe).
- **Fórmula de payout:** `payout = sessionPrice * 0.50`
- **Motor de cobro:** Stripe Connect (Split Payments). El profesional recibe el 50 % directamente en su cuenta Stripe Connect; la plataforma retiene el resto.
- **Referencia UX:** TaskRabbit — minimalismo, búsqueda potente, tarjetas claras.

---

## 2. Stack Tecnológico

### Backend

| Tecnología | Versión mínima | Uso |
|---|---|---|
| Node.js | 20 LTS | Runtime |
| Express | 5.x | Framework HTTP |
| ES Modules | (`"type": "module"`) | Sintaxis estándar |
| Mongoose | 8.x | ODM para MongoDB |
| Zod | 3.x | Validación de esquemas |
| Stripe | `stripe` npm SDK | Pagos y payouts |
| jsonwebtoken | 9.x | Emisión/verificación JWT |
| helmet | latest | HTTP Security Headers |
| express-rate-limit | latest | Rate limiting |
| winston | latest | Logging estructurado |

### Frontend

| Tecnología | Versión mínima | Uso |
|---|---|---|
| Next.js | 14+ (App Router) | Framework React SSR/SSG |
| Tailwind CSS | 3.x | Utilidades CSS |
| Zustand | 4.x | Estado global ligero |
| React Hook Form | 7.x | Gestión de formularios |
| Zod | 3.x | Validación en cliente (compartida con back) |
| Axios | 1.x | Cliente HTTP |
| Radix UI / shadcn/ui | latest | Componentes accesibles |

### Infraestructura & DevOps

| Servicio | Uso |
|---|---|
| MongoDB Atlas | Base de datos cloud (M0 en dev, M10+ en prod) |
| Stripe Connect | Pagos y split automático |
| Vercel | Deploy del frontend Next.js |
| Railway / Render | Deploy del backend Express |
| Cloudinary / S3 | Almacenamiento de imágenes de perfil |
| Resend / SendGrid | Emails transaccionales |
| Sentry | Monitoreo de errores en producción |

---

## 3. Arquitectura de Directorios

### Backend — `/fitness-backend`

```
fitness-backend/
├── src/
│   ├── config/           # Variables de entorno, configuración de DB y Stripe
│   │   ├── db.js
│   │   ├── stripe.js
│   │   └── env.js        # Carga y valida variables con Zod
│   ├── models/           # Schemas Mongoose (solo estructura de datos)
│   │   ├── User.model.js
│   │   ├── Professional.model.js
│   │   ├── Session.model.js
│   │   └── Review.model.js
│   ├── controllers/      # Orquestación: recibe req → llama services → responde
│   │   ├── auth.controller.js
│   │   ├── professional.controller.js
│   │   ├── session.controller.js
│   │   └── review.controller.js
│   ├── services/         # Lógica de negocio pura (sin Express)
│   │   ├── auth.service.js
│   │   ├── professional.service.js
│   │   ├── payment.service.js    # ← Motor de cobro del 50% aquí
│   │   ├── payout.service.js     # ← Lógica de Stripe Connect aquí
│   │   ├── notification.service.js
│   │   └── search.service.js
│   ├── routes/           # Solo definición de endpoints y middlewares
│   │   ├── auth.routes.js
│   │   ├── professional.routes.js
│   │   ├── session.routes.js
│   │   └── review.routes.js
│   ├── middlewares/
│   │   ├── auth.middleware.js    # Verifica JWT
│   │   ├── rbac.middleware.js    # Control de roles
│   │   ├── validate.middleware.js # Validación con Zod
│   │   ├── rateLimiter.middleware.js
│   │   └── errorHandler.middleware.js
│   ├── utils/
│   │   ├── jwt.util.js
│   │   ├── priceFormatter.util.js
│   │   ├── apiResponse.util.js   # Respuestas JSON estandarizadas
│   │   └── logger.util.js        # Winston configurado
│   └── app.js            # Configuración de Express (sin lógica de negocio)
├── server.js             # Punto de entrada: solo arranca el servidor
├── .env.example
└── package.json
```

> **Regla de oro:** Un archivo de `routes/` nunca importa de `models/`. Un `controller/` nunca importa de Stripe directamente. La lógica de Stripe vive exclusivamente en `payment.service.js` y `payout.service.js`.

### Frontend — `/fitness-frontend`

```
fitness-frontend/
├── src/
│   ├── app/              # App Router de Next.js
│   │   ├── (public)/     # Rutas sin autenticación
│   │   │   ├── page.tsx              # Home / búsqueda
│   │   │   ├── professionals/[id]/   # Perfil público del profesional
│   │   │   └── auth/                 # Login / Register
│   │   ├── (protected)/  # Rutas con autenticación (middleware Next.js)
│   │   │   ├── dashboard/            # Dashboard usuario
│   │   │   ├── professional/         # Dashboard profesional
│   │   │   └── admin/                # Panel de administración
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/           # Componentes atómicos (Button, Input, Card…)
│   │   ├── professionals/ # ProfessionalCard, ProfessionalGrid, FilterPanel
│   │   ├── sessions/     # SessionBookingFlow, SessionSummary
│   │   └── layout/       # Navbar, Footer, Sidebar
│   ├── hooks/            # Custom hooks (useAuth, useProfessionals, useSession)
│   ├── services/         # Capa API (axios instances, endpoints)
│   │   ├── api.client.js # Axios base instance con interceptors
│   │   ├── auth.service.js
│   │   └── professional.service.js
│   ├── store/            # Zustand stores
│   │   ├── auth.store.js
│   │   └── search.store.js
│   ├── lib/              # Utilidades (cn(), formatPrice, validators Zod)
│   └── types/            # TypeScript interfaces y types globales
├── public/
├── next.config.js
└── tailwind.config.js
```

---

## 4. Roles y Permisos (RBAC)

| Rol | Permisos clave |
|---|---|
| `super_admin` | Acceso total. Gestión de admins. |
| `admin` | Panel de moderación, métricas, resolución de disputas. |
| `professional` | CRUD de su perfil, disponibilidad y cobros. |
| `user` | Búsqueda, pago de sesiones, acceso a contenido comprado, reviews. |

**Implementación:** El rol se incluye en el payload del JWT. El middleware `rbac.middleware.js` expone un helper `requireRole(...roles)` que se compone en las rutas:

```js
// Ejemplo de uso en routes
router.delete('/users/:id', requireAuth, requireRole('admin', 'super_admin'), deleteUser);
```

---

## 5. Flujo de Pago (Stripe Connect)

```
Usuario paga Sesión Inicial
         │
         ▼
  Stripe Checkout (o PaymentIntent)
         │
         ▼
  payment.service.js
  - Calcula comisión: sessionPrice * 0.50
  - Crea transfer a cuenta Stripe Connect del profesional
         │
         ├──► Profesional recibe 50% (transfer automático)
         └──► Plataforma retiene 50% (application_fee_amount)
         │
         ▼
  Session se marca como `paid` en MongoDB
  Webhook de Stripe confirma el pago (idempotente)
```

**Reglas críticas:**
- Nunca calcular precios en el frontend — solo el backend determina el `amount`.
- Usar webhooks de Stripe para confirmar el estado final del pago (nunca confiar solo en la redirección del cliente).
- Almacenar `stripePaymentIntentId` en el modelo `Session` para trazabilidad.

---

## 6. Modelos de Datos Clave

### User

```js
{
  email: String (unique),
  passwordHash: String,
  role: enum['user', 'professional', 'admin', 'super_admin'],
  firstName: String,
  lastName: String,
  avatar: String (URL),
  isVerified: Boolean,
  createdAt: Date
}
```

### Professional

```js
{
  userId: ObjectId → User,
  professionalType: enum['trainer', 'nutritionist', 'physiotherapist'],
  bio: String,
  specialties: [String],
  location: { city, country, coordinates: [lng, lat] },
  sessionPrice: Number,
  stripeAccountId: String,  // Stripe Connect account ID
  isApproved: Boolean,      // Moderado por admin antes de publicarse
  rating: Number,
  reviewCount: Number
}
```

### Session

```js
{
  userId: ObjectId → User,
  professionalId: ObjectId → Professional,
  status: enum['pending', 'paid', 'completed', 'cancelled', 'disputed'],
  sessionPrice: Number,
  platformFee: Number,       // 50% retenido por la plataforma
  professionalPayout: Number, // 50% al profesional
  stripePaymentIntentId: String,
  scheduledAt: Date,
  createdAt: Date
}
```

---

## 7. Diseño UX/UI (Mobile-First)

- **Sistema de diseño basado en tokens:** Colores, tipografías y espaciados definidos en `tailwind.config.js` como design tokens. Nunca hardcodear valores de color en componentes.
- **Mobile-First:** Breakpoints ascendentes (`sm:`, `md:`, `lg:`). Todo el diseño parte de 375px de ancho.
- **Componentes atómicos:** Button, Input, Badge, Avatar, Card — en `components/ui/`. Basados en Radix UI para garantizar accesibilidad (WCAG 2.1 AA).
- **Preparado para React Native:** Los custom hooks (`useAuth`, `useProfessionals`) no deben contener referencias a APIs del DOM, facilitando su reutilización en una futura app nativa.
- **Estados de carga y error:** Cada componente que hace fetch debe manejar `loading`, `error` y `empty` states explícitamente.
- **Skeleton screens** en lugar de spinners para listas de profesionales.

---

## 8. Seguridad & Robustez

### Autenticación

- **JWT Stateless:** `Authorization: Bearer <token>` en cada petición autenticada.
- **Access Token:** Expiración corta (15 min).
- **Refresh Token:** Expiración larga (7 días), almacenado en cookie `httpOnly; Secure; SameSite=Strict`.
- **Rotación de Refresh Tokens:** Invalidar el token anterior al emitir uno nuevo (detección de robo).

### Protecciones de API

| Medida | Herramienta | Notas |
|---|---|---|
| CORS | `cors` npm | Whitelist de orígenes explícita |
| Rate Limiting | `express-rate-limit` | 100 req/15 min por IP en rutas públicas |
| Helmet | `helmet` | Headers de seguridad HTTP |
| Sanitización | `zod` + `mongo-sanitize` | Prevención de NoSQL Injection |
| HTTPS | Forzado en producción | Redirect 301 de HTTP a HTTPS |
| Logs de auditoría | `winston` | Registro de acciones críticas (pagos, cambios de rol) |

### Validación de datos

- Zod schemas compartidos entre frontend y backend (paquete `shared/` o monorepo).
- El backend **siempre** re-valida — nunca confiar en la validación del cliente.
- Los Zod schemas son la fuente de verdad para la forma de los datos.

---

## 9. Manejo de Errores & Logging

### Respuestas de error estandarizadas

```json
{
  "success": false,
  "error": {
    "code": "PROFESSIONAL_NOT_FOUND",
    "message": "The requested professional does not exist.",
    "statusCode": 404
  }
}
```

- Códigos de error semánticos en `SCREAMING_SNAKE_CASE`.
- Nunca exponer stack traces en producción.
- El middleware `errorHandler.middleware.js` es el único lugar donde se formatean y envían errores al cliente.

### Logging con Winston

- `info`: Acciones de negocio (nueva sesión, pago exitoso).
- `warn`: Intentos fallidos de auth, rate limits alcanzados.
- `error`: Excepciones no manejadas, fallos de Stripe.

---

## 10. Testing

| Tipo | Herramienta | Cobertura objetivo |
|---|---|---|
| Unit (services) | Vitest | >80% en `services/` |
| Integration (API) | Supertest + Vitest | Endpoints críticos (auth, pagos) |
| E2E | Playwright | Flujo de pago completo |
| Contrato | Zod schemas | Garantizado en build |

---

## 11. Variables de Entorno (`.env.example`)

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

# Storage
CLOUDINARY_URL=

# Email
RESEND_API_KEY=

# Monitoring
SENTRY_DSN=
```

---

## 12. Instrucciones para la IA (Coding Guidelines)

1. **Separación estricta:** Nunca mezclar lógica de base de datos con rutas, ni lógica de Stripe con controllers. Cada capa tiene una sola responsabilidad.
2. **Lógica de cobro en Services:** El cálculo del 50% y cualquier interacción con Stripe reside **exclusivamente** en `payment.service.js` y `payout.service.js`.
3. **Nombres descriptivos en inglés:** Variables, funciones y archivos en inglés. Comentarios en español si el equipo lo prefiere.
4. **Archivos pequeños y enfocados:** Si un archivo supera ~150 líneas, evaluar si debe dividirse.
5. **Nunca hardcodear secretos ni URLs:** Usar siempre variables de entorno vía `config/env.js`.
6. **Respuestas API estandarizadas:** Usar el helper `apiResponse.util.js` para todas las respuestas (`success`, `error`).
7. **Validar siempre con Zod** antes de persistir en base de datos o procesar un pago.
8. **Commits semánticos:** `feat:`, `fix:`, `chore:`, `refactor:`, `test:`.
9. **El webhook de Stripe es la fuente de verdad** del estado de un pago — no la redirección del navegador.
10. **Accesibilidad no es opcional:** Todo componente interactivo debe ser operable con teclado y tener roles ARIA correctos.

---

## 13. Decisiones de Diseño & Razonamiento (ADRs resumidos)

| Decisión | Alternativa descartada | Razón |
|---|---|---|
| JWT stateless | Sessions con cookies | Compatibilidad futura con app móvil |
| Stripe Connect | PayPal, transferencia manual | Split automático, cumplimiento regulatorio |
| Zustand | Redux | Menor boilerplate para el tamaño del proyecto |
| Zod compartido | Joi (solo back) | Validación isomórfica front+back |
| MongoDB | PostgreSQL | Flexibilidad de schema para múltiples verticales |
| Express 5 | Fastify | Mayor ecosistema y familiaridad del equipo |

---

*Fin del documento. Cualquier decisión que contradiga este contexto debe ser discutida y reflejada aquí antes de implementarse.*
