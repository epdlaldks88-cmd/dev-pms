import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FolderKanban, CheckCircle2, Clock, AlertCircle,
  TrendingUp, ArrowRight, CalendarDays,
} from 'lucide-react';
import { projectsApi } from '../../api/projects';
import { useAuthStore } from '../../store/auth.store';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { PROJECT_STATUS_CONFIG, formatDate, formatRelativeTime } from '../../lib/utils';
import { cn } from '../../lib/utils';
import type { Project } from '../../types';

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', color)}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const cfg = PROJECT_STATUS_CONFIG[project.status];
  const progress = project._count.tasks > 0 ? Math.round(Math.random() * 100) : 0;

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: project.color + '20' }}>
            <span className="w-full h-full flex items-center justify-center text-base">
              {project.icon ?? '📁'}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900 group-hover:text-indigo-600 transition-colors truncate max-w-40">
              {project.name}
            </h3>
            <span className={cn('text-xs font-medium', cfg.color)}>{cfg.label}</span>
          </div>
        </div>
        <ArrowRight size={14} className="text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0 mt-1" />
      </div>

      {project.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{project.description}</p>
      )}

      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{project._count.tasks} 태스크</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progress}%`, backgroundColor: project.color }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex -space-x-1">
          {project.members.slice(0, 4).map((m) => (
            <Avatar key={m.id} name={m.user.name} avatar={m.user.avatar} size="xs" className="ring-2 ring-white" />
          ))}
          {project.members.length > 4 && (
            <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 text-[10px] font-medium flex items-center justify-center ring-2 ring-white">
              +{project.members.length - 4}
            </div>
          )}
        </div>
        {project.endDate && (
          <span className="text-[11px] text-gray-400">
            {formatDate(project.endDate, 'MM/dd')} 마감
          </span>
        )}
      </div>
    </Link>
  );
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  });

  const activeProjects = projects?.filter((p) => p.status === 'ACTIVE') ?? [];
  const totalTasks = projects?.reduce((sum, p) => sum + p._count.tasks, 0) ?? 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          안녕하세요, {user?.name}님 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">오늘도 팀과 함께 목표를 향해 나아가세요.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FolderKanban} label="전체 프로젝트" value={projects?.length ?? 0} color="bg-indigo-500" />
        <StatCard icon={TrendingUp} label="진행 중 프로젝트" value={activeProjects.length} color="bg-blue-500" />
        <StatCard icon={CheckCircle2} label="전체 태스크" value={totalTasks} color="bg-emerald-500" />
        <StatCard icon={AlertCircle} label="완료된 프로젝트" value={projects?.filter(p => p.status === 'COMPLETED').length ?? 0} color="bg-orange-500" />
      </div>

      {/* Projects Grid */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">내 프로젝트</h2>
          <Link to="/projects" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
            전체보기 <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : projects?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <FolderKanban size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">프로젝트가 없습니다.</p>
            <Link to="/projects" className="text-indigo-600 text-sm font-medium mt-2 inline-block hover:underline">
              첫 프로젝트 만들기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
