# Professional System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 5 critical integration bugs between frontend and backend professional API, add availability to the data model, and complete the professional system (onboarding, enhanced search, public profile with reviews, type/location display).

**Architecture:** Backend changes are minimal (add `availability` field to Professional model + Zod schema). All logic lives in the frontend: `professional.service.ts` replaces `trainer.service.ts` with correct API paths, types are updated, and new pages (setup/onboarding) are added. No new backend endpoints needed — all routes already exist.

**Tech Stack:** Next.js 16.2.6, TypeScript, Tailwind v4, Zustand, Axios, Node.js/Express, Mongoose, Zod, Vitest

---

## File Map

### Backend — Modified
- `fitness-backend/src/models/Professional.model.js` — add `availability` array field
- `fitness-backend/src/routes/professional.routes.js` — add `availability` to PATCH /me Zod schema

### Frontend — Created
- `fitness-frontend/src/services/professional.service.ts` — correct `/professionals/*` API paths, all methods
- `fitness-frontend/src/app/(protected)/dashboard/professional/setup/page.tsx` — onboarding form for new professionals

### Frontend — Modified
- `fitness-frontend/src/types/professional.ts` — `SearchResult.professionals` key, `ProfessionalType`, `Review`, `location`, `isApproved`
- `fitness-frontend/src/components/TrainerCard.tsx` — type badge, location display
- `fitness-frontend/src/app/(public)/professionals/page.tsx` — type/city/rating filters, use `data.professionals`
- `fitness-frontend/src/app/(public)/professionals/[id]/page.tsx` — type badge, location, reviews section, flat booking
- `fitness-frontend/src/app/(protected)/dashboard/professional/page.tsx` — fix service imports, add type/location/approval status, 404→setup redirect

### Frontend — Deleted
- `fitness-frontend/src/services/trainer.service.ts` — replaced by `professional.service.ts`
- `fitness-frontend/src/app/(public)/trainers/` — already redirected in `next.config.ts`; delete source files

---

## Task 1: Add availability to Professional model (backend)

**Files:**
- Modify: `fitness-backend/src/models/Professional.model.js`
- Modify: `fitness-backend/src/routes/professional.routes.js`

- [ ] **Step 1: Add availability field to Professional model**

In `fitness-backend/src/models/Professional.model.js`, add after `reviewCount`:

```js
// Before (full file for context):
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
    availability: [{
      day: { type: String, required: true },
      timeSlots: [{ type: String }],
    }],
  },
  { timestamps: true }
);

professionalSchema.index({ 'location.coordinates': '2dsphere' });

export default mongoose.model('Professional', professionalSchema);
```

- [ ] **Step 2: Add availability to PATCH /me Zod schema**

In `fitness-backend/src/routes/professional.routes.js`, update `updateProfileSchema`:

```js
const updateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  specialties: z.array(z.string()).optional(),
  location: z.object({
    city: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  sessionPrice: z.number().min(0).optional(),
  professionalType: z.enum(['trainer', 'nutritionist', 'physiotherapist']).optional(),
  availability: z.array(z.object({
    day: z.string(),
    timeSlots: z.array(z.string()),
  })).optional(),
});
```

- [ ] **Step 3: Run existing backend tests to verify nothing broke**

```bash
cd fitness-backend && npx vitest run
```

Expected: 30 tests pass (same as before — model change is additive, no existing tests break).

- [ ] **Step 4: Commit**

```bash
git add fitness-backend/src/models/Professional.model.js fitness-backend/src/routes/professional.routes.js
git commit -m "feat(backend): add availability field to Professional model and PATCH schema"
```

---

## Task 2: Update frontend types

**Files:**
- Modify: `fitness-frontend/src/types/professional.ts`

- [ ] **Step 1: Replace entire file**

```typescript
// fitness-frontend/src/types/professional.ts
export type ProfessionalType = 'trainer' | 'nutritionist' | 'physiotherapist'

export interface AvailabilitySlot {
  day: string
  timeSlots: string[]
}

export interface ProfessionalLocation {
  city: string
  country: string
}

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
  professionals: Professional[]
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

export interface UpdateProfilePayload {
  professionalType?: ProfessionalType
  bio?: string
  specialties?: string[]
  sessionPrice?: number
  location?: { city: string; country: string }
  availability?: AvailabilitySlot[]
}
```

- [ ] **Step 2: Verify TypeScript (types only)**

```bash
cd fitness-frontend && npx tsc --noEmit --skipLibCheck 2>&1 | grep "types/professional" | head -10
```

Expected: no errors from the type file itself.

- [ ] **Step 3: Commit**

```bash
git add fitness-frontend/src/types/professional.ts
git commit -m "feat(frontend): update professional types — SearchResult.professionals, ProfessionalType, Review, location, isApproved"
```

---

## Task 3: Create professional.service.ts + delete trainer.service.ts

**Files:**
- Create: `fitness-frontend/src/services/professional.service.ts`
- Delete: `fitness-frontend/src/services/trainer.service.ts`

- [ ] **Step 1: Create fitness-frontend/src/services/professional.service.ts**

```typescript
// fitness-frontend/src/services/professional.service.ts
import api from '@/lib/api'
import type { Professional, SearchResult, ProfessionalSearchParams, Review, UpdateProfilePayload } from '@/types/professional'

export const searchProfessionals = (params: ProfessionalSearchParams = {}): Promise<SearchResult> =>
  api.get('/professionals', { params }).then((r) => r.data.data)

export const getProfessionalById = (id: string): Promise<Professional> =>
  api.get(`/professionals/${id}`).then((r) => r.data.data.professional)

export const getMyProfile = (): Promise<Professional> =>
  api.get('/professionals/me').then((r) => r.data.data.professional)

export const updateProfile = (data: UpdateProfilePayload): Promise<Professional> =>
  api.patch('/professionals/me', data).then((r) => r.data.data.professional)

export const getProfessionalReviews = (professionalId: string): Promise<Review[]> =>
  api.get(`/reviews/professional/${professionalId}`).then((r) => r.data.data.reviews)
```

- [ ] **Step 2: Delete trainer.service.ts**

```bash
rm fitness-frontend/src/services/trainer.service.ts
```

- [ ] **Step 3: Delete trainers pages (already redirected in next.config.ts)**

```bash
rm -rf "fitness-frontend/src/app/(public)/trainers"
```

- [ ] **Step 4: Run TypeScript — fix any broken imports**

```bash
cd fitness-frontend && npx tsc --noEmit --skipLibCheck 2>&1 | grep -v ".next" | head -20
```

The dashboard professional page still imports `trainer.service` — it will error. That's fixed in Task 7. At this stage, check only for errors NOT in `(protected)/dashboard/professional/page.tsx`.

- [ ] **Step 5: Commit**

```bash
git add fitness-frontend/src/services/professional.service.ts
git rm fitness-frontend/src/services/trainer.service.ts
git rm -r "fitness-frontend/src/app/(public)/trainers"
git commit -m "feat(frontend): create professional.service with correct API paths, delete trainer.service and /trainers pages"
```

---

## Task 4: Update TrainerCard — type badge + location

**Files:**
- Modify: `fitness-frontend/src/components/TrainerCard.tsx`

- [ ] **Step 1: Replace entire TrainerCard component**

```typescript
// fitness-frontend/src/components/TrainerCard.tsx
import Link from 'next/link'
import { Star, MapPin } from 'lucide-react'
import type { Professional, ProfessionalType } from '@/types/professional'

const TYPE_LABELS: Record<ProfessionalType, string> = {
  trainer: 'Entrenador',
  nutritionist: 'Nutricionista',
  physiotherapist: 'Fisioterapeuta',
}

const TYPE_COLORS: Record<ProfessionalType, string> = {
  trainer: 'bg-green-50 text-green-700',
  nutritionist: 'bg-blue-50 text-blue-700',
  physiotherapist: 'bg-purple-50 text-purple-700',
}

export default function TrainerCard({ trainer }: { trainer: Professional }) {
  const initial = trainer.userId.firstName.charAt(0).toUpperCase()

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center text-white font-bold text-lg mb-3 shadow-sm">
            {initial}
          </div>
          <h3 className="font-semibold text-gray-900">{`${trainer.userId.firstName} ${trainer.userId.lastName}`}</h3>
          <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
            <Star size={13} className="text-yellow-400 fill-yellow-400" />
            <span className="font-medium">{trainer.rating > 0 ? trainer.rating.toFixed(1) : 'Nuevo'}</span>
            {trainer.reviewCount > 0 && <span className="text-gray-400">({trainer.reviewCount})</span>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{trainer.sessionPrice}€</p>
          <p className="text-xs text-gray-400 mt-1">por sesión</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${TYPE_COLORS[trainer.professionalType]}`}>
          {TYPE_LABELS[trainer.professionalType]}
        </span>
        {trainer.location?.city && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <MapPin size={11} /> {trainer.location.city}
          </span>
        )}
      </div>

      {trainer.bio && (
        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{trainer.bio}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {trainer.specialties.slice(0, 3).map(s => (
          <span key={s} className="px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-lg font-medium border border-green-100">
            {s}
          </span>
        ))}
      </div>

      <Link
        href={`/professionals/${trainer._id}`}
        className="w-full text-center py-3 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-400 transition-colors mt-auto"
      >
        Ver perfil
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd fitness-frontend && npx tsc --noEmit --skipLibCheck 2>&1 | grep "TrainerCard" | head -5
```

Expected: no errors from TrainerCard.tsx.

- [ ] **Step 3: Commit**

```bash
git add fitness-frontend/src/components/TrainerCard.tsx
git commit -m "feat(frontend): update TrainerCard — professional type badge, location display, flat session price label"
```

---

## Task 5: Enhanced search page

**Files:**
- Modify: `fitness-frontend/src/app/(public)/professionals/page.tsx`

- [ ] **Step 1: Replace entire professionals/page.tsx**

```typescript
// fitness-frontend/src/app/(public)/professionals/page.tsx
'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
import TrainerCard from '@/components/TrainerCard';
import { searchProfessionals } from '@/services/professional.service';
import type { Professional, ProfessionalType } from '@/types/professional';

const SPECIALTIES = [
  'Musculación', 'Pérdida de Peso', 'Yoga', 'Crossfit',
  'Running', 'Pilates', 'Boxeo', 'Nutrición', 'Fisioterapia',
];

const TYPE_OPTIONS: { value: ProfessionalType | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'trainer', label: 'Entrenadores' },
  { value: 'nutritionist', label: 'Nutricionistas' },
  { value: 'physiotherapist', label: 'Fisioterapeutas' },
];

const RATING_OPTIONS = [
  { value: '', label: 'Cualquier valoración' },
  { value: '3', label: '≥ 3★' },
  { value: '4', label: '≥ 4★' },
  { value: '4.5', label: '≥ 4.5★' },
];

function ProfessionalsContent() {
  const searchParams = useSearchParams();

  const [specialty, setSpecialty] = useState(searchParams.get('specialty') || '');
  const [type, setType] = useState<ProfessionalType | ''>((searchParams.get('type') as ProfessionalType) || '');
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = {};
        if (specialty) params.specialty = specialty;
        if (type) params.type = type;
        if (city) params.city = city;
        if (minPrice) params.minPrice = Number(minPrice);
        if (maxPrice) params.maxPrice = Number(maxPrice);
        if (minRating) params.minRating = Number(minRating);
        const data = await searchProfessionals(params);
        if (!cancelled) { setProfessionals(data.professionals); setTotal(data.total); }
      } catch {
        if (!cancelled) setProfessionals([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [specialty, type, city, minPrice, maxPrice, minRating]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); };

  return (
    <main className="flex-1 bg-gray-50">
      <div className="bg-white border-b border-gray-100 py-6 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Type filter */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setType(opt.value as ProfessionalType | '')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  type === opt.value
                    ? 'bg-green-600 text-white border-green-600'
                    : 'border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent transition-all">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={specialty}
                onChange={e => setSpecialty(e.target.value)}
                placeholder="Especialidad..."
                className="flex-1 py-3 bg-transparent outline-none text-gray-700 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(f => !f)}
              className={`px-4 py-3 border rounded-xl flex items-center gap-2 text-sm transition-colors ${showFilters ? 'border-green-600 text-green-600 bg-green-50' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              <SlidersHorizontal size={16} /> Filtros
            </button>
          </form>

          {showFilters && (
            <div className="mt-4 flex gap-4 flex-wrap items-end">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 whitespace-nowrap">Ciudad:</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Madrid..."
                  className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 whitespace-nowrap">Precio/sesión:</label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  placeholder="Min €"
                  className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
                <span className="text-gray-400">—</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  placeholder="Max €"
                  className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Valoración:</label>
                <select
                  value={minRating}
                  onChange={e => setMinRating(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                >
                  {RATING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4 flex-wrap">
            {SPECIALTIES.map(s => (
              <button
                key={s}
                onClick={() => setSpecialty(prev => prev === s ? '' : s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  specialty === s
                    ? 'bg-green-600 text-white border-green-600'
                    : 'border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <p className="text-sm text-gray-500 mb-6">
          {loading ? 'Buscando...' : `${total} profesional${total !== 1 ? 'es' : ''} encontrado${total !== 1 ? 's' : ''}`}
        </p>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse h-64 border border-gray-100" />
            ))}
          </div>
        ) : professionals.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium">Sin resultados</p>
            <p className="text-sm mt-2">Prueba con otra especialidad o ajusta los filtros</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {professionals.map(p => <TrainerCard key={p._id} trainer={p} />)}
          </div>
        )}
      </div>
    </main>
  );
}

export default function ProfessionalsPage() {
  return (
    <Suspense fallback={<main className="flex-1 bg-gray-50" />}>
      <ProfessionalsContent />
    </Suspense>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd fitness-frontend && npx tsc --noEmit --skipLibCheck 2>&1 | grep "professionals/page" | head -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "fitness-frontend/src/app/(public)/professionals/page.tsx"
git commit -m "feat(frontend): enhanced search — type/city/rating filters, use professional.service"
```

---

## Task 6: Updated public profile page

**Files:**
- Modify: `fitness-frontend/src/app/(public)/professionals/[id]/page.tsx`

Key changes: type badge, location, reviews section, simplified booking (no duration), use `professional.service`.

- [ ] **Step 1: Replace entire professionals/[id]/page.tsx**

```typescript
// fitness-frontend/src/app/(public)/professionals/[id]/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, MapPin, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { getProfessionalById, getProfessionalReviews } from '@/services/professional.service';
import { createSession } from '@/services/session.service';
import { useAuthStore } from '@/store/auth.store';
import dynamic from 'next/dynamic';
import type { Professional, Review, ProfessionalType } from '@/types/professional';

const CheckoutModal = dynamic(() => import('@/components/CheckoutModal'), { ssr: false });

const TYPE_LABELS: Record<ProfessionalType, string> = {
  trainer: 'Entrenador Personal',
  nutritionist: 'Nutricionista',
  physiotherapist: 'Fisioterapeuta',
};

const TYPE_COLORS: Record<ProfessionalType, string> = {
  trainer: 'bg-green-100 text-green-700',
  nutritionist: 'bg-blue-100 text-blue-700',
  physiotherapist: 'bg-purple-100 text-purple-700',
};

export default function ProfessionalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [professional, setProfessional] = useState<Professional | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [checkoutSession, setCheckoutSession] = useState<{ id: string; amount: number } | null>(null);

  useEffect(() => {
    Promise.all([
      getProfessionalById(id),
      getProfessionalReviews(id),
    ])
      .then(([prof, revs]) => {
        setProfessional(prof);
        setReviews(revs);
      })
      .catch(() => router.push('/professionals'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    setError('');
    setBooking(true);
    try {
      const session = await createSession({ professionalId: id, scheduledAt: new Date(bookingDate).toISOString() });
      setCheckoutSession({ id: session._id, amount: session.sessionPrice });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Error al reservar');
    } finally {
      setBooking(false);
    }
  };

  if (loading) return (
    <main className="flex-1 flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-green-600 border-t-transparent animate-spin" />
    </main>
  );

  if (!professional) return null;

  return (
    <main className="flex-1 bg-gray-50 py-8 px-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/professionals" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
          <ChevronLeft size={16} /> Volver a resultados
        </Link>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Profile */}
          <div className="md:col-span-2 flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-8 border border-gray-100">
              <div className="flex items-start gap-5 mb-6">
                <div className="w-20 h-20 rounded-2xl bg-green-100 flex items-center justify-center text-green-700 font-bold text-3xl shrink-0">
                  {professional.userId.firstName.charAt(0)}
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">{`${professional.userId.firstName} ${professional.userId.lastName}`}</h1>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${TYPE_COLORS[professional.professionalType]}`}>
                      {TYPE_LABELS[professional.professionalType]}
                    </span>
                    {professional.location?.city && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin size={12} /> {professional.location.city}{professional.location.country ? `, ${professional.location.country}` : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    {professional.rating > 0 ? professional.rating.toFixed(1) : 'Nuevo profesional'}
                    {professional.reviewCount > 0 && <span>· {professional.reviewCount} reseña{professional.reviewCount !== 1 ? 's' : ''}</span>}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {professional.specialties.map(s => (
                      <span key={s} className="px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-full font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              {professional.bio && (
                <div>
                  <h2 className="font-semibold text-gray-900 mb-2">Sobre mí</h2>
                  <p className="text-gray-600 text-sm leading-relaxed">{professional.bio}</p>
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-4">Reseñas</h2>
              {reviews.length === 0 ? (
                <p className="text-gray-400 text-sm">Aún no tiene reseñas.</p>
              ) : (
                <div className="flex flex-col gap-5">
                  {reviews.map(r => (
                    <div key={r._id} className="flex gap-4">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm shrink-0">
                        {r.userId.firstName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{r.userId.firstName} {r.userId.lastName}</span>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={12} className={i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
                            ))}
                          </div>
                        </div>
                        {r.comment && <p className="text-sm text-gray-600 mt-1 leading-relaxed">{r.comment}</p>}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(r.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Booking widget */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 sticky top-24">
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-gray-900">{professional.sessionPrice}€</p>
                <p className="text-sm text-gray-400 mt-1">por sesión</p>
              </div>

              {success ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 text-xl">✓</span>
                  </div>
                  <p className="font-semibold text-gray-900">¡Sesión reservada!</p>
                  <p className="text-sm text-gray-500 mt-1">Ve a tu panel para ver los detalles</p>
                  <Link href="/dashboard" className="inline-block mt-4 text-green-600 text-sm font-medium hover:underline">
                    Ver mis sesiones
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleBook} className="flex flex-col gap-4">
                  {error && (
                    <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl">{error}</p>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha y hora</label>
                    <input
                      type="datetime-local"
                      value={bookingDate}
                      onChange={e => setBookingDate(e.target.value)}
                      required
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                    />
                  </div>

                  <div className="flex justify-between py-3 border-t border-gray-50 text-sm">
                    <span className="text-gray-500">Total</span>
                    <span className="font-bold text-gray-900">{professional.sessionPrice}€</span>
                  </div>

                  <button
                    type="submit"
                    disabled={booking}
                    className="w-full py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {booking ? 'Reservando...' : user ? 'Reservar sesión' : 'Iniciar sesión para reservar'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {checkoutSession && (
        <CheckoutModal
          sessionId={checkoutSession.id}
          amount={checkoutSession.amount}
          onClose={() => setCheckoutSession(null)}
          onSuccess={() => { setCheckoutSession(null); setSuccess(true); }}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd fitness-frontend && npx tsc --noEmit --skipLibCheck 2>&1 | grep "professionals/\[id\]" | head -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "fitness-frontend/src/app/(public)/professionals/[id]/page.tsx"
git commit -m "feat(frontend): public profile — type badge, location, reviews section, flat booking price"
```

---

## Task 7: Fix professional dashboard

**Files:**
- Modify: `fitness-frontend/src/app/(protected)/dashboard/professional/page.tsx`

Key changes: replace `trainer.service` imports with `professional.service`, add type/location/approval fields, handle 404 → redirect to `/dashboard/professional/setup`, merge availability save into `updateProfile`.

- [ ] **Step 1: Replace entire professional dashboard page**

```typescript
// fitness-frontend/src/app/(protected)/dashboard/professional/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { getMyProfile, updateProfile } from '@/services/professional.service';
import { getMySessions, updateSessionStatus } from '@/services/session.service';
import SessionCard from '@/components/SessionCard';
import { Save, Plus, Trash2, AlertCircle } from 'lucide-react';
import type { Session } from '@/types/session';
import type { Professional, ProfessionalType, AvailabilitySlot } from '@/types/professional';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_ES: Record<string, string> = {
  Monday: 'Lunes', Tuesday: 'Martes', Wednesday: 'Miércoles',
  Thursday: 'Jueves', Friday: 'Viernes', Saturday: 'Sábado', Sunday: 'Domingo',
};

const TYPE_OPTIONS: { value: ProfessionalType; label: string }[] = [
  { value: 'trainer', label: 'Entrenador Personal' },
  { value: 'nutritionist', label: 'Nutricionista' },
  { value: 'physiotherapist', label: 'Fisioterapeuta' },
];

export default function TrainerDashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [profileData, setProfileData] = useState<Partial<Professional> & { isApproved?: boolean }>({});
  const [profile, setProfile] = useState({
    specialties: [] as string[],
    bio: '',
    sessionPrice: 0,
    professionalType: '' as ProfessionalType | '',
    city: '',
    country: '',
  });
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAvail, setSavingAvail] = useState(false);
  const [tab, setTab] = useState<'sessions' | 'profile' | 'availability'>('sessions');

  useEffect(() => {
    if (!user) return;
    Promise.all([getMyProfile(), getMySessions()])
      .then(([p, s]) => {
        setProfileData(p);
        setProfile({
          specialties: p.specialties || [],
          bio: p.bio || '',
          sessionPrice: p.sessionPrice || 0,
          professionalType: p.professionalType || '',
          city: p.location?.city || '',
          country: p.location?.country || '',
        });
        setAvailability(p.availability || []);
        setSessions(s);
      })
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) router.push('/dashboard/professional/setup');
      })
      .finally(() => setLoading(false));
  }, [user, router]);

  const handleSaveProfile = async () => {
    setSaving(true);
    await updateProfile({
      bio: profile.bio,
      specialties: profile.specialties,
      sessionPrice: profile.sessionPrice,
      professionalType: profile.professionalType as ProfessionalType,
      location: { city: profile.city, country: profile.country },
    }).catch(() => {});
    setSaving(false);
  };

  const handleSaveAvailability = async () => {
    setSavingAvail(true);
    await updateProfile({ availability }).catch(() => {});
    setSavingAvail(false);
  };

  const addSpecialty = () => {
    const s = specialtyInput.trim();
    if (s && !profile.specialties.includes(s)) {
      setProfile(p => ({ ...p, specialties: [...p.specialties, s] }));
      setSpecialtyInput('');
    }
  };

  const removeSpecialty = (s: string) =>
    setProfile(p => ({ ...p, specialties: p.specialties.filter(x => x !== s) }));

  const toggleDay = (day: string) => {
    if (availability.find(a => a.day === day)) {
      setAvailability(a => a.filter(x => x.day !== day));
    } else {
      setAvailability(a => [...a, { day, timeSlots: ['09:00-10:00'] }]);
    }
  };

  const addSlot = (day: string) =>
    setAvailability(a => a.map(x => x.day === day ? { ...x, timeSlots: [...x.timeSlots, '10:00-11:00'] } : x));

  const updateSlot = (day: string, idx: number, val: string) =>
    setAvailability(a => a.map(x => x.day === day ? { ...x, timeSlots: x.timeSlots.map((s, i) => i === idx ? val : s) } : x));

  const removeSlot = (day: string, idx: number) =>
    setAvailability(a => a.map(x => x.day === day ? { ...x, timeSlots: x.timeSlots.filter((_, i) => i !== idx) } : x));

  const handleConfirm = async (id: string) => {
    await updateSessionStatus(id, 'confirmed');
    setSessions(s => s.map(x => x._id === id ? { ...x, status: 'paid' } : x));
  };

  const TABS = [
    { key: 'sessions', label: 'Sesiones' },
    { key: 'profile', label: 'Mi perfil' },
    { key: 'availability', label: 'Disponibilidad' },
  ] as const;

  return (
    <main className="flex-1 bg-gray-50 py-8 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Panel de profesional</h1>
          <p className="text-gray-500 text-sm mt-1">Hola, {user?.firstName}</p>
        </div>

        {profileData.isApproved === false && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-start gap-3">
            <AlertCircle size={18} className="text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">Perfil pendiente de aprobación</p>
              <p className="text-xs text-yellow-700 mt-0.5">Tu perfil está siendo revisado. Aparecerás en los resultados de búsqueda una vez aprobado.</p>
            </div>
          </div>
        )}

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-8 w-fit">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2].map(i => <div key={i} className="h-36 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
          </div>
        ) : (
          <>
            {tab === 'sessions' && (
              <div className="flex flex-col gap-3">
                {sessions.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 text-gray-400">
                    <p className="font-medium">Sin sesiones todavía</p>
                    <p className="text-sm mt-1">Completa tu perfil para aparecer en la búsqueda</p>
                  </div>
                ) : (
                  sessions.map(s => <SessionCard key={s._id} session={s} onConfirm={handleConfirm} />)
                )}
              </div>
            )}

            {tab === 'profile' && (
              <div className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de profesional</label>
                  <div className="grid grid-cols-3 gap-3">
                    {TYPE_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setProfile(p => ({ ...p, professionalType: value }))}
                        className={`py-2.5 px-2 rounded-xl border text-sm font-medium transition-all text-center ${
                          profile.professionalType === value
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Precio por sesión (€)</label>
                  <input
                    type="number"
                    value={profile.sessionPrice}
                    onChange={e => setProfile(p => ({ ...p, sessionPrice: Number(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio (máx. 500 caracteres)</label>
                  <textarea
                    value={profile.bio}
                    onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                    maxLength={500}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-gray-900 resize-none"
                    placeholder="Cuéntanos sobre ti..."
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{profile.bio.length}/500</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Especialidades</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profile.specialties.map(s => (
                      <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-sm rounded-full font-medium">
                        {s}
                        <button onClick={() => removeSpecialty(s)} className="hover:text-red-500 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={specialtyInput}
                      onChange={e => setSpecialtyInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                      placeholder="Añadir especialidad..."
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                    />
                    <button onClick={addSpecialty} className="px-4 py-2.5 border border-gray-200 rounded-xl hover:border-green-500 transition-colors text-gray-600">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Ciudad</label>
                    <input
                      type="text"
                      value={profile.city}
                      onChange={e => setProfile(p => ({ ...p, city: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                      placeholder="Madrid"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">País</label>
                    <input
                      type="text"
                      value={profile.country}
                      onChange={e => setProfile(p => ({ ...p, country: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                      placeholder="España"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save size={16} /> {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            )}

            {tab === 'availability' && (
              <div className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col gap-6">
                <p className="text-sm text-gray-500">Selecciona los días y añade franjas horarias (formato HH:MM-HH:MM)</p>
                {DAYS.map(day => {
                  const slot = availability.find(a => a.day === day);
                  const active = !!slot;
                  return (
                    <div key={day}>
                      <div className="flex items-center gap-3 mb-2">
                        <button
                          onClick={() => toggleDay(day)}
                          className={`w-10 h-6 rounded-full transition-colors relative ${active ? 'bg-green-600' : 'bg-gray-200'}`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </button>
                        <span className={`text-sm font-medium ${active ? 'text-gray-900' : 'text-gray-400'}`}>{DAYS_ES[day]}</span>
                      </div>
                      {active && slot && (
                        <div className="flex flex-col gap-2 ml-12">
                          {slot.timeSlots.map((ts, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={ts}
                                onChange={e => updateSlot(day, i, e.target.value)}
                                placeholder="09:00-10:00"
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 text-gray-900 w-36"
                              />
                              <button onClick={() => removeSlot(day, i)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                          <button onClick={() => addSlot(day)} className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium w-fit">
                            <Plus size={12} /> Añadir franja
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={handleSaveAvailability}
                  disabled={savingAvail}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 mt-2"
                >
                  <Save size={16} /> {savingAvail ? 'Guardando...' : 'Guardar disponibilidad'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd fitness-frontend && npx tsc --noEmit --skipLibCheck 2>&1 | grep "dashboard/professional/page" | head -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "fitness-frontend/src/app/(protected)/dashboard/professional/page.tsx"
git commit -m "feat(frontend): professional dashboard — fix service imports, add type/location/approval banner, 404→setup redirect"
```

---

## Task 8: Professional onboarding setup page

**Files:**
- Create: `fitness-frontend/src/app/(protected)/dashboard/professional/setup/page.tsx`

- [ ] **Step 1: Create setup page**

```typescript
// fitness-frontend/src/app/(protected)/dashboard/professional/setup/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from '@/services/professional.service';
import type { ProfessionalType } from '@/types/professional';

const TYPES: { value: ProfessionalType; label: string; desc: string }[] = [
  { value: 'trainer', label: '💪 Entrenador Personal', desc: 'Fitness, musculación, deporte' },
  { value: 'nutritionist', label: '🥗 Nutricionista', desc: 'Dieta, alimentación, salud' },
  { value: 'physiotherapist', label: '🩺 Fisioterapeuta', desc: 'Rehabilitación, lesiones' },
];

export default function ProfessionalSetupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    professionalType: '' as ProfessionalType | '',
    bio: '',
    specialties: [] as string[],
    specialtyInput: '',
    sessionPrice: '',
    city: '',
    country: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addSpecialty = () => {
    const s = form.specialtyInput.trim();
    if (s && !form.specialties.includes(s)) {
      setForm(f => ({ ...f, specialties: [...f.specialties, s], specialtyInput: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.professionalType) { setError('Selecciona tu tipo de profesional'); return; }
    if (!form.sessionPrice || Number(form.sessionPrice) <= 0) { setError('Introduce un precio válido'); return; }
    setLoading(true);
    setError('');
    try {
      await updateProfile({
        professionalType: form.professionalType as ProfessionalType,
        bio: form.bio,
        specialties: form.specialties,
        sessionPrice: Number(form.sessionPrice),
        location: { city: form.city, country: form.country },
      });
      router.push('/dashboard/professional');
    } catch {
      setError('Error al crear el perfil. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 bg-gray-50 py-8 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Configura tu perfil profesional</h1>
          <p className="text-gray-500 text-sm mt-1">
            Tu perfil será revisado antes de aparecer en los resultados de búsqueda.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col gap-6">
          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de profesional *</label>
            <div className="grid grid-cols-1 gap-3">
              {TYPES.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, professionalType: value }))}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    form.professionalType === value
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className={`font-medium text-sm ${form.professionalType === value ? 'text-green-700' : 'text-gray-900'}`}>{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              maxLength={500}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-gray-900 resize-none"
              placeholder="Cuéntanos tu experiencia y metodología..."
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.bio.length}/500</p>
          </div>

          {/* Especialidades */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Especialidades</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {form.specialties.map(s => (
                <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-sm rounded-full font-medium">
                  {s}
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, specialties: f.specialties.filter(x => x !== s) }))}
                    className="hover:text-red-500 text-lg leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.specialtyInput}
                onChange={e => setForm(f => ({ ...f, specialtyInput: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                placeholder="Ej: Musculación, Yoga..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={addSpecialty}
                className="px-4 py-2.5 border border-gray-200 rounded-xl hover:border-green-500 transition-colors text-gray-600 text-sm"
              >
                Añadir
              </button>
            </div>
          </div>

          {/* Precio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Precio por sesión (€) *</label>
            <input
              type="number"
              value={form.sessionPrice}
              onChange={e => setForm(f => ({ ...f, sessionPrice: e.target.value }))}
              required
              min={1}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              placeholder="50"
            />
          </div>

          {/* Ubicación */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ciudad</label>
              <input
                type="text"
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                placeholder="Madrid"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">País</label>
              <input
                type="text"
                value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                placeholder="España"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-400 transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Creando perfil...' : 'Crear perfil profesional'}
          </button>
        </form>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd fitness-frontend && npx tsc --noEmit --skipLibCheck 2>&1 | grep "setup" | head -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "fitness-frontend/src/app/(protected)/dashboard/professional/setup/"
git commit -m "feat(frontend): add professional onboarding setup page — create initial profile"
```

---

## Task 9: Final verification

- [ ] **Step 1: Delete .next cache and run TypeScript full check**

```bash
rm -rf fitness-frontend/.next
cd fitness-frontend && npx tsc --noEmit --skipLibCheck 2>&1 | grep -v ".next" | head -20
```

Expected: 0 errors.

- [ ] **Step 2: Run lint**

```bash
cd fitness-frontend && npm run lint 2>&1 | tail -5
```

Expected: 0 errors.

- [ ] **Step 3: Run frontend tests**

```bash
cd fitness-frontend && npx vitest run
```

Expected: 3/3 pass.

- [ ] **Step 4: Run backend tests**

```bash
cd fitness-backend && npx vitest run
```

Expected: 30/30 pass.

- [ ] **Step 5: Build**

```bash
cd fitness-frontend && npm run build 2>&1 | tail -20
```

Expected: successful build, all routes compiled including `/dashboard/professional/setup`.

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix(frontend): Phase 3 final verification fixes"
```

---

## Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| Add `availability` to Professional model | 1 |
| Add `availability` to PATCH /me Zod schema | 1 |
| `SearchResult.professionals` key | 2 |
| `ProfessionalType`, `Review`, `location`, `isApproved` types | 2 |
| `professional.service.ts` with correct `/professionals/*` paths | 3 |
| Delete `trainer.service.ts` | 3 |
| Delete `(public)/trainers/` pages | 3 |
| TrainerCard: type badge + location | 4 |
| Search: type/city/rating filters | 5 |
| Search: `data.professionals` | 5 |
| Public profile: type badge, location | 6 |
| Public profile: reviews section | 6 |
| Public profile: flat booking (no duration) | 6 |
| Professional dashboard: fix imports | 7 |
| Professional dashboard: type/location fields | 7 |
| Professional dashboard: `isApproved` banner | 7 |
| Professional dashboard: 404 → setup redirect | 7 |
| Availability saved via PATCH /professionals/me | 7 |
| Onboarding setup page | 8 |
| Build passes, 0 TS errors, lint clean | 9 |
