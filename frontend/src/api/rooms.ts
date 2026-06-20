import api from './axios';

export const roomsApi = {
  list: () =>
    api.get('/rooms').then((r) => r.data),
  create: (name: string, memberIds: string[]) =>
    api.post('/rooms', { name, memberIds }).then((r) => r.data),
  messages: (roomId: string) =>
    api.get(`/rooms/${roomId}/messages`).then((r) => r.data),
  send: (roomId: string, content: string) =>
    api.post(`/rooms/${roomId}/messages`, { content }).then((r) => r.data),
  addMember: (roomId: string, userId: string) =>
    api.post(`/rooms/${roomId}/members`, { userId }).then((r) => r.data),
  leave: (roomId: string) =>
    api.delete(`/rooms/${roomId}/members/me`).then((r) => r.data),
};
