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
