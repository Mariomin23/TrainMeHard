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
  sessionPrice?: number
}): Promise<Professional> => api.put('/trainers/me/profile', data).then((r) => r.data.data)

export const updateAvailability = (
  availability: { day: string; timeSlots: string[] }[]
): Promise<void> =>
  api.put('/trainers/me/availability', { availability }).then(() => undefined)
