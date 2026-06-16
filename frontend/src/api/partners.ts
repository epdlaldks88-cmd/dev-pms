import api from './axios';
import type { Partner, Personnel } from '../types';

export const partnersApi = {
  getAll: () => api.get<Partner[]>('/partners').then((r) => r.data),
  getOne: (id: string) => api.get<Partner>(`/partners/${id}`).then((r) => r.data),
  create: (data: Partial<Partner>) => api.post<Partner>('/partners', data).then((r) => r.data),
  update: (id: string, data: Partial<Partner>) =>
    api.patch<Partner>(`/partners/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/partners/${id}`).then((r) => r.data),

  allPersonnel: () => api.get<Personnel[]>('/partners/personnel/all').then((r) => r.data),
  addPersonnel: (partnerId: string, data: Partial<Personnel>) =>
    api.post<Personnel>(`/partners/${partnerId}/personnel`, data).then((r) => r.data),
  updatePersonnel: (personnelId: string, data: Partial<Personnel>) =>
    api.patch<Personnel>(`/partners/personnel/${personnelId}`, data).then((r) => r.data),
  deletePersonnel: (personnelId: string) =>
    api.delete(`/partners/personnel/${personnelId}`).then((r) => r.data),
};
