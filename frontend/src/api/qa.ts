import api from './axios';

export type QATestStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type QATestResult = 'PASS' | 'FAIL' | 'SKIP';

export interface QATest {
  id: string;
  qaNumber: string;
  srNumber: string;
  title: string;
  content?: string;
  status: QATestStatus;
  result?: QATestResult;
  tester?: string;
  testDate?: string;
  workLogId?: string;
  workLog?: { id: string; taskTitle?: string; srNumber?: string };
  createdAt: string;
  updatedAt: string;
}

export const QA_STATUS_CONFIG: Record<QATestStatus, { label: string; color: string; bg: string }> = {
  PENDING:     { label: '대기',    color: 'text-gray-600',   bg: 'bg-gray-100' },
  IN_PROGRESS: { label: '진행중',  color: 'text-blue-700',   bg: 'bg-blue-50' },
  COMPLETED:   { label: '완료',    color: 'text-emerald-700', bg: 'bg-emerald-50' },
  CANCELLED:   { label: '취소',    color: 'text-red-600',    bg: 'bg-red-50' },
};

export const QA_RESULT_CONFIG: Record<QATestResult, { label: string; color: string }> = {
  PASS: { label: 'PASS', color: 'text-emerald-600' },
  FAIL: { label: 'FAIL', color: 'text-red-600' },
  SKIP: { label: 'SKIP', color: 'text-gray-500' },
};

export const qaApi = {
  getAll: (srNumber?: string) =>
    api.get('/qa', { params: srNumber ? { srNumber } : undefined }).then((r) => r.data as QATest[]),
  getOne: (id: string) =>
    api.get(`/qa/${id}`).then((r) => r.data as QATest),
  create: (data: { srNumber: string; title: string; content?: string; tester?: string; testDate?: string; workLogId?: string }) =>
    api.post('/qa', data).then((r) => r.data as QATest),
  update: (id: string, data: { title?: string; content?: string; status?: QATestStatus; result?: QATestResult; tester?: string; testDate?: string; workLogId?: string }) =>
    api.patch(`/qa/${id}`, data).then((r) => r.data as QATest),
  remove: (id: string) =>
    api.delete(`/qa/${id}`).then((r) => r.data),
};
