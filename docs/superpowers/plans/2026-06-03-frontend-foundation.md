# Frontend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure fitness-frontend with route groups, shadcn/ui, centralized types, refresh-token auth (token in memory, httpOnly cookie for refresh, tmh_session cookie for middleware), and fix 3 existing bugs (accessToken field, firstName/lastName fields, lowercase roles).

**Architecture:** Hybrid token-in-memory + cookie session indicator. Backend sets httpOnly `refreshToken` cookie on login. Frontend stores `accessToken` in Zustand (memory only). `middleware.ts` reads non-httpOnly `tmh_session=1` cookie for server-side redirect without flash. `(protected)/layout.tsx` calls `POST /auth/refresh` on mount to rehidrate Zustand after page reload.

**Tech Stack:** Next.js 16.2.6, React 19, TypeScript, Tailwind v4, Zustand 5, Axios, shadcn/ui, Vitest, @testing-library/react

---

## File Map

### Created
- `src/types/auth.ts` — User, AuthTokens, LoginPayload, RegisterPayload
- `src/types/professional.ts` — Professional, ProfessionalSearchParams, SearchResult
- `src/types/session.ts` — Session, SessionStatus, PaymentStatus, CreateSessionPayload
- `src/lib/utils.ts` — cn() helper (required by shadcn)
- `src/lib/api.ts` — axios instance + refresh interceptor with queue
- `src/hooks/useAuth.ts` — wrapper over auth store (user, isAuthenticated, isHydrating, logout)
- `src/hooks/useApi.ts` — generic typed fetch hook
- `src/middleware.ts` — reads tmh_session cookie, redirects /dashboard/* if missing
- `src/test/setup.ts` — @testing-library/jest-dom import
- `vitest.config.ts` — vitest config with jsdom + @/ alias
- `src/app/(auth)/layout.tsx` — minimal group wrapper
- `src/app/(auth)/login/page.tsx` — moved + fixed (accessToken, firstName/lastName, cookie)
- `src/app/(auth)/register/page.tsx` — moved + fixed (firstName/lastName split, lowercase role)
- `src/app/(public)/layout.tsx` — wraps with Navbar
- `src/app/(public)/page.tsx` — moved home
- `src/app/(public)/professionals/page.tsx` — moved
- `src/app/(public)/professionals/[id]/page.tsx` — moved + fixed (firstName/lastName, no hydrate)
- `src/app/(public)/trainers/page.tsx` — moved
- `src/app/(public)/trainers/[id]/page.tsx` — moved + fixed (firstName/lastName, no hydrate)
- `src/app/(protected)/layout.tsx` — Navbar + refresh hydration on mount
- `src/app/(protected)/dashboard/page.tsx` — moved + AuthGuard removed
- `src/app/(protected)/dashboard/professional/page.tsx` — moved + AuthGuard removed

### Modified
- `src/app/layout.tsx` — strip Navbar (each group handles it)
- `src/store/auth.store.ts` — rewrite: token in memory, no localStorage, add isHydrating
- `src/services/auth.service.ts` — use lib/api, add logout(), typed with AuthTokens
- `src/services/trainer.service.ts` — update import to lib/api
- `src/services/session.service.ts` — update import to lib/api
- `src/components/Navbar.tsx` — use useAuth hook, firstName instead of name, lowercase roles
- `package.json` — add test scripts

### Deleted
- `src/services/api.ts` — replaced by lib/api.ts
- `src/components/AuthGuard.tsx` — replaced by middleware + (protected) layout
- `src/app/page.tsx` → moved to (public)
- `src/app/login/page.tsx` → moved to (auth)
- `src/app/register/page.tsx` → moved to (auth)
- `src/app/professionals/` → moved to (public)
- `src/app/trainers/` → moved to (public)
- `src/app/dashboard/` → moved to (protected)

---

## Task 1: Install test infrastructure

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Modify: `package.json` (add test scripts)

- [ ] **Step 1: Install vitest and testing-library**

```bash
cd fitness-frontend
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

- [ ] **Step 2: Create vitest.config.ts**

```typescript
// fitness-frontend/vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

- [ ] **Step 3: Create src/test/setup.ts**

```typescript
// fitness-frontend/src/test/setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Add test scripts to package.json**

Open `fitness-frontend/package.json` and add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verify vitest runs (no tests yet — just smoke test)**

```bash
cd fitness-frontend && npx vitest run
```

Expected: "No test files found" or similar — exit 0.

- [ ] **Step 6: Commit**

```bash
git add fitness-frontend/vitest.config.ts fitness-frontend/src/test/setup.ts fitness-frontend/package.json fitness-frontend/package-lock.json
git commit -m "test(frontend): add vitest + testing-library infrastructure"
```

---

## Task 2: Create centralized types

**Files:**
- Create: `src/types/auth.ts`
- Create: `src/types/professional.ts`
- Create: `src/types/session.ts`

- [ ] **Step 1: Create src/types/auth.ts**

```typescript
// fitness-frontend/src/types/auth.ts
export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'user' | 'professional' | 'admin' | 'super_admin'
  avatar?: string
}

export interface AuthTokens {
  accessToken: string
  user: User
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  password: string
  role: 'user' | 'professional'
}
```

- [ ] **Step 2: Create src/types/professional.ts**

```typescript
// fitness-frontend/src/types/professional.ts
export interface ProfessionalUser {
  firstName: string
  lastName: string
  email?: string
  avatar?: string
}

export interface Professional {
  _id: string
  userId: ProfessionalUser
  specialties: string[]
  bio?: string
  hourlyRate: number
  rating: number
  reviewsCount: number
  type?: 'trainer' | 'nutritionist' | 'physiotherapist'
  availability?: { day: string; timeSlots: string[] }[]
}

export interface ProfessionalSearchParams {
  specialty?: string
  minRate?: number
  maxRate?: number
  type?: string
  page?: number
}

export interface SearchResult {
  trainers: Professional[]
  total: number
  page?: number
}
```

- [ ] **Step 3: Create src/types/session.ts**

```typescript
// fitness-frontend/src/types/session.ts
export type SessionStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED'

export interface Session {
  _id: string
  sessionDate: string
  durationMinutes: number
  price: number
  status: SessionStatus
  paymentStatus: PaymentStatus
  trainerId?: { specialties: string[]; hourlyRate: number }
}

export interface CreateSessionPayload {
  trainerId: string
  sessionDate: string
  durationMinutes: number
}
```

- [ ] **Step 4: Verify TypeScript compilation**

```bash
cd fitness-frontend && npx tsc --noEmit
```

Expected: no errors from the new type files.

- [ ] **Step 5: Commit**

```bash
git add fitness-frontend/src/types/
git commit -m "feat(frontend): add centralized types — auth, professional, session"
```

---

## Task 3: Rewrite auth store (token in memory)

**Files:**
- Modify: `src/store/auth.store.ts`
- Create: `src/store/auth.store.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// fitness-frontend/src/store/auth.store.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './auth.store'
import type { User } from '@/types/auth'

const mockUser: User = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  role: 'user',
}

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, isHydrating: false })
  })

  it('setAuth stores token and user in memory only', () => {
    useAuthStore.getState().setAuth('tok123', mockUser)
    expect(useAuthStore.getState().token).toBe('tok123')
    expect(useAuthStore.getState().user).toEqual(mockUser)
    expect(localStorage.getItem('tmh_token')).toBeNull()
  })

  it('logout clears token and user', () => {
    useAuthStore.getState().setAuth('tok123', mockUser)
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('setHydrating updates isHydrating flag', () => {
    useAuthStore.getState().setHydrating(true)
    expect(useAuthStore.getState().isHydrating).toBe(true)
    useAuthStore.getState().setHydrating(false)
    expect(useAuthStore.getState().isHydrating).toBe(false)
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd fitness-frontend && npx vitest run src/store/auth.store.test.ts
```

Expected: FAIL — `setHydrating is not a function` or similar (old store shape).

- [ ] **Step 3: Rewrite src/store/auth.store.ts**

```typescript
// fitness-frontend/src/store/auth.store.ts
'use client'
import { create } from 'zustand'
import type { User } from '@/types/auth'

interface AuthStore {
  user: User | null
  token: string | null
  isHydrating: boolean
  setAuth: (token: string, user: User) => void
  setHydrating: (v: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isHydrating: false,
  setAuth: (token, user) => set({ token, user }),
  setHydrating: (isHydrating) => set({ isHydrating }),
  logout: () => set({ token: null, user: null }),
}))
```

- [ ] **Step 4: Run test — verify it passes**

```bash
cd fitness-frontend && npx vitest run src/store/auth.store.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add fitness-frontend/src/store/auth.store.ts fitness-frontend/src/store/auth.store.test.ts
git commit -m "feat(frontend): rewrite auth store — token in memory, remove localStorage"
```

---

## Task 4: Create lib/utils.ts

**Files:**
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Install clsx and tailwind-merge**

```bash
cd fitness-frontend && npm install clsx tailwind-merge
```

- [ ] **Step 2: Create src/lib/utils.ts**

```typescript
// fitness-frontend/src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd fitness-frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add fitness-frontend/src/lib/utils.ts fitness-frontend/package.json fitness-frontend/package-lock.json
git commit -m "feat(frontend): add lib/utils cn() helper — required by shadcn"
```

---

## Task 5: Create lib/api.ts with refresh interceptor

**Files:**
- Create: `src/lib/api.ts`

The interceptor queues all 401'd requests while a single refresh is in flight, then retries them all. Uses plain `axios.post` (not the `api` instance) for the refresh call to avoid re-triggering the interceptor.

- [ ] **Step 1: Create src/lib/api.ts**

```typescript
// fitness-frontend/src/lib/api.ts
import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/auth.store'

type QueueItem = { resolve: (token: string) => void; reject: (err: unknown) => void }

let isRefreshing = false
let failedQueue: QueueItem[] = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      )
      const { accessToken, user } = data.data
      useAuthStore.getState().setAuth(accessToken, user)
      processQueue(null, accessToken)
      original.headers.Authorization = `Bearer ${accessToken}`
      return api(original)
    } catch (refreshError) {
      processQueue(refreshError, null)
      useAuthStore.getState().logout()
      if (typeof window !== 'undefined') {
        document.cookie = 'tmh_session=; Max-Age=0; path=/'
        window.location.href = '/login'
      }
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd fitness-frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add fitness-frontend/src/lib/api.ts
git commit -m "feat(frontend): add lib/api with axios refresh interceptor and request queue"
```

---

## Task 6: Initialize shadcn/ui

**Files:**
- Created automatically by shadcn CLI in `src/components/ui/`
- Modified automatically: `tsconfig.json`, `next.config.ts`, `globals.css`

- [ ] **Step 1: Run shadcn init**

```bash
cd fitness-frontend && npx shadcn@latest init
```

When prompted, choose:
- Style: **Default**
- Base color: **Neutral**
- CSS variables: **Yes**

shadcn auto-detects Next.js 16 + Tailwind v4. It will update `globals.css` and `tsconfig.json`.

- [ ] **Step 2: Install core components used in Phase 2**

```bash
cd fitness-frontend && npx shadcn@latest add button input label card skeleton badge
```

This generates files in `src/components/ui/`.

- [ ] **Step 3: Verify build still works**

```bash
cd fitness-frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add fitness-frontend/src/components/ui/ fitness-frontend/components.json fitness-frontend/src/app/globals.css fitness-frontend/tsconfig.json fitness-frontend/next.config.ts fitness-frontend/package.json fitness-frontend/package-lock.json
git commit -m "feat(frontend): init shadcn/ui — add button, input, label, card, skeleton, badge"
```

---

## Task 7: Create hooks/useAuth.ts and hooks/useApi.ts

**Files:**
- Create: `src/hooks/useAuth.ts`
- Create: `src/hooks/useApi.ts`
- Create: `src/services/auth.service.ts` (rewrite — adds logout, fixes types)

First, rewrite auth.service.ts so useAuth can call logout:

- [ ] **Step 1: Rewrite src/services/auth.service.ts**

```typescript
// fitness-frontend/src/services/auth.service.ts
import api from '@/lib/api'
import type { AuthTokens, LoginPayload, RegisterPayload, User } from '@/types/auth'

export const login = (payload: LoginPayload): Promise<AuthTokens> =>
  api.post('/auth/login', payload).then((r) => r.data.data)

export const register = (payload: RegisterPayload): Promise<AuthTokens> =>
  api.post('/auth/register', payload).then((r) => r.data.data)

export const logout = (): Promise<void> =>
  api.delete('/auth/logout').then(() => undefined)

export const getMe = (): Promise<User> =>
  api.get('/users/me').then((r) => r.data.data)
```

- [ ] **Step 2: Create src/hooks/useAuth.ts**

```typescript
// fitness-frontend/src/hooks/useAuth.ts
'use client'
import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { logout as logoutService } from '@/services/auth.service'
import type { User } from '@/types/auth'

interface UseAuthReturn {
  user: User | null
  isAuthenticated: boolean
  isHydrating: boolean
  logout: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const { user, token, isHydrating, logout: clearStore } = useAuthStore()
  const router = useRouter()

  const logout = useCallback(async () => {
    try {
      await logoutService()
    } catch {}
    clearStore()
    document.cookie = 'tmh_session=; Max-Age=0; path=/'
    router.push('/')
  }, [clearStore, router])

  return {
    user,
    isAuthenticated: token !== null,
    isHydrating,
    logout,
  }
}
```

- [ ] **Step 3: Create src/hooks/useApi.ts**

```typescript
// fitness-frontend/src/hooks/useApi.ts
'use client'
import { useState, useCallback } from 'react'

interface UseApiState<T> {
  data: T | null
  error: string | null
  loading: boolean
}

interface UseApiReturn<T, A extends unknown[]> extends UseApiState<T> {
  execute: (...args: A) => Promise<T | null>
}

export function useApi<T, A extends unknown[]>(
  fn: (...args: A) => Promise<T>
): UseApiReturn<T, A> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    error: null,
    loading: false,
  })

  const execute = useCallback(
    async (...args: A): Promise<T | null> => {
      setState({ data: null, error: null, loading: true })
      try {
        const data = await fn(...args)
        setState({ data, error: null, loading: false })
        return data
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Error inesperado'
        setState({ data: null, error: msg, loading: false })
        return null
      }
    },
    [fn]
  )

  return { ...state, execute }
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd fitness-frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add fitness-frontend/src/hooks/ fitness-frontend/src/services/auth.service.ts
git commit -m "feat(frontend): add useAuth + useApi hooks, rewrite auth.service with logout"
```

---

## Task 8: Create middleware.ts

**Files:**
- Create: `src/middleware.ts`

Middleware runs on the Edge runtime. It reads `tmh_session` cookie (a plain non-httpOnly cookie set by JS on login). If absent, redirects to `/login`. This prevents the dashboard flash before the client-side `(protected)/layout.tsx` hydration check runs.

- [ ] **Step 1: Create src/middleware.ts**

```typescript
// fitness-frontend/src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('tmh_session')
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd fitness-frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add fitness-frontend/src/middleware.ts
git commit -m "feat(frontend): add middleware — redirect /dashboard/* if tmh_session cookie missing"
```

---

## Task 9: Root layout + (auth) route group

**Files:**
- Modify: `src/app/layout.tsx` — remove Navbar
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx` — copy from login/page.tsx (fixes applied in Task 13)
- Create: `src/app/(auth)/register/page.tsx` — copy from register/page.tsx (fixes applied in Task 13)

- [ ] **Step 1: Strip Navbar from root layout**

Replace the full content of `src/app/layout.tsx` with:

```typescript
// fitness-frontend/src/app/layout.tsx
import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'TrainMeHard — Encuentra tu Entrenador',
  description: 'Marketplace de entrenadores fitness. Busca, compara y contrata en minutos.',
  openGraph: {
    title: 'TrainMeHard — Encuentra tu Entrenador',
    description: 'Marketplace de entrenadores fitness. Busca, compara y contrata en minutos.',
    images: ['https://www.araguaocio.es/wp-content/uploads/2021/02/entrenam-personal.jpg'],
    url: 'https://trainmehard.vercel.app',
    siteName: 'TrainMeHard',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Create (auth) layout**

```typescript
// fitness-frontend/src/app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 3: Copy login/page.tsx into (auth)/login/page.tsx**

Create `src/app/(auth)/login/page.tsx` with the same content as the current `src/app/login/page.tsx`. Do NOT delete the original yet — that happens in Task 14.

Copy the file content exactly — fixes (accessToken, cookie) are applied in Task 13.

- [ ] **Step 4: Copy register/page.tsx into (auth)/register/page.tsx**

Create `src/app/(auth)/register/page.tsx` with the same content as the current `src/app/register/page.tsx`. Do NOT delete the original yet.

Copy the file content exactly.

- [ ] **Step 5: Verify TypeScript**

```bash
cd fitness-frontend && npx tsc --noEmit
```

Expected: no errors (duplicate routes are allowed while both exist during transition).

- [ ] **Step 6: Commit**

```bash
git add fitness-frontend/src/app/layout.tsx fitness-frontend/src/app/\(auth\)/
git commit -m "feat(frontend): strip Navbar from root layout, create (auth) route group"
```

---

## Task 10: (public) route group

**Files:**
- Create: `src/app/(public)/layout.tsx`
- Create: `src/app/(public)/page.tsx`
- Create: `src/app/(public)/professionals/page.tsx`
- Create: `src/app/(public)/professionals/[id]/page.tsx`
- Create: `src/app/(public)/trainers/page.tsx`
- Create: `src/app/(public)/trainers/[id]/page.tsx`

- [ ] **Step 1: Create (public) layout with Navbar**

```typescript
// fitness-frontend/src/app/(public)/layout.tsx
import Navbar from '@/components/Navbar'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}
```

- [ ] **Step 2: Copy page.tsx → (public)/page.tsx**

Create `src/app/(public)/page.tsx` with exact content of `src/app/page.tsx`. Do NOT delete the original yet.

- [ ] **Step 3: Copy professionals/page.tsx**

Create `src/app/(public)/professionals/page.tsx` with exact content of `src/app/professionals/page.tsx`. Do NOT delete the original yet.

- [ ] **Step 4: Copy professionals/[id]/page.tsx**

Create `src/app/(public)/professionals/[id]/page.tsx` with exact content of `src/app/professionals/[id]/page.tsx` — BUT with these fixes:

Replace the interface at top:
```typescript
// Remove this:
interface Professional {
  _id: string;
  specialties: string[];
  bio?: string;
  hourlyRate: number;
  rating: number;
  reviewsCount: number;
  availability: { day: string; timeSlots: string[] }[];
  userId: { name: string; email: string };
}
```
Add at top (after last import):
```typescript
import type { Professional } from '@/types/professional'
```

Replace `const { user, hydrate } = useAuthStore()` with:
```typescript
const { user } = useAuthStore()
```

Remove the line: `useEffect(() => { hydrate(); }, [hydrate]);`

Replace all `professional.userId.name` with:
```typescript
`${professional.userId.firstName} ${professional.userId.lastName}`
```

Replace `professional.userId.name.charAt(0)` with:
```typescript
professional.userId.firstName.charAt(0)
```

- [ ] **Step 5: Copy trainers/page.tsx**

Create `src/app/(public)/trainers/page.tsx` with exact content of `src/app/trainers/page.tsx`. Do NOT delete the original yet.

Remove the inline `TrainerData` interface and add import:
```typescript
import type { Professional } from '@/types/professional'
```
Change `TrainerData[]` → `Professional[]`, `TrainerData` → `Professional`.

- [ ] **Step 6: Copy trainers/[id]/page.tsx**

Create `src/app/(public)/trainers/[id]/page.tsx` with exact content of `src/app/trainers/[id]/page.tsx` — BUT with these fixes:

Remove inline `Trainer` interface, add import:
```typescript
import type { Professional } from '@/types/professional'
```
Change the state: `const [trainer, setTrainer] = useState<Professional | null>(null)`

Replace `const { user, hydrate } = useAuthStore()` with:
```typescript
const { user } = useAuthStore()
```

Remove: `useEffect(() => { hydrate(); }, [hydrate]);`

Replace `trainer.userId.name.charAt(0)` → `trainer.userId.firstName.charAt(0)`
Replace `trainer.userId.name` → `` `${trainer.userId.firstName} ${trainer.userId.lastName}` ``

- [ ] **Step 7: Verify TypeScript**

```bash
cd fitness-frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add fitness-frontend/src/app/\(public\)/
git commit -m "feat(frontend): create (public) route group — home, professionals, trainers"
```

---

## Task 11: (protected) route group

**Files:**
- Create: `src/app/(protected)/layout.tsx`
- Create: `src/app/(protected)/dashboard/page.tsx`
- Create: `src/app/(protected)/dashboard/professional/page.tsx`

The `(protected)/layout.tsx` is client-side. It calls `POST /auth/refresh` on mount using plain `fetch` (not the `api` instance — avoids the interceptor re-triggering refresh). It renders a blank placeholder while `isHydrating` is true.

- [ ] **Step 1: Create (protected)/layout.tsx**

```typescript
// fitness-frontend/src/app/(protected)/layout.tsx
'use client'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'
import Navbar from '@/components/Navbar'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { setAuth, setHydrating, isHydrating } = useAuthStore()

  useEffect(() => {
    setHydrating(true)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => setAuth(data.data.accessToken, data.data.user))
      .catch(() => {
        document.cookie = 'tmh_session=; Max-Age=0; path=/'
        window.location.href = '/login'
      })
      .finally(() => setHydrating(false))
  }, [setAuth, setHydrating])

  return (
    <>
      <Navbar />
      {isHydrating ? <main className="flex-1 bg-gray-50" /> : children}
    </>
  )
}
```

- [ ] **Step 2: Copy dashboard/page.tsx → (protected)/dashboard/page.tsx**

Create `src/app/(protected)/dashboard/page.tsx` with the content of `src/app/dashboard/page.tsx` BUT with these changes:

Remove the `AuthGuard` import and the wrapping `<AuthGuard>` component (middleware handles auth now).

Remove `useEffect(() => { hydrate(); }, [hydrate]);` and `hydrate` from destructuring.

Change `const { user, hydrate } = useAuthStore()` → `const { user } = useAuthStore()`

Replace the return JSX: remove `<AuthGuard>` wrapper, keep `<main ...>` directly:
```typescript
return (
  <main className="flex-1 bg-gray-50 py-8 px-6">
    {/* same content as before */}
  </main>
)
```

Also update the greeting to use `user?.firstName` instead of `user?.name?.split(' ')[0]`:
```typescript
<p className="text-gray-500 text-sm mt-1">Hola, {user?.firstName}</p>
```

- [ ] **Step 3: Copy dashboard/professional/page.tsx → (protected)/dashboard/professional/page.tsx**

Read `src/app/dashboard/professional/page.tsx` first, then create `src/app/(protected)/dashboard/professional/page.tsx` with the same content removing `AuthGuard`, `hydrate`, and fixing `user?.name` → `user?.firstName`.

- [ ] **Step 4: Verify TypeScript**

```bash
cd fitness-frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add fitness-frontend/src/app/\(protected\)/
git commit -m "feat(frontend): create (protected) route group — layout with refresh hydration, dashboard"
```

---

## Task 12: Update Navbar to use useAuth hook

**Files:**
- Modify: `src/components/Navbar.tsx`

The Navbar currently calls `hydrate()` from useAuthStore (which no longer exists) and uses `user.name` (wrong field) and uppercase `'PROFESSIONAL'` (wrong role). Fix all three.

- [ ] **Step 1: Rewrite src/components/Navbar.tsx**

```typescript
// fitness-frontend/src/components/Navbar.tsx
'use client'
import Link from 'next/link'
import { useState } from 'react'
import { LogOut, LayoutDashboard, Menu, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
  }

  const closeMenu = () => setMenuOpen(false)

  const dashboardHref =
    user?.role === 'professional' ? '/dashboard/professional' : '/dashboard'

  const displayName = user ? user.firstName : null

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl font-black tracking-tight" onClick={closeMenu}>
          <span className="text-gray-900">TrainMe</span><span className="text-green-500">Hard</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/professionals" className="hover:text-green-600 transition-colors">
            Encontrar Profesional
          </Link>

          {user ? (
            <>
              <Link
                href={dashboardHref}
                className="flex items-center gap-1.5 hover:text-green-600 transition-colors"
              >
                <LayoutDashboard size={16} />
                {displayName}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors"
              >
                <LogOut size={16} /> Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-green-600 transition-colors">
                Iniciar Sesión
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-400 transition-colors"
              >
                Regístrate
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden text-gray-600 p-1"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 flex flex-col gap-4 text-sm font-medium text-gray-600">
          <Link href="/professionals" className="hover:text-green-600 transition-colors" onClick={closeMenu}>
            Encontrar Profesional
          </Link>

          {user ? (
            <>
              <Link
                href={dashboardHref}
                className="flex items-center gap-1.5 hover:text-green-600 transition-colors"
                onClick={closeMenu}
              >
                <LayoutDashboard size={16} />
                {displayName}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors w-fit"
              >
                <LogOut size={16} /> Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-green-600 transition-colors" onClick={closeMenu}>
                Iniciar Sesión
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-400 transition-colors text-center"
                onClick={closeMenu}
              >
                Regístrate
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd fitness-frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add fitness-frontend/src/components/Navbar.tsx
git commit -m "feat(frontend): update Navbar — use useAuth hook, firstName, lowercase role"
```

---

## Task 13: Fix login and register pages

**Files:**
- Modify: `src/app/(auth)/login/page.tsx` — fix accessToken field + set tmh_session cookie
- Modify: `src/app/(auth)/register/page.tsx` — split name into firstName/lastName, fix accessToken, lowercase roles, set cookie

**Bugs being fixed:**
- `data.token` → `data.accessToken` (backend returns `accessToken`)
- `data.user.role === 'PROFESSIONAL'` → `data.user.role === 'professional'` (backend roles are lowercase)
- Register sends `name` but backend expects `firstName` + `lastName`
- No `tmh_session` cookie was ever set (middleware couldn't protect routes)

- [ ] **Step 1: Rewrite (auth)/login/page.tsx**

```typescript
// fitness-frontend/src/app/(auth)/login/page.tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { login } from '@/services/auth.service'
import type { LoginPayload } from '@/types/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload: LoginPayload = { email, password }
      const data = await login(payload)
      setAuth(data.accessToken, data.user)
      document.cookie = `tmh_session=1; path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
      router.push(data.user.role === 'professional' ? '/dashboard/professional' : '/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16 bg-gray-950">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center text-2xl font-black tracking-tight mb-8">
          <span className="text-white">TrainMe</span><span className="text-green-500">Hard</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Bienvenido de nuevo</h1>
          <p className="text-gray-500 text-sm mb-8">Inicia sesión en tu cuenta</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 bg-gray-50 focus:bg-white"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 bg-gray-50 focus:bg-white"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-400 transition-colors disabled:opacity-50 mt-1"
            >
              {loading ? 'Entrando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-green-600 font-semibold hover:text-green-500 transition-colors">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Rewrite (auth)/register/page.tsx**

The backend expects `{ firstName, lastName, email, password, role }` with lowercase role. Split the UI into two name fields.

```typescript
// fitness-frontend/src/app/(auth)/register/page.tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { register } from '@/services/auth.service'
import type { RegisterPayload } from '@/types/auth'

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterPayload>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'user',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const router = useRouter()

  const set =
    (k: keyof RegisterPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await register(form)
      setAuth(data.accessToken, data.user)
      document.cookie = `tmh_session=1; path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
      router.push(data.user.role === 'professional' ? '/dashboard/professional' : '/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16 bg-gray-950">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center text-2xl font-black tracking-tight mb-8">
          <span className="text-white">TrainMe</span><span className="text-green-500">Hard</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Crea tu cuenta</h1>
          <p className="text-gray-500 text-sm mb-8">Gratis. Sin suscripciones.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={set('firstName')}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 bg-gray-50 focus:bg-white"
                  placeholder="Juan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Apellido</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={set('lastName')}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 bg-gray-50 focus:bg-white"
                  placeholder="García"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 bg-gray-50 focus:bg-white"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
              <input
                type="password"
                value={form.password}
                onChange={set('password')}
                required
                minLength={8}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 bg-gray-50 focus:bg-white"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Soy...</label>
              <div className="grid grid-cols-2 gap-3">
                {(['user', 'professional'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, role: r }))}
                    className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                      form.role === r
                        ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                    }`}
                  >
                    {r === 'user' ? '🏋️ Busco profesional' : '💼 Soy profesional'}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-400 transition-colors disabled:opacity-50 mt-1"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-green-600 font-semibold hover:text-green-500 transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd fitness-frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "fitness-frontend/src/app/(auth)/login/page.tsx" "fitness-frontend/src/app/(auth)/register/page.tsx"
git commit -m "fix(frontend): login/register — use accessToken, firstName/lastName, lowercase roles, set tmh_session cookie"
```

---

## Task 14: Update services + delete obsolete files

**Files:**
- Modify: `src/services/trainer.service.ts`
- Modify: `src/services/session.service.ts`
- Delete: `src/services/api.ts`
- Delete: `src/components/AuthGuard.tsx`
- Delete: `src/app/page.tsx` (moved to (public))
- Delete: `src/app/login/` (moved to (auth))
- Delete: `src/app/register/` (moved to (auth))
- Delete: `src/app/professionals/` (moved to (public))
- Delete: `src/app/trainers/` (moved to (public))
- Delete: `src/app/dashboard/` (moved to (protected))

- [ ] **Step 1: Update trainer.service.ts import**

In `src/services/trainer.service.ts`, change line 1:
```typescript
// Before:
import api from './api';
// After:
import api from '@/lib/api'
```

Also remove the inline `TrainerSearchParams` interface (now in types) and update to use typed import:

```typescript
// fitness-frontend/src/services/trainer.service.ts
import api from '@/lib/api'
import type { Professional, ProfessionalSearchParams, SearchResult } from '@/types/professional'

export const searchTrainers = (params: ProfessionalSearchParams = {}): Promise<SearchResult> =>
  api.get('/trainers', { params }).then((r) => r.data.data)

export const getTrainerById = (id: string): Promise<Professional> =>
  api.get(`/trainers/${id}`).then((r) => r.data.data)

export const getMyTrainerProfile = (): Promise<Professional> =>
  api.get('/trainers/me/profile').then((r) => r.data.data)

export const updateMyProfile = (data: {
  specialties?: string[]
  bio?: string
  hourlyRate?: number
}): Promise<Professional> => api.put('/trainers/me/profile', data).then((r) => r.data.data)

export const updateAvailability = (
  availability: { day: string; timeSlots: string[] }[]
): Promise<void> =>
  api.put('/trainers/me/availability', { availability }).then((r) => r.data.data)
```

- [ ] **Step 2: Update session.service.ts import**

```typescript
// fitness-frontend/src/services/session.service.ts
import api from '@/lib/api'
import type { Session, CreateSessionPayload } from '@/types/session'

export const createSession = (payload: CreateSessionPayload): Promise<Session> =>
  api.post('/sessions', payload).then((r) => r.data.data)

export const getMySessions = (): Promise<Session[]> =>
  api.get('/sessions').then((r) => r.data.data)

export const updateSessionStatus = (id: string, status: string): Promise<Session> =>
  api.patch(`/sessions/${id}/status`, { status }).then((r) => r.data.data)
```

Note: also update callers of `createSession` — the `(public)/professionals/[id]/page.tsx` and `(public)/trainers/[id]/page.tsx` call `createSession(id, date, duration)` (3 args). Change to object payload:
```typescript
// In trainers/[id]/page.tsx and professionals/[id]/page.tsx:
// Before:
const session = await createSession(id, new Date(bookingDate).toISOString(), duration)
// After:
const session = await createSession({ trainerId: id, sessionDate: new Date(bookingDate).toISOString(), durationMinutes: duration })
```

- [ ] **Step 3: Delete obsolete files**

```bash
cd fitness-frontend
rm src/services/api.ts
rm src/components/AuthGuard.tsx
rm src/app/page.tsx
rm -rf src/app/login src/app/register
rm -rf src/app/professionals src/app/trainers
rm -rf src/app/dashboard
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd fitness-frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Run all tests**

```bash
cd fitness-frontend && npx vitest run
```

Expected: 3 tests PASS (auth.store.test.ts).

- [ ] **Step 6: Commit**

```bash
git add -A fitness-frontend/src/services/ fitness-frontend/src/components/AuthGuard.tsx fitness-frontend/src/app/
git commit -m "refactor(frontend): update service imports to lib/api, delete obsolete files (AuthGuard, old routes)"
```

---

## Task 15: Final verification

- [ ] **Step 1: TypeScript full check**

```bash
cd fitness-frontend && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2: Lint**

```bash
cd fitness-frontend && npm run lint
```

Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Build**

```bash
cd fitness-frontend && npm run build
```

Expected: successful build with no errors. All routes compiled.

- [ ] **Step 4: Run tests**

```bash
cd fitness-frontend && npx vitest run
```

Expected: 3 PASS.

- [ ] **Step 5: Manual spot-checks (with dev server)**

```bash
cd fitness-frontend && npm run dev
```

Check in browser:
1. Open DevTools → Application → Local Storage: no `tmh_token` or `tmh_user` entries
2. Visit `http://localhost:3000/dashboard` without being logged in → instant redirect to `/login`
3. Visit `http://localhost:3000/` → home page renders with Navbar ✓
4. Visit `http://localhost:3000/login` → login form renders without Navbar in background ✓
5. Login with valid credentials → redirected to `/dashboard`, Navbar shows firstName

- [ ] **Step 6: Commit if any fixes applied**

```bash
git add -A fitness-frontend/
git commit -m "fix(frontend): Phase 2 final verification fixes"
```

---

## Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| Route groups: (public), (auth), (protected) | 9, 10, 11 |
| shadcn/ui installed, cn() available | 4, 6 |
| hooks/useAuth, hooks/useApi | 7 |
| lib/api with refresh interceptor + queue | 5 |
| middleware.ts — server-side redirect | 8 |
| Token in memory, not localStorage | 3 |
| tmh_session cookie set on login | 13 |
| (protected)/layout rehidrates on mount | 11 |
| Types centralized — no inline interfaces | 2, 10, 11 |
| useAuth used in Navbar | 12 |
| Fix: accessToken field bug | 13 |
| Fix: firstName/lastName bug | 10, 11, 12, 13 |
| Fix: lowercase roles bug | 12, 13 |
| Build TypeScript sin errores | 15 |
