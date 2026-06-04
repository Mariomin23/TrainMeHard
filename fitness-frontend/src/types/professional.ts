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
  stripeAccountId?: string
}

export interface StripeStatus {
  connected: boolean
  detailsSubmitted: boolean
  chargesEnabled: boolean
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
