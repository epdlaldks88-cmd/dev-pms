import { useState, useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Search, Clock, MapPin, Users as UsersIcon,
  X, Calendar, Users, AlertTriangle, ArrowUpRight,
  TrendingUp, FolderKanban, CalendarDays, CheckSquare,
  ChevronRight,
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

type SideTab = 'trending' | 'projects' | 'schedule' | 'tasks';

const SIDE_TABS: { id: SideTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'trending', label: '트렌딩', icon: TrendingUp },
  { id: 'projects', label: '프로젝트', icon: FolderKanban },
  { id: 'schedule', label: '일정', icon: CalendarDays },
  { id: 'tasks', label: '태스크', icon: CheckSquare },
];

// 도넛 차트
function StatusDonut({ counts, total }: { counts: Record<TaskStatus, number>; total: number }) {
  const radius = 40, stroke = 10, circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0">
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
          {total > 0 && STATUS_ORDER.map((s) => {
            const v = counts[s] ?? 0;
            if (!v) return null;
            const dash = (v / total) * circumference;
            const seg = (
              <circle key={s} cx="48" cy="48" r={radius} fill="none"
                stroke={STATUS_HEX[s]} strokeWidth={stroke}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset} transform="rotate(-90 48 48)" opacity="0.9" />
            );
            offset += dash;
            return seg;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-white">{total}</span>
          <span className="text-[9px] text-white/40 font-medium">전체</span>
        </div>
      </div>
      <div className="flex-1 space-y-1.5">
        {STATUS_ORDER.map((s) => {
          const v = counts[s] ?? 0;
          if (!v) return null;
          return (
            <div key={s} className="flex items-center gap-2 text-xs">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_HEX[s] }} />
              <span className="text-white/50 flex-1">{STATUS_CONFIG[s].label}</span>
              <span className="font-bold text-white/80">{v}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 프로젝트 아이콘 카드
function ProjectIconCard({ project }: { project: Project }) {
  return (
    <Link to={`/projects/${project.id}`}
      className="group flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-white/5 transition-all duration-200 cursor-pointer">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg ring-1 ring-white/10 group-hover:ring-white/20 group-hover:scale-110 transition-all duration-200"
        style={{ backgroundColor: `${project.color}22`, border: `1.5px solid ${project.color}40` }}
      >
        {project.icon ?? '📁'}
      </div>
      <span className="text-[11px] text-white/60 group-hover:text-white/90 text-center truncate w-full transition-colors leading-tight">
        {project.name}
      </span>
    </Link>
  );
}

// 상태 스탯 카드
function StatCard({
  label, value, sub, color, icon: Icon,
}: {
  label: string; value: string | number; sub?: string;
  color: string; icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 border border-white/8"
      style={{ background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)` }}
    >
      <div className="absolute top-3 right-3 opacity-30">
        <Icon size={20} className="text-white" />
      </div>
      <p className="text-xs text-white/50 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-[11px] text-white/40 mt-1">{sub}</p>}
    </div>
  );
}

// D-day 배지
function getDdayConfig(endDate: string, status: string) {
  if (status === 'DONE') return { label: '완료', color: '#22c55e' };
  if (status === 'CANCELLED') return { label: '취소', color: '#6b7280' };
  const diff = Math.ceil((new Date(endDate).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000);
  if (diff < 0)  return { label: `D+${Math.abs(diff)}`, color: '#ef4444' };
  if (diff === 0) return { label: 'D-day', color: '#f97316' };
  if (diff <= 3)  return { label: `D-${diff}`, color: '#eab308' };
  if (diff <= 7)  return { label: `D-${diff}`, color: '#3b82f6' };
  return { label: `D-${diff}`, color: '#6b7280' };
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<SideTab>('trending');
  const [search, setSearch] = useState('');
  const [viewingMeeting, setViewingMeeting] = useState<any>(null);

  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: projectsApi.getAll });
  const { data: myWorklogs } = useQuery({
    queryKey: ['worklogs', 'me', user?.id],
    queryFn: () => worklogsApi.getAll({ userId: user!.id }),
    enabled: !!user?.id,
  });
  const { data: meetings } = useQuery({ queryKey: ['meetings'], queryFn: () => meetingsApi.getAll() });

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

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcomingMeetings = useMemo(() =>
    (meetings ?? [])
      .filter((m: any) => new Date(m.meetingDate) >= today)
      .sort((a: any, b: any) => +new Date(a.meetingDate) - +new Date(b.meetingDate))
      .slice(0, 6),
  [meetings]);

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
  const urgentTasks = taskRows.filter(r => r.endDate && r.status !== 'DONE' && r.status !== 'CANCELLED' && new Date(r.endDate) < new Date());

  // 검색 필터
  const filteredProjects = useMemo(() => {
    if (!search.trim()) return projects ?? [];
    const q = search.toLowerCase();
    return (projects ?? []).filter(p => p.name.toLowerCase().includes(q));
  }, [projects, search]);

  // 사이드 패널 콘텐츠
  function SidePanelContent() {
    if (activeTab === 'trending') {
      return (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest px-2 mb-3">진행 중 프로젝트</p>
          {(projects ?? []).filter(p => p.status === 'ACTIVE').slice(0, 6).map((p, idx) => {
            const stats = statsQueries[(projects ?? []).indexOf(p)]?.data as ProjectStats | undefined;
            const total = stats?.total ?? 0;
            const done = stats?.byStatus.find(b => b.status === 'DONE')?._count ?? 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <Link key={p.id} to={`/projects/${p.id}`}
                className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
                <span className="text-base">{p.icon ?? '📁'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/80 truncate group-hover:text-white">{p.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                    </div>
                    <span className="text-[10px] text-white/40 tabular-nums">{pct}%</span>
                  </div>
                </div>
                <span className="text-[9px] text-white/30">#{idx + 1}</span>
              </Link>
            );
          })}
          {urgentTasks.length > 0 && (
            <>
              <p className="text-[11px] font-semibold text-rose-400/60 uppercase tracking-widest px-2 mb-3 mt-5">마감 초과</p>
              {urgentTasks.slice(0, 4).map(t => (
                <div key={t.id} className="flex items-center gap-3 px-2 py-2 rounded-xl bg-rose-500/5">
                  <AlertTriangle size={12} className="text-rose-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-rose-300 truncate">{t.title}</p>
                    <p className="text-[10px] text-rose-400/50">{t.project}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      );
    }

    if (activeTab === 'projects') {
      return (
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest px-2 mb-3">전체 프로젝트</p>
          {(projects ?? []).map((p, idx) => {
            const stats = statsQueries[idx]?.data as ProjectStats | undefined;
            const total = stats?.total ?? 0;
            return (
              <Link key={p.id} to={`/projects/${p.id}`}
                className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors group">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                  style={{ backgroundColor: `${p.color}20` }}>
                  {p.icon ?? '📁'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/80 truncate group-hover:text-white">{p.name}</p>
                  <p className="text-[10px] text-white/30">{total}개 태스크</p>
                </div>
                <span className={cn('text-[9px] font-medium px-1.5 py-0.5 rounded-md',
                  p.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400' :
                  p.status === 'COMPLETED' ? 'bg-gray-500/20 text-gray-400' :
                  'bg-amber-500/15 text-amber-400'
                )}>
                  {p.status === 'ACTIVE' ? '진행' : p.status === 'COMPLETED' ? '완료' : p.status}
                </span>
              </Link>
            );
          })}
        </div>
      );
    }

    if (activeTab === 'schedule') {
      return (
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest px-2 mb-3">다가오는 일정</p>
          {upcomingMeetings.length === 0 && (
            <p className="text-xs text-white/20 px-2 py-4">예정된 일정이 없습니다.</p>
          )}
          {upcomingMeetings.map((m: any) => (
            <button key={m.id} onClick={() => setViewingMeeting(m)}
              className="w-full flex items-start gap-3 px-2 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group">
              <div className="flex flex-col items-center w-8 flex-shrink-0 bg-white/5 rounded-lg py-1">
                <span className="text-[9px] text-white/30">{formatDate(m.meetingDate, 'MM')}월</span>
                <span className="text-sm font-bold text-white/80">{formatDate(m.meetingDate, 'dd')}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/80 truncate group-hover:text-white">{m.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-white/30">
                  {m.startTime && <span className="flex items-center gap-0.5"><Clock size={8} />{m.startTime}</span>}
                  {m.location && <span className="flex items-center gap-0.5 truncate"><MapPin size={8} />{m.location}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      );
    }

    if (activeTab === 'tasks') {
      const sorted = taskRows
        .filter(r => r.endDate)
        .sort((a, b) => {
          const aDone = a.status === 'DONE' || a.status === 'CANCELLED';
          const bDone = b.status === 'DONE' || b.status === 'CANCELLED';
          if (aDone !== bDone) return aDone ? 1 : -1;
          return +new Date(a.endDate) - +new Date(b.endDate);
        })
        .slice(0, 10);
      return (
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest px-2 mb-3">마감 임박 일감</p>
          {sorted.length === 0 && (
            <p className="text-xs text-white/20 px-2 py-4">마감일이 설정된 일감이 없습니다.</p>
          )}
          {sorted.map(t => {
            const dday = getDdayConfig(t.endDate, t.status);
            const isDone = t.status === 'DONE' || t.status === 'CANCELLED';
            return (
              <div key={t.id} className={cn('flex items-center gap-3 px-2 py-2 rounded-xl', isDone && 'opacity-40')}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_HEX[t.status as TaskStatus] }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/80 truncate">{t.title}</p>
                  <p className="text-[10px] text-white/30 truncate">{t.project}</p>
                </div>
                <span className="text-[10px] font-bold tabular-nums" style={{ color: dday.color }}>{dday.label}</span>
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  }

  return (
    <div className="min-h-full bg-gray-950 flex flex-col">
      {/* 배경 그라디언트 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary-600/10 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-violet-600/8 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-blue-600/6 blur-[100px]" />
      </div>

      <div className="relative flex-1 flex flex-col max-w-7xl mx-auto w-full px-6 py-8 gap-8">

        {/* ── 검색바 헤더 ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                안녕하세요, {user?.name}님
              </h1>
              <p className="text-sm text-white/40 mt-0.5">
                {now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
              </p>
            </div>
          </div>

          {/* 검색바 */}
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="프로젝트, 일감, 일정 검색..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-white/20 focus:bg-white/8 transition-all backdrop-blur-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── 스탯 카드 4개 ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="진행 중 프로젝트" value={(projects ?? []).filter(p => p.status === 'ACTIVE').length} sub="개 프로젝트" color="#3b82f6" icon={FolderKanban} />
          <StatCard label="이번 주 일감" value={weekLogs.length} sub={`${weekHours}h 공수`} color="#8b5cf6" icon={CheckSquare} />
          <StatCard label="진행 중 태스크" value={statusCounts['IN_PROGRESS']} sub={`전체 ${totalTasks}건`} color="#22c55e" icon={TrendingUp} />
          <StatCard label="다가오는 일정" value={upcomingMeetings.length} sub="예정된 미팅" color="#f59e0b" icon={CalendarDays} />
        </div>

        {/* ── 메인 레이아웃 (사이드 탭 + 콘텐츠) ── */}
        <div className="flex gap-5 flex-1">

          {/* 좌측 탭 패널 */}
          <div className="w-56 flex-shrink-0 flex flex-col gap-1">
            {/* 탭 */}
            <div className="flex flex-col gap-0.5 mb-3">
              {SIDE_TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                    activeTab === id
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                  )}
                >
                  <Icon size={15} className="flex-shrink-0" />
                  {label}
                </button>
              ))}
            </div>

            {/* 탭 콘텐츠 */}
            <div className="flex-1 overflow-y-auto scrollbar-none">
              <SidePanelContent />
            </div>
          </div>

          {/* 우측 메인 콘텐츠 */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* 프로젝트 아이콘 그리드 */}
            {!search && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest">프로젝트</h2>
                  <Link to="/projects" className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors">
                    전체 보기 <ChevronRight size={12} />
                  </Link>
                </div>
                {(projects ?? []).length === 0 ? (
                  <div className="rounded-2xl border border-white/6 bg-white/3 py-12 text-center">
                    <p className="text-sm text-white/20">프로젝트가 없습니다.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-9 gap-1">
                    {(projects ?? []).map(p => (
                      <ProjectIconCard key={p.id} project={p} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* 검색 결과 */}
            {search && (
              <section>
                <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">
                  "{search}" 검색 결과
                </h2>
                {filteredProjects.length === 0 ? (
                  <p className="text-sm text-white/20">일치하는 프로젝트가 없습니다.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredProjects.map((p, idx) => {
                      const stats = statsQueries[(projects ?? []).indexOf(p)]?.data as ProjectStats | undefined;
                      const total = stats?.total ?? 0;
                      const done = stats?.byStatus.find(b => b.status === 'DONE')?._count ?? 0;
                      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                      return (
                        <Link key={p.id} to={`/projects/${p.id}`}
                          className="flex items-center gap-3 bg-white/5 hover:bg-white/8 border border-white/8 rounded-2xl p-4 transition-all group">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                            style={{ backgroundColor: `${p.color}20` }}>
                            {p.icon ?? '📁'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white/90 truncate">{p.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-0.5 rounded-full bg-white/8">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                              </div>
                              <span className="text-[10px] text-white/30 tabular-nums">{pct}%</span>
                            </div>
                          </div>
                          <ArrowUpRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* 프로젝트 상태 카드 그리드 */}
            {!search && (
              <section>
                <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">프로젝트 현황</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(projects ?? []).slice(0, 6).map((p, idx) => {
                    const stats = statsQueries[idx]?.data as ProjectStats | undefined;
                    const total = stats?.total ?? 0;
                    const done = stats?.byStatus.find(b => b.status === 'DONE')?._count ?? 0;
                    const inProg = stats?.byStatus.find(b => b.status === 'IN_PROGRESS')?._count ?? 0;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                    return (
                      <Link key={p.id} to={`/projects/${p.id}`}
                        className="group relative overflow-hidden bg-white/4 hover:bg-white/7 border border-white/8 hover:border-white/14 rounded-2xl p-4 transition-all duration-200">
                        {/* 컬러 악센트 */}
                        <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                          style={{ backgroundColor: p.color, opacity: 0.6 }} />
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                              style={{ backgroundColor: `${p.color}18` }}>
                              {p.icon ?? '📁'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white/90 truncate max-w-[120px] group-hover:text-white">{p.name}</p>
                              <span className={cn('text-[10px] font-medium',
                                p.status === 'ACTIVE' ? 'text-emerald-400' :
                                p.status === 'COMPLETED' ? 'text-gray-500' : 'text-amber-400'
                              )}>
                                {p.status === 'ACTIVE' ? '● 진행 중' : p.status === 'COMPLETED' ? '완료' : p.status}
                              </span>
                            </div>
                          </div>
                          <ArrowUpRight size={13} className="text-white/15 group-hover:text-white/40 transition-colors mt-0.5" />
                        </div>
                        <div className="mb-3">
                          <div className="flex justify-between text-[11px] mb-1.5">
                            <span className="text-white/30">완료율</span>
                            <span className="font-bold text-white/60">{pct}%</span>
                          </div>
                          <div className="h-1 bg-white/6 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, backgroundColor: p.color }} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex -space-x-1">
                            {p.members.slice(0, 3).map(m => (
                              <Avatar key={m.id} name={m.user.name} avatar={m.user.avatar} size="xs"
                                className="ring-1 ring-gray-900" />
                            ))}
                            {p.members.length > 3 && (
                              <div className="w-5 h-5 rounded-full bg-white/10 ring-1 ring-gray-900 flex items-center justify-center text-[9px] text-white/50">
                                +{p.members.length - 3}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-white/30">{inProg}건 진행 중</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 하단 2컬럼: 태스크 현황 + 이번 주 일감 */}
            {!search && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 태스크 현황 도넛 */}
                <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">태스크 현황</h3>
                  {totalTasks === 0 ? (
                    <p className="text-xs text-white/20 text-center py-8">태스크가 없습니다.</p>
                  ) : (
                    <StatusDonut counts={statusCounts} total={totalTasks} />
                  )}
                </div>

                {/* 이번 주 일감 */}
                <div className="bg-white/4 border border-white/8 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest">이번 주 일감</h3>
                    <Link to={user?.id ? `/workload?user=${user.id}` : '/workload'}
                      className="flex items-center gap-0.5 text-xs text-white/25 hover:text-white/50 transition-colors">
                      전체 <ArrowUpRight size={10} />
                    </Link>
                  </div>
                  {weekLogs.length === 0 ? (
                    <p className="text-xs text-white/20 text-center py-8">이번 주 일감이 없습니다.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-none">
                      {weekLogs.map((l: any) => (
                        <div key={l.id} className="flex items-center gap-3">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: l.task?.status ? STATUS_HEX[l.task.status as TaskStatus] : '#cbd5e1' }} />
                          <p className="text-xs text-white/70 truncate flex-1">{l.taskTitle ?? l.task?.title ?? '일감'}</p>
                          <span className="text-[10px] text-white/35 tabular-nums flex-shrink-0">{l.hours}h</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 일정 상세 모달 */}
      {viewingMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewingMeeting(null)} />
          <div className="relative bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <h2 className="text-base font-bold text-white">{viewingMeeting.title}</h2>
              <button onClick={() => setViewingMeeting(null)} className="text-white/30 hover:text-white/70 transition-colors p-1">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-wrap items-center gap-3 mb-5 pb-4 border-b border-white/8">
                {viewingMeeting.meetingDate && (
                  <span className="flex items-center gap-1.5 text-sm text-white/60">
                    <Calendar size={13} className="text-white/30" />{formatDate(viewingMeeting.meetingDate)}
                  </span>
                )}
                {(viewingMeeting.startTime || viewingMeeting.endTime) && (
                  <span className="flex items-center gap-1 text-sm text-white/60">
                    <Clock size={13} className="text-white/30" />
                    {viewingMeeting.startTime ?? '?'}{viewingMeeting.endTime && <> ~ {viewingMeeting.endTime}</>}
                  </span>
                )}
                {viewingMeeting.location && (
                  <span className="flex items-center gap-1.5 text-sm text-white/60">
                    <MapPin size={13} className="text-white/30" />{viewingMeeting.location}
                  </span>
                )}
                {viewingMeeting.attendees && (
                  <span className="flex items-center gap-1.5 text-sm text-white/60">
                    <Users size={13} className="text-white/30" />{viewingMeeting.attendees}
                  </span>
                )}
              </div>
              {viewingMeeting.content ? (
                <div className="text-sm text-white/60 whitespace-pre-wrap leading-relaxed">{viewingMeeting.content}</div>
              ) : (
                <p className="text-sm text-white/25">내용이 없습니다.</p>
              )}
            </div>
            {viewingMeeting.createdBy && (
              <div className="px-6 py-3 border-t border-white/8 flex items-center gap-2">
                <Avatar name={viewingMeeting.createdBy.name ?? '?'} avatar={viewingMeeting.createdBy.avatar} size="xs" />
                <span className="text-xs text-white/30">{viewingMeeting.createdBy.name}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
