import api from './api';

export interface TrainerSearchParams {
  specialty?: string;
  minRate?: number;
  maxRate?: number;
  page?: number;
}

export const searchTrainers = (params: TrainerSearchParams = {}) =>
  api.get('/trainers', { params }).then(r => r.data.data);

export const getTrainerById = (id: string) =>
  api.get(`/trainers/${id}`).then(r => r.data.data);

export const getMyTrainerProfile = () =>
  api.get('/trainers/me/profile').then(r => r.data.data);

export const updateMyProfile = (data: { specialties?: string[]; bio?: string; hourlyRate?: number; sessionPrice?: number }) =>
  api.put('/trainers/me/profile', data).then(r => r.data.data);

export const updateAvailability = (availability: { day: string; timeSlots: string[] }[]) =>
  api.put('/trainers/me/availability', { availability }).then(r => r.data.data);
