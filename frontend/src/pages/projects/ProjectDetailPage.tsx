import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Kanban, BarChart3, List, Settings, Users, Activity,
  ChevronRight, Calendar, CheckSquare,
} from 'lucide-react';
import { projectsApi } from '../../api/projects';
import { activityApi } from '../../api/notifications';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PROJECT_STATUS_CONFIG, formatDate, formatRelativeTime, cn } from '../../lib/utils';
import type { ActivityLog } from '../../types';

const ACTION_LABELS: Record<string, string> = {
  CREATED: '생성했습니다',
  UPDATED: '수정했습니다',
  DELETED: '삭제했습니다',
  ASSIGNED: '담당자를 지정했습니다',
  UNASSIGNED: '담당자를 해제했습니다',
  COMMENTED: '댓글을 작성했습니다',
  UPLOADED: '파일을 업로드했습니다',
  STATUS_CHANGED: '상태를 변경했습니다',
  PRIORITY_CHANGED: '우선순위를 변경했습니다',
  MOVED: '이동했습니다',
};

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getOne(projectId!),
    enabled: !!projectId,
  });

  const { data: stats } = useQuery({
    queryKey: ['project-stats', projectId],
    queryFn: () => projectsApi.getStats(projectId!),
    enabled: !!projectId,
  });

  const { data: activity } = useQuery({
    queryKey: ['activity', projectId],
    queryFn: () => activityApi.getByProject(projectId!, 20),
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-8 bg-gray-100 rounded w-48 animate-pulse mb-4" />
        <div className="h-4 bg-gray-100 rounded w-80 animate-pulse" />
      </div>
    );
  }

  if (!project) return null;

  const cfg = PROJECT_STATUS_CONFIG[project.status];
  const doneCount = stats?.byStatus?.find((s) => s.status === 'DONE')?._count ?? 0;
  const completionRate = stats?.total ? Math.round((doneCount / stats.total) * 100) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-5">
        <Link to="/projects" className="hover:text-gray-700">프로젝트</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium">{project.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: project.color + '20' }}
          >
            {project.icon ?? '📁'}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', cfg.color, cfg.bg)}>
                {cfg.label}
              </span>
            </div>
            {project.description && (
              <p className="text-sm text-gray-500">{project.description}</p>
            )}
            {(project.startDate || project.endDate) && (
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                <Calendar size={12} />
                {project.startDate && formatDate(project.startDate)}
                {project.startDate && project.endDate && ' ~ '}
                {project.endDate && formatDate(project.endDate)}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/projects/${projectId}/kanban`)}
          >
            <Kanban size={14} /> 칸반보드
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/projects/${projectId}/gantt`)}
          >
            <BarChart3 size={14} /> 간트차트
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: '전체 태스크', value: stats?.total ?? 0, color: 'text-gray-900' },
          { label: '완료율', value: `${completionRate}%`, color: 'text-emerald-600' },
          { label: '기한 초과', value: stats?.overdue ?? 0, color: 'text-red-600' },
          { label: '멤버', value: project.members.length, color: 'text-indigo-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm lg:col-span-2">
          <h3 className="font-semibold text-sm text-gray-900 mb-4">상태별 태스크</h3>
          {stats?.byStatus?.length ? (
            <div className="space-y-2.5">
              {stats.byStatus.map((s) => {
                const pct = stats.total ? Math.round((s._count / stats.total) * 100) : 0;
                const statusColors: Record<string, string> = {
                  TODO: 'bg-gray-300',
                  IN_PROGRESS: 'bg-blue-500',
                  IN_REVIEW: 'bg-yellow-500',
                  DONE: 'bg-emerald-500',
                  CANCELLED: 'bg-red-400',
                };
                const statusLabels: Record<string, string> = {
                  TODO: '할 일', IN_PROGRESS: '진행 중', IN_REVIEW: '검토 중',
                  DONE: '완료', CANCELLED: '취소',
                };
                return (
                  <div key={s.status}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{statusLabels[s.status]}</span>
                      <span className="text-gray-500">{s._count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', statusColors[s.status])}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">태스크가 없습니다.</p>
          )}
        </div>

        {/* Members */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-gray-900">팀 멤버</h3>
            <span className="text-xs text-gray-500">{project.members.length}명</span>
          </div>
          <div className="space-y-2.5">
            {project.members.map((m) => (
              <div key={m.id} className="flex items-center gap-2.5">
                <Avatar name={m.user.name} avatar={m.user.avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{m.user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{m.user.email}</p>
                </div>
                <span className="text-[11px] text-gray-400">{m.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      {activity && activity.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-sm text-gray-900 mb-4 flex items-center gap-2">
            <Activity size={16} /> 최근 활동
          </h3>
          <div className="space-y-3">
            {(activity as ActivityLog[]).map((log) => (
              <div key={log.id} className="flex items-start gap-3">
                <Avatar name={log.user.name} avatar={log.user.avatar} size="xs" className="mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium text-gray-900">{log.user.name}</span>
                    {' '}이(가) <span className="font-medium">{log.entityName}</span>을(를) {ACTION_LABELS[log.action] ?? log.action}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{formatRelativeTime(log.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
