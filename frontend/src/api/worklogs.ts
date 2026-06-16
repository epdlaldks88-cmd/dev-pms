import api from './axios';

export interface WorkLogCreateData {
  taskId: string;
  userId?: string;
  hours?: number;
  description?: string;
  workDate?: string;
}

export const worklogsApi = {
  getAll: (params?: { userId?: string; projectId?: string }) =>
    api.get('/worklogs', { params }).then((r) => r.data),
  getSummary: () =>
    api.get('/worklogs/summary').then((r) => r.data),
  create: (data: WorkLogCreateData) =>
    api.post('/worklogs', data).then((r) => r.data),
  update: (id: string, data: { hours?: number; description?: string; workDate?: string }) =>
    api.patch(`/worklogs/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    api.delete(`/worklogs/${id}`).then((r) => r.data),
};
