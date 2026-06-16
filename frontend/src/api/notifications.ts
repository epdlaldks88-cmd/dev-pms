import api from './axios';
import type { Notification } from '../types';

export const notificationsApi = {
  getAll: () => api.get<Notification[]>('/notifications').then((r) => r.data),
  getUnreadCount: () => api.get<{ count: number }>('/notifications/unread-count').then((r) => r.data),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.patch('/notifications/read-all').then((r) => r.data),
};

export const activityApi = {
  getByProject: (projectId: string, limit?: number) =>
    api.get(`/projects/${projectId}/activity`, { params: { limit } }).then((r) => r.data),
  getByTask: (taskId: string) =>
    api.get(`/tasks/${taskId}/activity`).then((r) => r.data),
};

export const stepsApi = {
  getAll: (projectId: string) =>
    api.get(`/projects/${projectId}/steps`).then((r) => r.data),
  create: (projectId: string, data: { name: string; color?: string }) =>
    api.post(`/projects/${projectId}/steps`, data).then((r) => r.data),
  update: (projectId: string, stepId: string, data: any) =>
    api.patch(`/projects/${projectId}/steps/${stepId}`, data).then((r) => r.data),
  reorder: (projectId: string, orders: { id: string; order: number }[]) =>
    api.patch(`/projects/${projectId}/steps/reorder`, { orders }).then((r) => r.data),
  delete: (projectId: string, stepId: string) =>
    api.delete(`/projects/${projectId}/steps/${stepId}`).then((r) => r.data),
};

export const labelsApi = {
  getAll: (projectId: string) =>
    api.get(`/projects/${projectId}/labels`).then((r) => r.data),
  create: (projectId: string, name: string, color: string) =>
    api.post(`/projects/${projectId}/labels`, { name, color }).then((r) => r.data),
  delete: (projectId: string, labelId: string) =>
    api.delete(`/projects/${projectId}/labels/${labelId}`).then((r) => r.data),
};

export const usersApi = {
  getAll: () => api.get('/users').then((r) => r.data),
};
