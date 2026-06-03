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
