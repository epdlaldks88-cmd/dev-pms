import api from './axios';
import type { Issue, IssueRisk, IssueStatus } from '../types';

export const issuesApi = {
  getAll: (projectId: string) =>
    api.get<Issue[]>(`/projects/${projectId}/issues`).then((r) => r.data),
  create: (projectId: string, data: { title: string; description?: string; riskLevel?: IssueRisk; status?: IssueStatus; assigneeId?: string }) =>
    api.post<Issue>(`/projects/${projectId}/issues`, data).then((r) => r.data),
  update: (projectId: string, issueId: string, data: Partial<{ title: string; description: string; riskLevel: IssueRisk; status: IssueStatus; assigneeId: string | null }>) =>
    api.patch<Issue>(`/projects/${projectId}/issues/${issueId}`, data).then((r) => r.data),
  delete: (projectId: string, issueId: string) =>
    api.delete(`/projects/${projectId}/issues/${issueId}`).then((r) => r.data),
};
