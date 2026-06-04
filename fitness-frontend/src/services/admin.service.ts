import api from '@/lib/api'
import type { Professional } from '@/types/professional'
import type { Session } from '@/types/session'

export interface AdminStats {
  totalUsers: number
  totalProfessionals: number
  pendingApprovals: number
  totalSessions: number
  totalRevenue: number
}

export interface AdminProfessionalsResult {
  professionals: Professional[]
  total: number
  page: number
  totalPages: number
}

export interface AdminSessionsResult {
  sessions: Session[]
  total: number
  page: number
  totalPages: number
}

export const getAdminStats = (): Promise<AdminStats> =>
  api.get('/admin/stats').then((r) => r.data.data)

export const getAdminProfessionals = (params?: { status?: string; page?: number }): Promise<AdminProfessionalsResult> =>
  api.get('/admin/professionals', { params }).then((r) => r.data.data)

export const approveProfessional = (id: string): Promise<Professional> =>
  api.post(`/admin/professionals/${id}/approve`).then((r) => r.data.data.professional)

export const getAdminSessions = (params?: { page?: number }): Promise<AdminSessionsResult> =>
  api.get('/admin/sessions', { params }).then((r) => r.data.data)
