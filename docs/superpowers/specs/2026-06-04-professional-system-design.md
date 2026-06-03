# Professional System — Design Spec

**Fase 3 de 5 | TrainMeHard Marketplace**
Fecha: 2026-06-04
Estado: Aprobado

---

## Contexto

Fase 2 dejó la infraestructura frontend lista, pero el Professional System tiene 5 bugs críticos que impiden que funcione contra el backend real:

1. `trainer.service.ts` llama `/trainers/*` — backend monta en `/api/professionals/*`
2. Frontend usa `PUT /me/profile` — backend solo tiene `PATCH /professionals/me`
3. `SearchResult.trainers` — backend devuelve `{ professionals, total }` → `data.trainers` es undefined
4. `availability` no existe en el modelo Professional
5. Sin flujo de onboarding → profesional sin perfil → dashboard 404

Phase 3 corrige estos bugs y añade el sistema profesional completo.

---

## Arquitectura

### Backend (cambios mínimos)

**`Professional.model.js`** — añadir campo:
```js
availability: [{
  day: { type: String },
  timeSlots: [{ type: String }],
}]
```

**`professional.routes.js`** — añadir `availability` al schema Zod de PATCH /me:
```js
availability: z.array(z.object({
  day: z.string(),
  timeSlots: z.array(z.string()),
})).optional(),
```

No hay más cambios en backend — todos los endpoints necesarios ya existen.

### Frontend

```
fitness-frontend/src/
├── services/
│   ├── professional.service.ts   ← NUEVO (reemplaza trainer.service.ts)
│   └── trainer.service.ts        ← ELIMINAR
├── types/
│   └── professional.ts           ← actualizar SearchResult + location + isApproved
├── app/(public)/
│   ├── professionals/
│   │   ├── page.tsx              ← añadir filtros type/city/minRating
│   │   └── [id]/page.tsx         ← badge tipo, reviews, booking simplificado
│   └── trainers/                 ← ELIMINAR directorio completo
├── app/(protected)/dashboard/professional/
│   ├── page.tsx                  ← fix imports, añadir type/location/approval
│   └── setup/page.tsx            ← NUEVO: onboarding form
├── components/
│   └── TrainerCard.tsx           ← badge tipo, location
└── next.config.ts                ← redirect /trainers → /professionals
```

---

## API Endpoints (todos ya existentes en backend)

| Método | Ruta | Uso |
|---|---|---|
| GET | /api/professionals | Búsqueda con filtros |
| GET | /api/professionals/:id | Perfil público |
| GET | /api/professionals/me | Mi perfil (auth) |
| PATCH | /api/professionals/me | Crear/actualizar perfil (upsert) |
| POST | /api/reviews | Crear reseña (auth) |
| GET | /api/reviews/professional/:id | Reseñas de un profesional |

**Parámetros de búsqueda (GET /api/professionals):**
- `type` — 'trainer' | 'nutritionist' | 'physiotherapist'
- `specialty` — string (text match en specialties array)
- `city` — string (regex case-insensitive en location.city)
- `minPrice`, `maxPrice` — número
- `minRating` — número
- `page`, `limit` — paginación

---

## Tipos actualizados

### `types/professional.ts`

```typescript
export type ProfessionalType = 'trainer' | 'nutritionist' | 'physiotherapist'

export interface AvailabilitySlot { day: string; timeSlots: string[] }

export interface ProfessionalLocation { city: string; country: string }

export interface ProfessionalUser {
  firstName: string
  lastName: string
  email?: string
  avatar?: string
}

export interface Professional {
  _id: string
  userId: ProfessionalUser
  professionalType: ProfessionalType
  bio?: string
  specialties: string[]
  location?: ProfessionalLocation
  sessionPrice: number
  isApproved?: boolean
  rating: number
  reviewCount: number
  availability?: AvailabilitySlot[]
}

export interface ProfessionalSearchParams {
  type?: ProfessionalType
  specialty?: string
  city?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  page?: number
}

export interface SearchResult {
  professionals: Professional[]   // era "trainers" — CORREGIDO
  total: number
  page?: number
  totalPages?: number
}

export interface Review {
  _id: string
  userId: { firstName: string; lastName: string; avatar?: string }
  rating: number
  comment?: string
  createdAt: string
}
```

---

## `services/professional.service.ts`

```typescript
import api from '@/lib/api'
import type { Professional, ProfessionalSearchParams, SearchResult, Review } from '@/types/professional'

export const searchProfessionals = (params: ProfessionalSearchParams = {}): Promise<SearchResult> =>
  api.get('/professionals', { params }).then((r) => r.data.data)

export const getProfessionalById = (id: string): Promise<Professional> =>
  api.get(`/professionals/${id}`).then((r) => r.data.data.professional)

export const getMyProfile = (): Promise<Professional> =>
  api.get('/professionals/me').then((r) => r.data.data.professional)

export const updateProfile = (data: Partial<Pick<Professional, 'bio' | 'specialties' | 'sessionPrice' | 'availability' | 'professionalType'> & { location?: { city: string; country: string } }>): Promise<Professional> =>
  api.patch('/professionals/me', data).then((r) => r.data.data.professional)

export const getProfessionalReviews = (professionalId: string): Promise<Review[]> =>
  api.get(`/reviews/professional/${professionalId}`).then((r) => r.data.data.reviews)
```

Note: `trainer.service.ts` se elimina. Todos los importadores actualizan a `professional.service`.

---

## Search Page (`(public)/professionals/page.tsx`)

**Filtros añadidos:**
- Chips de tipo: "Todos" | "Entrenador" | "Nutricionista" | "Fisioterapeuta" — filtra por `type`
- Input ciudad: filtra por `city`
- Rating mínimo: selector ≥3★ / ≥4★ / ≥4.5★

**Cambios:**
- `searchTrainers` → `searchProfessionals`
- `data.trainers` → `data.professionals`
- URL params actualizados para incluir `type`

---

## Public Profile Page (`(public)/professionals/[id]/page.tsx`)

**Mejoras:**
- Badge de tipo en el header (color por tipo: trainer=verde, nutritionist=azul, physiotherapist=morado)
- Mostrar `location.city` + `location.country` si existen
- Eliminar selector de duración y cálculo `(price * duration) / 60` — mostrar `sessionPrice` plano
- Sección de reseñas al final: lista de reviews con avatar inicial, nombre, estrellas, comentario, fecha
- Si sin reseñas: "Aún no tiene reseñas"

**Booking widget (simplificado):**
```
[Precio de la sesión: €XX]
[Fecha y hora]
[Reservar sesión]
```
`createSession({ professionalId: id, scheduledAt })` — sin duración.

---

## TrainerCard (`components/TrainerCard.tsx`)

**Añadir:**
- Badge pequeño con el tipo (color por tipo)
- Si `professional.location?.city` existe: mostrar ciudad con icono MapPin

---

## Professional Dashboard (`(protected)/dashboard/professional/page.tsx`)

**Cambios:**
- `getMyTrainerProfile` → `getMyProfile` (professional.service)
- `updateMyProfile` → `updateProfile`
- `updateAvailability` → incluido en `updateProfile` (un solo PATCH)
- Añadir campo `professionalType` al form de perfil (selector entre los 3 tipos)
- Añadir campos `ciudad` + `país` al form de perfil
- Añadir banner "Perfil pendiente de aprobación" cuando `profile.isApproved === false`
- Si `getMyProfile` lanza 404 → redirect a `/dashboard/professional/setup`

---

## Professional Onboarding (`(protected)/dashboard/professional/setup/page.tsx`)

Form para crear perfil inicial. Campos:
1. **Tipo profesional** — selector: Entrenador Personal / Nutricionista / Fisioterapeuta
2. **Bio** — textarea (max 500)
3. **Especialidades** — tags input (añadir/eliminar)
4. **Precio por sesión (€)** — number input
5. **Ciudad** — text input
6. **País** — text input

On submit: `updateProfile({ professionalType, bio, specialties, sessionPrice, location: { city, country } })`
On success: redirect `/dashboard/professional`

No requires `isApproved` — perfil se crea en estado pendiente. El dashboard lo indica.

---

## Redirects (`next.config.ts`)

```typescript
async redirects() {
  return [
    { source: '/trainers', destination: '/professionals', permanent: true },
    { source: '/trainers/:id', destination: '/professionals/:id', permanent: true },
  ]
}
```

---

## Criterios de éxito

1. `GET /api/professionals` devuelve resultados visibles en search page
2. Filtrar por tipo muestra solo ese tipo de profesional
3. Perfil público carga con badge tipo, location, reseñas
4. Profesional nuevo → va a `/setup` → crea perfil → regresa al dashboard con banner "pendiente"
5. Profesional existente → dashboard carga perfil correctamente
6. Disponibilidad se guarda vía PATCH /professionals/me junto al perfil
7. `/trainers` redirige a `/professionals`
8. Build TypeScript sin errores, lint limpio
