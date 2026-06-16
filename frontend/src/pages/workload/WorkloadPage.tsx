import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Clock, Briefcase, ChevronDown, ChevronRight, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { worklogsApi } from '../../api/worklogs';
import { projectsApi } from '../../api/projects';
import { tasksApi } from '../../api/tasks';
import { useAuthStore } from '../../store/auth.store';
import { Avatar } from '../../components/ui/Avatar';
import { formatDate } from '../../lib/utils';

interface AddWorkLogForm {
  projectId: string;
  taskId: string;
  userId: string;
  hours: number;
  description: string;
  workDate: string;
}

export function WorkloadPage() {
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const [filterProject, setFilterProject] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<AddWorkLogForm>({
    projectId: '',
    taskId: '',
    userId: currentUser?.id ?? '',
    hours: 1,
    description: '',
    workDate: new Date().toISOString().slice(0, 10),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  });

  const { data: formTasks } = useQuery({
    queryKey: ['tasks', form.projectId],
    queryFn: () => tasksApi.getAll(form.projectId),
    enabled: !!form.projectId,
  });

  const { data: formProject } = useQuery({
    queryKey: ['project', form.projectId],
    queryFn: () => projectsApi.getOne(form.projectId),
    enabled: !!form.projectId,
  });

  const { data: worklogs, isLoading } = useQuery({
    queryKey: ['worklogs', filterProject],
    queryFn: () => worklogsApi.getAll(filterProject ? { projectId: filterProject } : undefined),
  });

  const { data: summary } = useQuery({
    queryKey: ['worklogs-summary'],
    queryFn: worklogsApi.getSummary,
  });

  const createWorklog = useMutation({
    mutationFn: () => worklogsApi.create({
      taskId: form.taskId,
      userId: form.userId,
      hours: form.hours,
      description: form.description,
      workDate: form.workDate,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worklogs'] });
      qc.invalidateQueries({ queryKey: ['worklogs-summary'] });
      setShowAddModal(false);
      setForm({
        projectId: '',
        taskId: '',
        userId: currentUser?.id ?? '',
        hours: 1,
        description: '',
        workDate: new Date().toISOString().slice(0, 10),
      });
      toast.success('일감이 등록되었습니다.');
    },
    onError: () => toast.error('등록에 실패했습니다.'),
  });

  const deleteWorklog = useMutation({
    mutationFn: (id: string) => worklogsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worklogs'] });
      qc.invalidateQueries({ queryKey: ['worklogs-summary'] });
      toast.success('일감이 삭제되었습니다.');
    },
  });

  // 담당자별 그룹핑
  const grouped = worklogs?.reduce((acc: Record<string, any>, log: any) => {
    const uid = log.user.id;
    if (!acc[uid]) acc[uid] = { user: log.user, logs: [] };
    acc[uid].logs.push(log);
    return acc;
  }, {}) ?? {};

  const toggleUser = (uid: string) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-900">워크로드</h1>
          <p className="text-xs text-gray-500 mt-0.5">담당자별 일감 등록 및 공수 현황</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          <Plus size={15} /> 일감 등록
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Summary cards */}
        {summary && summary.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">담당자별 공수 요약</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {summary.map((s: any) => (
                <div key={s.user?.id ?? 'unknown'} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar name={s.user?.name ?? '?'} avatar={s.user?.avatar} size="sm" />
                    <span className="text-sm font-semibold text-gray-800 truncate">{s.user?.name ?? '알 수 없음'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-indigo-600">
                    <Clock size={14} />
                    <span className="text-lg font-bold">{s.totalHours}h</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">총 {s.count}건</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">상세 내역</h2>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">전체 프로젝트</option>
            {projects?.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Grouped logs */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Briefcase size={32} className="mb-3 opacity-40" />
            <p className="text-sm">등록된 일감이 없습니다.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              첫 번째 일감 등록하기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.values(grouped).map((group: any) => {
              const isExpanded = expandedUsers.has(group.user.id);
              const totalHours = group.logs.reduce((sum: number, l: any) => sum + (l.hours ?? 0), 0);
              return (
                <div key={group.user.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggleUser(group.user.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {isExpanded ? <ChevronDown size={15} className="text-gray-400" /> : <ChevronRight size={15} className="text-gray-400" />}
                    <Avatar name={group.user.name} avatar={group.user.avatar} size="sm" />
                    <span className="flex-1 text-sm font-semibold text-gray-800 text-left">{group.user.name}</span>
                    <span className="flex items-center gap-1 text-xs text-indigo-600 font-medium">
                      <Clock size={12} /> {totalHours}h
                    </span>
                    <span className="text-xs text-gray-400 ml-2">{group.logs.length}건</span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {group.logs.map((log: any) => (
                        <div key={log.id} className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 group">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full truncate max-w-[200px]">
                                {log.task?.title ?? '태스크 없음'}
                              </span>
                              {log.task?.project && (
                                <span className="text-[10px] text-gray-400">{log.task.project.name}</span>
                              )}
                            </div>
                            {log.description && (
                              <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{log.description}</p>
                            )}
                            <p className="text-[10px] text-gray-400 mt-1">{formatDate(log.workDate)}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="flex items-center gap-0.5 text-sm font-bold text-gray-700">
                              <Clock size={12} className="text-gray-400" /> {log.hours}h
                            </span>
                            <button
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={() => {
                                if (confirm('일감을 삭제하시겠습니까?')) deleteWorklog.mutate(log.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-0.5 rounded transition-all"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add WorkLog Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-bold text-gray-900">일감 등록</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Project */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">프로젝트 *</label>
                <select
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value, taskId: '', userId: currentUser?.id ?? '' })}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">프로젝트 선택</option>
                  {projects?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Task */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">태스크 *</label>
                <select
                  value={form.taskId}
                  onChange={(e) => setForm({ ...form, taskId: e.target.value })}
                  disabled={!form.projectId}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">{form.projectId ? '태스크 선택' : '먼저 프로젝트를 선택하세요'}</option>
                  {formTasks?.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>

              {/* User */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">담당자</label>
                <select
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  disabled={!form.projectId}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
                >
                  {formProject?.members?.map((m: any) => (
                    <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                  ))}
                </select>
              </div>

              {/* Hours + Date row */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">공수 (시간) *</label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={form.hours}
                    onChange={(e) => setForm({ ...form, hours: parseFloat(e.target.value) || 0 })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">작업일</label>
                  <input
                    type="date"
                    value={form.workDate}
                    onChange={(e) => setForm({ ...form, workDate: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">작업 내용</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="어떤 작업을 했는지 간략히 입력하세요..."
                  rows={3}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={() => createWorklog.mutate()}
                disabled={!form.taskId || form.hours <= 0 || createWorklog.isPending}
                className="px-4 py-2 text-sm bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors cursor-pointer"
              >
                등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
