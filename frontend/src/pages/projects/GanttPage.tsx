import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { ChevronRight, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { tasksApi } from '../../api/tasks';
import { projectsApi } from '../../api/projects';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { PriorityBadge } from '../../components/ui/PriorityBadge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Avatar } from '../../components/ui/Avatar';
import { CreateTaskModal } from '../../components/task/CreateTaskModal';
import { TaskDetailModal } from '../../components/task/TaskDetailModal';
import { useUiStore } from '../../store/ui.store';
import { cn, isDueDateOverdue } from '../../lib/utils';
import { addDays, differenceInDays, startOfDay, startOfWeek, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Task } from '../../types';

const COL_W = 40;
const TASK_LIST_W = 320;

function GanttBar({ task, startDate, totalDays }: { task: Task; startDate: Date; totalDays: number }) {
  const openTaskModal = useUiStore((s) => s.openTaskModal);

  if (!task.startDate && !task.dueDate) return null;

  const taskStart = task.startDate ? new Date(task.startDate) : new Date(task.dueDate!);
  const taskEnd = task.dueDate ? new Date(task.dueDate) : new Date(task.startDate!);

  const offsetDays = Math.max(0, differenceInDays(taskStart, startDate));
  const durationDays = Math.max(1, differenceInDays(taskEnd, taskStart) + 1);

  // 타임라인 범위 완전히 벗어난 경우 렌더링 안 함
  if (offsetDays >= totalDays) return null;

  const clampedDuration = Math.min(durationDays, totalDays - offsetDays);
  const leftPct = (offsetDays / totalDays) * 100;
  const widthPct = (clampedDuration / totalDays) * 100;
  const isOverdue = isDueDateOverdue(task.dueDate);

  return (
    <button
      onClick={() => openTaskModal(task.id)}
      className={cn(
        'absolute top-1.5 h-7 rounded-md flex items-center px-2 text-xs font-medium text-white shadow-sm hover:brightness-110 transition-all cursor-pointer truncate',
        isOverdue ? 'bg-red-500' : 'bg-primary-500',
      )}
      style={{
        left: `${leftPct}%`,
        width: `${Math.max(widthPct, 3)}%`,
      }}
      title={task.title}
    >
      {durationDays > 2 && task.title}
    </button>
  );
}

export function GanttPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();

  useEffect(() => {
    if (!projectId) return;
    const token = localStorage.getItem('accessToken');
    const url = `/api/projects/${projectId}/tasks/events${token ? `?token=${token}` : ''}`;
    const es = new EventSource(url);
    es.onmessage = () => {
      qc.invalidateQueries({ queryKey: ['gantt', projectId] });
      qc.invalidateQueries({ queryKey: ['project-stats', projectId] });
    };
    es.onerror = () => {};
    return () => es.close();
  }, [projectId, qc]);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getOne(projectId!),
    enabled: !!projectId,
  });

  const { data: tasks, isLoading, isError, refetch } = useQuery({
    queryKey: ['gantt', projectId],
    queryFn: () => tasksApi.getGantt(projectId!),
    enabled: !!projectId,
  });

  const [ordered, setOrdered] = useState<Task[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  useEffect(() => { if (tasks) setOrdered(tasks); }, [tasks]);

  const reorder = useMutation({
    mutationFn: (taskIds: string[]) => tasksApi.reorderGantt(projectId!, taskIds),
    onError: () => {
      toast.error('순서 저장에 실패했습니다.');
      qc.invalidateQueries({ queryKey: ['gantt', projectId] });
    },
  });

  const handleDrop = () => {
    if (dragIndex === null || overIndex === null || dragIndex === overIndex) {
      setDragIndex(null); setOverIndex(null);
      return;
    }
    const next = [...ordered];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(overIndex, 0, moved);
    setOrdered(next);
    qc.setQueryData(['gantt', projectId], next);
    reorder.mutate(next.map((t) => t.id));
    setDragIndex(null); setOverIndex(null);
  };

  const openTaskModal = useUiStore((s) => s.openTaskModal);

  // 스크롤 컨테이너 크기를 측정해 날짜가 항상 화면을 채우도록 totalDays 보정
  const outerRef = useRef<HTMLDivElement>(null);
  const [visibleWidth, setVisibleWidth] = useState(1200);
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => setVisibleWidth(el.clientWidth));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const today = startOfDay(new Date());
  const timelineStart = project?.startDate ? startOfDay(new Date(project.startDate)) : addDays(today, -7);
  const timelineEnd = project?.endDate ? startOfDay(new Date(project.endDate)) : addDays(today, 60);

  const projectDays = Math.max(differenceInDays(timelineEnd, timelineStart) + 1, 30);
  const minDaysForView = Math.ceil(Math.max(visibleWidth - TASK_LIST_W, 0) / COL_W) + 2;
  const totalDays = Math.max(projectDays, minDaysForView);

  const dateHeaders: Date[] = [];
  for (let i = 0; i < totalDays; i++) dateHeaders.push(addDays(timelineStart, i));

  const weekHeaders: { label: string; span: number }[] = [];
  let currentWeek = '';
  let span = 0;
  dateHeaders.forEach((d, idx) => {
    const weekStart = startOfWeek(d, { weekStartsOn: 1 });
    const week = format(weekStart, 'M월 d일', { locale: ko });
    if (week !== currentWeek) {
      if (currentWeek) weekHeaders.push({ label: currentWeek, span });
      currentWeek = week;
      span = 1;
    } else {
      span++;
    }
    if (idx === dateHeaders.length - 1) weekHeaders.push({ label: currentWeek, span });
  });

  const todayOffset = differenceInDays(today, timelineStart);
  const timelineWidth = totalDays * COL_W;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Link to="/projects" className="hover:text-gray-600">프로젝트</Link>
          <ChevronRight size={14} />
          <Link to={`/projects/${projectId}`} className="hover:text-gray-600">{project?.name}</Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">간트차트</span>
        </div>
      </div>

      {/* 스크롤 컨테이너 하나로 통합 — overflow-x-auto 중첩 제거 */}
      <div ref={outerRef} className="flex-1 overflow-auto">
        {isLoading ? (
          <LoadingSpinner className="py-24" text="간트차트 불러오는 중..." />
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : (
          <div
            className="flex min-h-full"
            style={{ minWidth: TASK_LIST_W + timelineWidth }}
          >
            {/* ── 좌측 태스크 목록 (가로 스크롤 시 고정) ── */}
            <div
              className="flex-shrink-0 sticky left-0 z-20 bg-white border-r border-gray-200"
              style={{ width: TASK_LIST_W }}
            >
              {/* 코너 셀: 가로+세로 모두 고정 */}
              <div className="h-16 border-b border-gray-200 px-4 flex items-end pb-2 sticky top-0 z-10 bg-white">
                <span className="text-xs font-semibold text-gray-500">태스크</span>
              </div>
              {ordered.map((task, idx) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => setDragIndex(idx)}
                  onDragOver={(e) => { e.preventDefault(); if (overIndex !== idx) setOverIndex(idx); }}
                  onDrop={handleDrop}
                  onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                  className={cn(
                    'group flex items-center gap-1.5 px-2 py-2.5 border-b border-gray-100 h-11 hover:bg-gray-50 cursor-pointer transition-colors',
                    dragIndex === idx && 'opacity-40',
                    overIndex === idx && dragIndex !== idx && 'bg-primary-50 border-t-2 border-t-primary-400',
                  )}
                  onClick={() => openTaskModal(task.id)}
                >
                  <span
                    className="flex-shrink-0 text-gray-300 group-hover:text-gray-400 cursor-grab active:cursor-grabbing"
                    onClick={(e) => e.stopPropagation()}
                    title="드래그하여 순서 변경"
                  >
                    <GripVertical size={14} />
                  </span>
                  <StatusBadge status={task.status} />
                  <span className="text-sm text-gray-800 truncate flex-1">{task.title}</span>
                  <div className="flex -space-x-1 flex-shrink-0">
                    {task.assignees.slice(0, 2).map(({ user }) => (
                      <Avatar key={user.id} name={user.name} avatar={user.avatar} size="xs" className="ring-1 ring-white" />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ── 우측 타임라인 ── */}
            <div style={{ width: timelineWidth, flexShrink: 0 }}>
              {/* 주 헤더 (세로 스크롤 시 상단 고정) */}
              <div className="h-8 border-b border-gray-200 flex bg-white sticky top-0 z-10">
                {weekHeaders.map((w, i) => (
                  <div
                    key={i}
                    className="border-r border-gray-200 flex items-center px-2 text-xs font-semibold text-gray-500 flex-shrink-0"
                    style={{ width: w.span * COL_W }}
                  >
                    {w.label}
                  </div>
                ))}
              </div>

              {/* 일 헤더 (세로 스크롤 시 상단 고정) */}
              <div className="h-8 border-b border-gray-200 flex bg-white sticky top-8 z-10">
                {dateHeaders.map((d, i) => {
                  const isToday = format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
                  const isSun = d.getDay() === 0;
                  const isSat = d.getDay() === 6;
                  return (
                    <div
                      key={i}
                      className={cn(
                        'border-r border-gray-100 flex items-center justify-center text-[10px] font-medium flex-shrink-0',
                        isToday ? 'bg-primary-50 text-gray-600' : isSun || isSat ? 'bg-red-50/50 text-red-400' : 'text-gray-400',
                      )}
                      style={{ width: COL_W }}
                    >
                      {format(d, 'd')}
                    </div>
                  );
                })}
              </div>

              {/* 태스크 행 */}
              {ordered.map((task) => (
                <div
                  key={task.id}
                  className="relative h-11 border-b border-gray-100 flex"
                >
                  {/* 날짜 열 배경 */}
                  {dateHeaders.map((d, i) => {
                    const isSun = d.getDay() === 0;
                    const isSat = d.getDay() === 6;
                    return (
                      <div
                        key={i}
                        className={cn(
                          'border-r border-gray-50 flex-shrink-0 h-full',
                          isSun || isSat ? 'bg-gray-50/80' : '',
                        )}
                        style={{ width: COL_W }}
                      />
                    );
                  })}

                  {/* 오늘 선 */}
                  {todayOffset >= 0 && todayOffset < totalDays && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-primary-400 z-10 pointer-events-none"
                      style={{ left: todayOffset * COL_W + COL_W / 2 }}
                    />
                  )}

                  {/* 간트 바 */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="relative h-full pointer-events-auto" style={{ width: timelineWidth }}>
                      <GanttBar task={task} startDate={timelineStart} totalDays={totalDays} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <CreateTaskModal />
      <TaskDetailModal />
    </div>
  );
}
