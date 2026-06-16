import api from './axios';
import type { Project, ProjectStats } from '../types';

export const projectsApi = {
  getAll: () => api.get<Project[]>('/projects').then((r) => r.data),
  getOne: (id: string) => api.get<Project>(`/projects/${id}`).then((r) => r.data),
  create: (data: Partial<Project>) => api.post<Project>('/projects', data).then((r) => r.data),
  update: (id: string, data: Partial<Project>) =>
    api.patch<Project>(`/projects/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/projects/${id}`).then((r) => r.data),
  addMember: (id: string, userId: string, role?: string) =>
    api.post(`/projects/${id}/members`, { userId, role }).then((r) => r.data),
  removeMember: (id: string, memberId: string) =>
    api.delete(`/projects/${id}/members/${memberId}`).then((r) => r.data),
  getStats: (id: string) => api.get<ProjectStats>(`/projects/${id}/stats`).then((r) => r.data),
};
