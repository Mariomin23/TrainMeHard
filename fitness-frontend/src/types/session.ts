// fitness-frontend/src/types/session.ts
export type SessionStatus = 'pending' | 'paid' | 'completed' | 'cancelled' | 'disputed'

export interface Session {
  _id: string
  userId: string
  professionalId: string
  status: SessionStatus
  sessionPrice: number
  platformFee: number
  professionalPayout: number
  stripePaymentIntentId?: string
  scheduledAt?: string
  createdAt: string
}

export interface CreateSessionPayload {
  professionalId: string
  scheduledAt: string
}
