import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Priority, TaskStatus, ProjectStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, pattern = 'yyyy.MM.dd') {
  return format(new Date(date), pattern, { locale: ko });
}

export function formatRelativeTime(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko });
}

export function formatDueDate(date: string | Date) {
  const d = new Date(date);
  if (isToday(d)) return '오늘';
  if (isTomorrow(d)) return '내일';
  return format(d, 'MM/dd', { locale: ko });
}

export function isDueDateOverdue(date?: string | null) {
  if (!date) return false;
  return isPast(new Date(date)) && new Date(date).toDateString() !== new Date().toDateString();
}

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; dot: string }> = {
  URGENT: { label: '긴급', color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500' },
  HIGH: { label: '높음', color: 'text-orange-600', bg: 'bg-orange-50', dot: 'bg-orange-500' },
  MEDIUM: { label: '중간', color: 'text-yellow-600', bg: 'bg-yellow-50', dot: 'bg-yellow-500' },
  LOW: { label: '낮음', color: 'text-gray-500', bg: 'bg-gray-50', dot: 'bg-gray-400' },
};

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  TODO: { label: '할 일', color: 'text-gray-600', bg: 'bg-gray-100' },
  IN_PROGRESS: { label: '진행 중', color: 'text-blue-600', bg: 'bg-blue-100' },
  IN_REVIEW: { label: '검토 중', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  DONE: { label: '완료', color: 'text-green-600', bg: 'bg-green-100' },
  CANCELLED: { label: '취소', color: 'text-red-600', bg: 'bg-red-100' },
};

export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: '진행 중', color: 'text-green-600', bg: 'bg-green-100' },
  COMPLETED: { label: '완료', color: 'text-blue-600', bg: 'bg-blue-100' },
  ARCHIVED: { label: '보관됨', color: 'text-gray-500', bg: 'bg-gray-100' },
  ON_HOLD: { label: '보류', color: 'text-yellow-600', bg: 'bg-yellow-100' },
};

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}
