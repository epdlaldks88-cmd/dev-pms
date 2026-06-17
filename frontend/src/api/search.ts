import api from './axios';

export interface SearchTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  projectId: string;
  project: { id: string; name: string; color: string; icon?: string };
}

export interface SearchProject {
  id: string;
  name: string;
  color: string;
  icon?: string;
  status: string;
  _count: { tasks: number };
}

export interface SearchResult {
  tasks: SearchTask[];
  projects: SearchProject[];
}

export const searchApi = {
  search: (q: string) =>
    api.get<SearchResult>('/search', { params: { q } }).then((r) => r.data),
};
