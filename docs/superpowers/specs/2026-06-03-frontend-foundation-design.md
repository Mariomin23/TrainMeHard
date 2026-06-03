# Frontend Foundation — Design Spec

**Fase 2 de 5 | TrainMeHard Marketplace**  
Fecha: 2026-06-03  
Estado: Aprobado

---

## Contexto

El `fitness-frontend` actual tiene un skeleton funcional básico: diseño visual correcto, pero sin route groups, sin shadcn/ui, sin types centralizados, sin hooks/, y auth con token en localStorage (sin refresh token en frontend). El backend (Fase 1) ya implementa refresh token rotation con httpOnly cookie. Esta fase estructura el frontend correctamente para soportar las fases 3-5.

---

## Arquitectura

### Estructura de directorios target

```
fitness-frontend/src/
├── app/
│   ├── (public)/                     # Navbar visible, sin auth requerida
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # home
│   │   └── professionals/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   ├── (auth)/                       # Layout centrado, sin Navbar
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (protected)/                  # Navbar visible, middleware bloquea si sin sesión
│   │   ├── layout.tsx                # rehidrata auth al montar vía /auth/refresh
│   │   └── dashboard/
│   │       ├── page.tsx
│   │       └── professional/page.tsx
│   ├── layout.tsx                    # root: font + providers globales únicamente
│   └── globals.css
├── components/
│   ├── ui/                           # shadcn/ui (generado por CLI)
│   └── [componentes propios]         # Hero, Navbar, TrainerCard, SessionCard, etc.
├── hooks/
│   ├── useAuth.ts                    # wrapper sobre auth store
│   └── useApi.ts                     # wrapper tipado sobre axios
├── lib/
│   ├── api.ts                        # instancia axios + interceptores refresh
│   └── utils.ts                      # cn() (clsx + tailwind-merge)
├── services/                         # sin cambios
├── store/
│   └── auth.store.ts                 # Zustand — token en memoria, sin localStorage
├── types/
│   ├── auth.ts
│   ├── professional.ts
│   └── session.ts
└── middleware.ts                     # en src/ — lee cookie tmh_session, redirige si falta
```

---

## Auth Flow

### Login

1. POST `/auth/login` → backend devuelve `{ accessToken, user }` y setea httpOnly cookie `refreshToken`
2. Frontend guarda `accessToken` en Zustand (memoria únicamente, sin localStorage)
3. Frontend setea cookie no-httpOnly `tmh_session=1` desde JS — solo usada por middleware para redirect server-side
4. Zustand expone `user` y `token`

### Rehidratación en recarga de página

El access token vive en memoria → muere en recarga. El flujo de rehidratación:

1. middleware.ts lee `tmh_session=1` → permite pasar (no redirige)
2. `(protected)/layout.tsx` monta → `useEffect` llama `GET /auth/refresh`
3. Backend lee httpOnly cookie `refreshToken` → devuelve nuevo `accessToken` + `user`
4. Zustand se rehidrata → UI se renderiza autenticada

Resultado: sin flash de contenido no autenticado (middleware ya pasó), sin acceso a refresh token desde JS.

### Interceptor axios — refresh automático en vuelo

```
request sale → recibe 401
  → si ya hay refresh en curso: encolar request
  → si no: llamar /auth/refresh → guardar nuevo token → reintentar cola
  → si /auth/refresh falla: logout() + redirect /login
```

Implementado en `lib/api.ts`. Cola de requests para evitar race conditions cuando múltiples requests fallan simultáneamente.

### Logout

1. DELETE `/auth/logout` → backend invalida refresh token en BD
2. Zustand reset (token = null, user = null)
3. Borrar cookie `tmh_session` desde JS
4. Redirect a `/`

### middleware.ts

```ts
// matcher: ['/dashboard/:path*']
// Lee cookie tmh_session → si no existe → redirect /login
// NO verifica JWT (no tiene la clave privada)
// Solo sirve para evitar flash — la rehidratación valida el token real
```

---

## shadcn/ui

### Instalación

```bash
npx shadcn@latest init
```

Configurar con: TypeScript, Tailwind, `src/`, alias `@/components/ui`.

### Componentes a instalar (Fases 2-5)

`button`, `input`, `label`, `card`, `badge`, `dialog`, `avatar`, `skeleton`, `separator`, `tabs`, `form`, `select`, `textarea`

Solo instalar en Phase 2 los que se usen en esta fase. El resto se instala conforme se necesita en fases 3-5.

---

## lib/

### `lib/api.ts`

- Instancia axios con `baseURL: process.env.NEXT_PUBLIC_API_URL`
- Interceptor request: attach `Bearer ${token}` desde Zustand si existe
- Interceptor response: captura 401 → refresh automático con cola → retry
- Exportación default: `api`
- Reemplaza `services/api.ts` (que se elimina)

### `lib/utils.ts`

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Requerido por shadcn/ui. Sin más utilidades en Phase 2.

---

## hooks/

### `hooks/useAuth.ts`

```ts
// Exporta: { user, isAuthenticated, isLoading, logout }
// Pages y componentes importan de aquí — no importan el store directamente
// isLoading: true mientras /auth/refresh está en curso al montar
```

### `hooks/useApi.ts`

```ts
// Wrapper genérico sobre lib/api con tipado
// Exporta: { data, error, loading, execute }
// Alternativa ligera a react-query para Phase 2
```

---

## types/

### `types/auth.ts`

```ts
interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'user' | 'professional' | 'admin'
  avatar?: string
}

interface AuthTokens {
  accessToken: string
  user: User
}

interface LoginPayload { email: string; password: string }
interface RegisterPayload { firstName: string; lastName: string; email: string; password: string; role: 'user' | 'professional' }
```

### `types/professional.ts`

```ts
interface Professional {
  _id: string
  userId: { firstName: string; lastName: string; avatar?: string }
  specialties: string[]
  bio?: string
  hourlyRate: number
  rating: number
  reviewsCount: number
  type: 'trainer' | 'nutritionist' | 'physiotherapist'
}

interface ProfessionalSearchParams {
  specialty?: string
  minRate?: number
  maxRate?: number
  type?: string
  page?: number
}

interface SearchResult {
  professionals: Professional[]
  total: number
  page: number
}
```

### `types/session.ts`

```ts
type SessionStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED'

interface Session {
  _id: string
  sessionDate: string
  durationMinutes: number
  price: number
  status: SessionStatus
  paymentStatus: PaymentStatus
  professionalId?: { specialties: string[]; hourlyRate: number }
}
```

---

## store/

### `store/auth.store.ts` — reescrito

```ts
interface AuthStore {
  user: User | null
  token: string | null           // en memoria — nunca en localStorage
  isHydrating: boolean           // true durante /auth/refresh al montar
  setAuth: (token: string, user: User) => void
  setHydrating: (v: boolean) => void
  logout: () => void
}
```

Sin `hydrate()` desde localStorage. La rehidratación viene de `/auth/refresh`.

---

## Eliminaciones

| Archivo | Reemplazado por |
|---|---|
| `src/services/api.ts` | `src/lib/api.ts` |
| `src/components/AuthGuard.tsx` | middleware.ts + `(protected)/layout.tsx` |
| `src/store/auth.store.ts` (actual) | reescrito sin localStorage |

---

## Qué NO cambia

- Diseño visual (Tailwind, colores verdes, tipografía Geist)
- Contenido de cada page (lógica de negocio, queries)
- `services/` (auth.service.ts, trainer.service.ts, session.service.ts) — solo actualizan import de `api` a `lib/api`
- Componentes visuales: Hero, Navbar, TrainerCard, SessionCard, CheckoutModal, PaymentForm

---

## Criterios de éxito

1. `/dashboard` redirige a `/login` server-side sin flash si no hay sesión
2. Recargar `/dashboard` rehidrata auth sin redirigir (refresh token válido)
3. Token no visible en localStorage ni sessionStorage
4. shadcn/ui instalado, `cn()` disponible, primer componente shadcn en uso
5. Types centralizados — cero interfaces inline en pages
6. `useAuth` hook usado en Navbar y dashboard pages
7. Build TypeScript sin errores
