import api from './axios';

export interface MeetingParticipant {
  user: { id: string; name: string; avatar?: string; email: string };
}

export interface MeetingCreateData {
  title: string;
  content?: string;
  meetingDate?: string;
  startTime?: string;
  endTime?: string;
  attendees?: string;
  location?: string;
  participantIds?: string[];
  projectId?: string;
}

export const meetingsApi = {
  getAll: (params?: { projectId?: string }) =>
    api.get('/meetings', { params }).then((r) => r.data),
  getOne: (id: string) =>
    api.get(`/meetings/${id}`).then((r) => r.data),
  create: (data: MeetingCreateData) =>
    api.post('/meetings', data).then((r) => r.data),
  update: (id: string, data: Partial<MeetingCreateData>) =>
    api.patch(`/meetings/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    api.delete(`/meetings/${id}`).then((r) => r.data),
};
