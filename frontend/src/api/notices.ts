import api from './axios';
import type { Notice } from '../types';

export const noticesApi = {
  getAll: (projectId?: string) =>
    api.get<Notice[]>('/notices', { params: projectId ? { projectId } : undefined }).then((r) => r.data),
  create: (data: { title: string; content: string; isPinned?: boolean; projectId: string }) =>
    api.post<Notice>('/notices', data).then((r) => r.data),
  update: (id: string, data: { title?: string; content?: string; isPinned?: boolean }) =>
    api.patch<Notice>(`/notices/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/notices/${id}`).then((r) => r.data),
};
