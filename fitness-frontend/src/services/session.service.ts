import api from '@/lib/api'
import type { Session, CreateSessionPayload } from '@/types/session'

export const createSession = (payload: CreateSessionPayload): Promise<Session> =>
  api.post('/sessions', payload).then((r) => r.data.data)

export const getMySessions = (): Promise<Session[]> =>
  api.get('/sessions').then((r) => r.data.data)

export const updateSessionStatus = (id: string, status: string): Promise<Session> =>
  api.patch(`/sessions/${id}/status`, { status }).then((r) => r.data.data)
