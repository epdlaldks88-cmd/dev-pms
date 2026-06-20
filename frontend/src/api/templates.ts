import api from './axios';
import type { Template, TemplateFile } from '../types';

export interface TemplateInput {
  title: string;
  phase: string;
  description?: string;
  content?: string;
}

export const templatesApi = {
  getAll: (phase?: string) =>
    api.get<Template[]>('/templates', { params: phase ? { phase } : undefined }).then((r) => r.data),
  create: (data: TemplateInput) =>
    api.post<Template>('/templates', data).then((r) => r.data),
  update: (id: string, data: Partial<TemplateInput>) =>
    api.patch<Template>(`/templates/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/templates/${id}`).then((r) => r.data),
  uploadFile: (id: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post<TemplateFile>(`/templates/${id}/files`, fd).then((r) => r.data);
  },
  deleteFile: (fileId: string) => api.delete(`/templates/files/${fileId}`).then((r) => r.data),
};
