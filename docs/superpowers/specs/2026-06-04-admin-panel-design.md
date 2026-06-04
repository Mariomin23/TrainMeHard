# Phase 5: Admin Panel — Design

**Date:** 2026-06-04  
**Status:** Done

---

## Scope

Admin dashboard for roles `admin` / `super_admin`. Covers:
- Platform stats overview
- Approve / reject professional profiles
- View all sessions

User and professional dashboards were already complete at the start of this phase.

---

## Backend — `/api/admin/*`

All routes gated by `requireAuth + requireRole('admin', 'super_admin')`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/stats` | totalUsers, totalProfessionals, pendingApprovals, totalSessions, totalRevenue |
| GET | `/admin/professionals?status=all|pending|approved&page=N` | Paginated professional list |
| POST | `/admin/professionals/:id/approve` | Set `isApproved: true` |
| GET | `/admin/sessions?page=N` | All sessions, populated user + professional |

`totalRevenue` = sum of `platformFee` where status in `['paid', 'completed']`.

---

## Frontend — `/dashboard/admin`

Tabs: **Resumen** · **Profesionales** · **Sesiones**

**Resumen:** 5 stat cards (users, professionals, pending, sessions, revenue). Yellow CTA if pending > 0.

**Profesionales:** Filter pills (Pendientes / Aprobados / Todos). Each row shows name, email, type, location, status badge, "Aprobar" button for pending. Paginated.

**Sesiones:** List of all sessions: user → professional name, date, price, status badge. Paginated.

**Access control:** `/dashboard/page.tsx` redirects `admin` / `super_admin` to `/dashboard/admin`. The admin page itself also validates role on mount and redirects non-admins away.
