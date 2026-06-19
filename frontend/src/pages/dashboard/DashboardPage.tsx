import { useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Clock, CalendarDays, MapPin, Users as UsersIcon,
  X, Calendar, Users, AlertTriangle, ChevronRight,
} from 'lucide-react';
import { projectsApi } from '../../api/projects';
import { worklogsApi } from '../../api/worklogs';
import { meetingsApi } from '../../api/meetings';
import { useAuthStore } from '../../store/auth.store';
import { Avatar } from '../../components/ui/Avatar';
import { formatDate, STATUS_CONFIG } from '../../lib/utils';
import { cn } from '../../lib/utils';
import type { TaskStatus, ProjectStats, Project } from '../../types';

const STATUS_HEX: Record<TaskStatus, string> = {
  TODO: '#9ca3af', IN_PROGRESS: '#3b82f6', IN_REVIEW: '#eab308', DONE: '#22c55e', CANCELLED: '#ef4444',
};
const STATUS_ORDER: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED'];

// 도넛 차트
function StatusDonut({ counts, total }: { counts: Record<TaskStatus, number>; total: number }) {
  const radius = 48, stroke = 14, circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          {total > 0 && STATUS_ORDER.map((s) => {
            const v = counts[s] ?? 0;
            if (!v) return null;
            const dash = (v / total) * circumference;
            const seg = (
              <circle key={s} cx="60" cy="60" r={radius} fill="none"
                stroke={STATUS_HEX[s]} strokeWidth={stroke}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset} transform="rotate(-90 60 60)" />
            );
            offset += dash;
            return seg;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-gray-600">{total}</span>
          <span className="text-[10px] text-gray-400">전체</span>
        </div>
      </div>
      <div className="flex-1 space-y-1.5">
        {STATUS_ORDER.map((s) => {
          const v = counts[s] ?? 0;
          const pct = total > 0 ? Math.round((v / total) * 100) : 0;
          return (
            <div key={s} className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_HEX[s] }} />
              <span className="text-gray-500 flex-1">{STATUS_CONFIG[s].label}</span>
              <span className="font-semibold text-gray-800">{v}</span>
              <span className="text-gray-400 w-8 text-right">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 카드 공통 헤더
function CardHeader({ icon, title, sub, right }: {
  icon: ReactNode; title: string; sub?: ReactNode; right?: ReactNode;
}) {
  return (
    <div className="relative px-4 py-3 bg-gradient-to-r from-gray-100/80 via-gray-50/60 to-white border-b border-gray-100 overflow-hidden">
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-gradient-to-br from-gray-200/40 to-transparent blur-xl pointer-events-none" />
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm shadow-gray-200/60 flex-shrink-0">
            {icon}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-600">{title}</span>
            {sub}
          </div>
        </div>
        {right}
      </div>
    </div>
  );
}

// 프로젝트 카드
function ProjectCard({ project, stats }: { project: Project; stats: ProjectStats | undefined }) {
  const total = stats?.total ?? 0;
  const done = stats?.byStatus.find(b => b.status === 'DONE')?._count ?? 0;
  const inProgress = stats?.byStatus.find(b => b.status === 'IN_PROGRESS')?._count ?? 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <Link to={`/projects/${project.id}`}
      className="relative bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-gray-200 transition-all block group overflow-hidden">
      {/* 우상단 장식 */}
      <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `radial-gradient(circle, ${project.color}18 0%, transparent 70%)` }} />

      {/* 헤더 */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 shadow-sm"
          style={{ background: `linear-gradient(135deg, ${project.color}30, ${project.color}10)`, border: `1px solid ${project.color}20` }}>
          {project.icon ?? '📁'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="font-semibold text-sm text-gray-600 truncate group-hover:text-red-600 transition-colors">
              {project.name}
            </p>
            <ChevronRight size={12} className="text-gray-300 flex-shrink-0 group-hover:text-red-600 transition-colors" />
          </div>
          <span className={cn(
            'text-[11px] font-medium px-1.5 py-0.5 rounded-md border',
            project.status === 'ACTIVE'
              ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-400/5 text-emerald-600 border-emerald-200/50'
              : project.status === 'COMPLETED'
              ? 'bg-gradient-to-r from-gray-200/40 to-gray-100/20 text-gray-400 border-gray-200/40'
              : 'bg-gradient-to-r from-amber-400/15 to-yellow-300/5 text-amber-600 border-amber-200/40'
          )}>
            {project.status === 'ACTIVE' ? '진행 중' : project.status === 'COMPLETED' ? '완료' : project.status}
          </span>
        </div>
      </div>

      {/* 진행률 */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-gray-400">진행률</span>
          <span className="font-bold text-gray-600">{pct}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${project.color}, ${project.color}99)` }} />
        </div>
      </div>

      {/* 태스크 현황 */}
      <div className="flex items-center gap-2 mb-3">
        {stats?.byStatus.filter(b => b._count > 0).slice(0, 4).map(b => (
          <div key={b.status} className="flex items-center gap-1 text-[11px] text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_HEX[b.status] }} />
            {b._count}
          </div>
        ))}
        <span className="text-[11px] text-gray-400 ml-auto">{inProgress}개 진행 중</span>
      </div>

      {/* 멤버 & 기간 */}
      <div className="flex items-center justify-between">
        <div className="flex -space-x-1.5">
          {project.members.slice(0, 4).map(m => (
            <Avatar key={m.id} name={m.user.name} avatar={m.user.avatar} size="xs" className="ring-2 ring-white" />
          ))}
          {project.members.length > 4 && (
            <div className="w-6 h-6 rounded-full bg-gray-100 ring-2 ring-white flex items-center justify-center text-[10px] text-gray-500 font-medium">
              +{project.members.length - 4}
            </div>
          )}
        </div>
        {project.endDate && (
          <span className="text-[11px] text-gray-400 tabular-nums">{formatDate(project.endDate)}</span>
        )}
      </div>
    </Link>
  );
}

// D-day 뱃지 설정
function getDdayConfig(endDate: string, status: string) {
  if (status === 'DONE') return { label: '완료', bg: 'from-emerald-400/20 to-emerald-300/10', text: 'text-emerald-600', border: 'border-emerald-200/50' };
  if (status === 'CANCELLED') return { label: '취소', bg: 'from-gray-300/20 to-gray-200/10', text: 'text-gray-400', border: 'border-gray-200/50' };
  const diff = Math.ceil((new Date(endDate).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000);
  if (diff < 0)  return { label: `D+${Math.abs(diff)}`, bg: 'from-rose-500/25 to-rose-400/10', text: 'text-rose-600', border: 'border-rose-300/40' };
  if (diff === 0) return { label: 'D-day', bg: 'from-orange-400/25 to-amber-300/10', text: 'text-orange-600', border: 'border-orange-300/40' };
  if (diff <= 3)  return { label: `D-${diff}`, bg: 'from-amber-400/20 to-yellow-300/10', text: 'text-amber-600', border: 'border-amber-200/40' };
  if (diff <= 7)  return { label: `D-${diff}`, bg: 'from-blue-400/20 to-primary-300/10', text: 'text-blue-600', border: 'border-blue-200/40' };
  return { label: `D-${diff}`, bg: 'from-gray-300/15 to-gray-200/5', text: 'text-gray-400', border: 'border-gray-200/40' };
}

// 마감 임박 일감 테이블
function DeadlineTable({ taskRows }: { taskRows: any[] }) {
  const rows = taskRows
    .filter(r => r.endDate)
    .sort((a, b) => {
      // 완료/취소는 맨 뒤
      const aDone = a.status === 'DONE' || a.status === 'CANCELLED';
      const bDone = b.status === 'DONE' || b.status === 'CANCELLED';
      if (aDone !== bDone) return aDone ? 1 : -1;
      return +new Date(a.endDate) - +new Date(b.endDate);
    });

  if (rows.length === 0) {
    return (
      <div className="py-14 text-center">
        <p className="text-sm text-gray-300">마감일이 설정된 일감이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            {['일감명', '프로젝트', '상태', '마감일', 'D-day'].map(h => (
              <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-400 tracking-wide uppercase border-b border-gray-100 first:pl-5 last:pr-5 last:text-right">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const dday = getDdayConfig(row.endDate, row.status);
            const isDimmed = row.status === 'DONE' || row.status === 'CANCELLED';
            const isUrgent = !isDimmed && (() => {
              const diff = Math.ceil((new Date(row.endDate).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000);
              return diff <= 0;
            })();

            return (
              <tr key={row.id}
                className={cn(
                  'group relative transition-colors',
                  isDimmed ? 'opacity-40' : 'hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-transparent',
                  isUrgent && 'bg-gradient-to-r from-rose-50/40 to-transparent'
                )}>
                {/* 긴급 좌측 액센트 바 */}
                <td className="pl-5 pr-4 py-3 relative">
                  {isUrgent && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full bg-gradient-to-b from-rose-400 to-rose-300/0" />
                  )}
                  <p className={cn('text-sm font-medium truncate max-w-[220px]', isDimmed ? 'text-gray-400' : 'text-gray-800')}>
                    {row.title}
                  </p>
                  {row.description && (
                    <p className="text-[11px] text-gray-400 truncate max-w-[220px] mt-0.5">{row.description}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-400 truncate max-w-[100px] block">{row.project}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md',
                    row.status === 'DONE' ? 'bg-emerald-50 text-emerald-600' :
                    row.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' :
                    row.status === 'IN_REVIEW' ? 'bg-amber-50 text-amber-600' :
                    row.status === 'CANCELLED' ? 'bg-gray-100 text-gray-400' :
                    'bg-gray-100 text-gray-500'
                  )}>
                    {STATUS_CONFIG[row.status as TaskStatus]?.label ?? row.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-500 tabular-nums">{formatDate(row.endDate)}</span>
                </td>
                <td className="pl-4 pr-5 py-3 text-right">
                  <span className={cn(
                    'inline-flex items-center justify-center min-w-[52px] px-2.5 py-1 rounded-lg text-xs font-bold',
                    'bg-gradient-to-br border backdrop-blur-sm',
                    dday.bg, dday.text, dday.border
                  )}>
                    {dday.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [viewingMeeting, setViewingMeeting] = useState<any>(null);

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  });

  const { data: myWorklogs } = useQuery({
    queryKey: ['worklogs', 'me', user?.id],
    queryFn: () => worklogsApi.getAll({ userId: user!.id }),
    enabled: !!user?.id,
  });

  const { data: meetings } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => meetingsApi.getAll(),
  });

  const statsQueries = useQueries({
    queries: (projects ?? []).map((p) => ({
      queryKey: ['project-stats', p.id],
      queryFn: () => projectsApi.getStats(p.id),
      enabled: !!projects,
    })),
  });

  const statusCounts: Record<TaskStatus, number> = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0, CANCELLED: 0 };
  (projects ?? []).forEach((p, idx) => {
    const stats = statsQueries[idx]?.data as ProjectStats | undefined;
    if (stats) stats.byStatus.forEach((b) => { statusCounts[b.status] += b._count; });
  });
  const totalTasks = STATUS_ORDER.reduce((s, k) => s + statusCounts[k], 0);

  // 이번 주 범위
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const weekLogs = (myWorklogs ?? []).filter((l: any) => {
    const d = new Date(l.startDate ?? l.workDate);
    return d >= weekStart && d < weekEnd;
  });
  const weekHours = weekLogs.reduce((s: number, l: any) => s + (l.hours ?? 0), 0);

  // 다가오는 일정
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcomingMeetings = (meetings ?? [])
    .filter((m: any) => new Date(m.meetingDate) >= today)
    .sort((a: any, b: any) => +new Date(a.meetingDate) - +new Date(b.meetingDate))
    .slice(0, 5);

  // 일감 종료일 그래프 데이터
  const allLogs = myWorklogs ?? [];
  const taskMap = new Map<string, any>();
  allLogs.forEach((l: any) => {
    const taskId = l.taskId ?? l.task?.id ?? l.id;
    const endDate = l.endDate ?? l.task?.dueDate ?? l.task?.endDate ?? null;
    if (!taskMap.has(taskId)) {
      taskMap.set(taskId, {
        id: taskId,
        title: l.taskTitle ?? l.task?.title ?? l.description ?? '일감',
        endDate,
        hours: l.hours ?? 0,
        status: l.task?.status ?? l.status ?? 'TODO',
        project: l.task?.project?.name ?? l.projectName ?? '-',
      });
    } else {
      taskMap.get(taskId).hours += l.hours ?? 0;
    }
  });
  const taskRows = [...taskMap.values()];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-700">안녕하세요, {user?.name}님 👋</h1>
        <p className="text-gray-500 text-sm mt-1">오늘도 팀과 함께 목표를 향해 나아가세요.</p>
      </div>

      {/* 프로젝트 현황 카드 */}
      {(projects ?? []).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">프로젝트 현황</h2>
            <Link to="/projects" className="text-xs text-gray-600 hover:text-red-600 transition-colors">전체 보기 →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(projects ?? []).map((p, idx) => (
              <ProjectCard key={p.id} project={p}
                stats={statsQueries[idx]?.data as ProjectStats | undefined} />
            ))}
          </div>
        </div>
      )}

      {/* 메인 2컬럼 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* 이번 주 일감 */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-full">
          <CardHeader
            icon={<Clock size={12} className="text-white" />}
            title="이번 주 일감"
            sub={
              <>
                <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-primary-500/15 to-primary-400/5 text-gray-600 border border-gray-200/40">{weekLogs.length}건</span>
                <span className="text-[11px] text-gray-400">{weekStart.getMonth() + 1}/{weekStart.getDate()} – {new Date(weekEnd.getTime() - 1).getMonth() + 1}/{new Date(weekEnd.getTime() - 1).getDate()}</span>
              </>
            }
            right={
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-600">{weekHours}h</span>
                <Link to={user?.id ? `/workload?user=${user.id}` : '/workload'}
                  className="text-[11px] text-gray-400 hover:text-red-600 transition-colors">전체 →</Link>
              </div>
            }
          />
          {weekLogs.length === 0 ? (
            <p className="text-xs text-gray-300 py-8 text-center">이번 주 등록된 일감이 없습니다.</p>
          ) : (
            <div className="divide-y divide-gray-50/80">
              {weekLogs.map((l: any) => (
                <div key={l.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-gradient-to-r hover:from-primary-50/40 hover:to-transparent transition-colors group">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: l.task?.status ? STATUS_HEX[l.task.status as TaskStatus] : '#cbd5e1' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 font-medium truncate leading-snug">
                      {l.taskTitle ?? l.task?.title ?? '일감'}
                    </p>
                    {l.description && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{l.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {l.task?.project?.name && (
                      <span className="text-[11px] text-gray-400 hidden sm:block truncate max-w-[80px]">{l.task.project.name}</span>
                    )}
                    <span className="text-[11px] font-semibold text-gray-600 tabular-nums">{l.hours}h</span>
                    <span className="text-[11px] text-gray-300 tabular-nums">{formatDate(l.startDate ?? l.workDate, 'MM/dd')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 우측 컬럼 */}
        <div className="flex flex-col gap-4 h-full">
          {/* 태스크 상태 분포 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <CardHeader
              icon={<span className="w-2.5 h-2.5 rounded-full bg-white/80 block" />}
              title="태스크 상태"
            />
            <div className="p-4">
              {totalTasks === 0 ? (
                <p className="text-xs text-gray-300 py-4 text-center">태스크가 없습니다.</p>
              ) : (
                <StatusDonut counts={statusCounts} total={totalTasks} />
              )}
            </div>
          </div>

          {/* 다가오는 일정 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col flex-1">
            <CardHeader
              icon={<CalendarDays size={12} className="text-white" />}
              title="다가오는 일정"
              right={<Link to="/meeting-calendar" className="text-[11px] text-gray-400 hover:text-red-600 transition-colors">달력 →</Link>}
            />
            {upcomingMeetings.length === 0 ? (
              <p className="text-xs text-gray-300 py-6 text-center">예정된 일정이 없습니다.</p>
            ) : (
              <div className="divide-y divide-gray-50/80">
                {upcomingMeetings.map((m: any) => (
                  <button key={m.id} onClick={() => setViewingMeeting(m)}
                    className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-gradient-to-r hover:from-primary-50/40 hover:to-transparent transition-colors text-left">
                    <div className="flex flex-col items-center w-8 flex-shrink-0 pt-0.5">
                      <span className="text-[10px] text-gray-500 font-medium leading-none">{formatDate(m.meetingDate, 'MM')}월</span>
                      <span className="text-sm font-bold text-gray-600 leading-tight">{formatDate(m.meetingDate, 'dd')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 font-medium truncate leading-snug">{m.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                        {m.startTime && <span className="flex items-center gap-0.5"><Clock size={9} /> {m.startTime}</span>}
                        {m.location && <span className="flex items-center gap-0.5 truncate"><MapPin size={9} /> {m.location}</span>}
                        {m.participants?.length > 0 && <span className="flex items-center gap-0.5"><UsersIcon size={9} /> {m.participants.length}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 마감 임박 일감 */}
      <div className="rounded-xl border border-gray-100 shadow-sm overflow-hidden bg-white">
        {/* 그라데이션 헤더 */}
        <div className="relative px-5 py-4 bg-gradient-to-r from-gray-100/80 via-gray-50/60 to-white border-b border-gray-100 overflow-hidden">
          {/* 배경 장식 원 */}
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-gray-200/40 to-transparent blur-xl pointer-events-none" />
          <div className="absolute right-16 -bottom-4 w-16 h-16 rounded-full bg-gradient-to-br from-gray-200/30 to-transparent blur-lg pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm shadow-gray-300/60">
                <AlertTriangle size={13} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-800">마감 임박 일감</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">마감일 기준 오름차순 · 완료 건 제외</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {taskRows.filter(r => r.endDate && r.status !== 'DONE' && r.status !== 'CANCELLED' && new Date(r.endDate) < new Date()).length > 0 && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500/15 to-rose-400/5 text-rose-600 border border-rose-200/50">
                  초과 {taskRows.filter(r => r.endDate && r.status !== 'DONE' && r.status !== 'CANCELLED' && new Date(r.endDate) < new Date()).length}건
                </span>
              )}
              <span className="text-xs text-gray-400">{taskRows.filter(r => r.endDate).length}건</span>
            </div>
          </div>
        </div>
        <DeadlineTable taskRows={taskRows} />
      </div>

      {/* 일정 상세 모달 */}
      {viewingMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewingMeeting(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 border-b border-red-600 flex-shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-gray-700">{viewingMeeting.title}</h2>
                {viewingMeeting.project && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-50 text-gray-600">
                    {viewingMeeting.project.name}
                  </span>
                )}
              </div>
              <button onClick={() => setViewingMeeting(null)} className="text-white/70 hover:text-white p-1.5"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-wrap items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                {viewingMeeting.meetingDate && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Calendar size={14} className="text-gray-400" />{formatDate(viewingMeeting.meetingDate)}
                  </span>
                )}
                {(viewingMeeting.startTime || viewingMeeting.endTime) && (
                  <span className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock size={14} className="text-gray-400" />
                    {viewingMeeting.startTime ?? '?'}{viewingMeeting.endTime && <> ~ {viewingMeeting.endTime}</>}
                  </span>
                )}
                {viewingMeeting.location && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-600">
                    <MapPin size={14} className="text-gray-400" />{viewingMeeting.location}
                  </span>
                )}
                {viewingMeeting.attendees && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Users size={14} className="text-gray-400" />{viewingMeeting.attendees}
                  </span>
                )}
              </div>
              {viewingMeeting.content ? (
                <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{viewingMeeting.content}</div>
              ) : (
                <p className="text-sm text-gray-400">내용이 없습니다.</p>
              )}
            </div>
            {viewingMeeting.createdBy && (
              <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
                <Avatar name={viewingMeeting.createdBy.name ?? '?'} avatar={viewingMeeting.createdBy.avatar} size="xs" />
                <span className="text-xs text-gray-400">{viewingMeeting.createdBy.name}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
