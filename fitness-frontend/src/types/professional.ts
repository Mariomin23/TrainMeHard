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
