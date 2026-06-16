import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X, Calendar, MessageSquare, Paperclip,
  Send, Trash2, Clock,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { tasksApi, commentsApi, attachmentsApi } from '../../api/tasks';
import { activityApi, stepsApi } from '../../api/notifications';
import { projectsApi } from '../../api/projects';
import { useUiStore } from '../../store/ui.store';
import { useAuthStore } from '../../store/auth.store';
import { Avatar } from '../ui/Avatar';
import { PriorityBadge } from '../ui/PriorityBadge';
import { StatusBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';
import { formatDate, formatRelativeTime, formatFileSize, cn, STATUS_CONFIG, PRIORITY_CONFIG } from '../../lib/utils';
import type { TaskStatus, Priority, Comment } from '../../types';

export function TaskDetailModal() {
  const qc = useQueryClient();
  const { taskModalOpen, taskModalId, closeTaskModal } = useUiStore();
  const user = useAuthStore((s) => s.user);
  const [comment, setComment] = useState('');
  const [editingStatus, setEditingStatus] = useState(false);
  const [editingPriority, setEditingPriority] = useState(false);

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', taskModalId],
    queryFn: () => tasksApi.getById(taskModalId!),
    enabled: !!taskModalId && taskModalOpen,
  });

  const { data: steps } = useQuery({
    queryKey: ['steps', task?.projectId],
    queryFn: () => stepsApi.getAll(task!.projectId),
    enabled: !!task?.projectId,
  });

  // 상태를 바꾸면 같은 이름의 단계로 카드도 이동시킨다 (칸반 컬럼 동기화)
  const handleStatusChange = (status: string) => {
    const label = STATUS_CONFIG[status as TaskStatus]?.label;
    const matchedStep = steps?.find((s: any) => s.name === label);
    updateTask.mutate(matchedStep ? { status, stepId: matchedStep.id } : { status });
  };

  const updateTask = useMutation({
    mutationFn: (data: any) => tasksApi.update(task!.projectId, taskModalId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', taskModalId] });
      qc.invalidateQueries({ queryKey: ['kanban', task!.projectId] });
      qc.invalidateQueries({ queryKey: ['gantt', task!.projectId] });
      qc.invalidateQueries({ queryKey: ['tasks', task!.projectId] });
      qc.invalidateQueries({ queryKey: ['project-stats', task!.projectId] });
      setEditingStatus(false);
      setEditingPriority(false);
      toast.success('변경사항이 저장되었습니다.');
    },
    onError: () => toast.error('저장에 실패했습니다.'),
  });

  const addComment = useMutation({
    mutationFn: () => commentsApi.create(taskModalId!, comment.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', taskModalId] });
      setComment('');
      toast.success('댓글이 작성되었습니다.');
    },
  });

  const deleteComment = useMutation({
    mutationFn: (commentId: string) => commentsApi.delete(taskModalId!, commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task', taskModalId] }),
  });

  const uploadFile = useMutation({
    mutationFn: (file: File) => attachmentsApi.upload(taskModalId!, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', taskModalId] });
      toast.success('파일이 업로드되었습니다.');
    },
  });

  const deleteAttachment = useMutation({
    mutationFn: (attachmentId: string) => attachmentsApi.delete(taskModalId!, attachmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task', taskModalId] }),
  });

  const { data: project } = useQuery({
    queryKey: ['project', task?.projectId],
    queryFn: () => projectsApi.getOne(task!.projectId),
    enabled: !!task?.projectId,
  });

  const canDeleteTask = task && (
    task.createdBy.id === user?.id ||
    project?.members.find((m) => m.user.id === user?.id)?.role === 'OWNER'
  );

  const deleteTask = useMutation({
    mutationFn: () => tasksApi.delete(task!.projectId, taskModalId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kanban', task!.projectId] });
      qc.invalidateQueries({ queryKey: ['project-stats', task!.projectId] });
      closeTaskModal();
      toast.success('태스크가 삭제되었습니다.');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? '삭제에 실패했습니다.'),
  });

  if (!taskModalOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeTaskModal} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex overflow-hidden">

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              {task && <StatusBadge status={task.status} />}
              {task && <PriorityBadge priority={task.priority} />}
            </div>
            <button onClick={closeTaskModal} className="text-gray-400 hover:text-gray-600 p-1">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading || !task ? (
              <div className="p-6 space-y-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />)}
              </div>
            ) : (
              <div className="p-6">
                <h1 className="text-xl font-bold text-gray-900 mb-3 leading-snug">{task.title}</h1>

                {task.description && (
                  <p className="text-sm text-gray-600 mb-5 whitespace-pre-wrap leading-relaxed">{task.description}</p>
                )}

                {/* Sub-tasks */}
                {task.subTasks && task.subTasks.length > 0 && (
                  <div className="mb-5">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">하위 태스크</h3>
                    <div className="space-y-1.5">
                      {task.subTasks.map((sub: any) => (
                        <div key={sub.id} className="flex items-center gap-2 py-1.5 px-3 bg-gray-50 rounded-lg">
                          <div className={cn('w-3 h-3 rounded-full border-2', sub.status === 'DONE' ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300')} />
                          <span className={cn('text-sm', sub.status === 'DONE' && 'line-through text-gray-400')}>{sub.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {task.attachments && task.attachments.length > 0 && (
                  <div className="mb-5">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">첨부파일</h3>
                    <div className="space-y-1.5">
                      {task.attachments.map((att: any) => (
                        <div key={att.id} className="flex items-center gap-2 p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 group">
                          <Paperclip size={14} className="text-gray-400 flex-shrink-0" />
                          <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm text-indigo-600 hover:underline truncate">
                            {att.originalName}
                          </a>
                          <span className="text-xs text-gray-400">{formatFileSize(att.size)}</span>
                          <button
                            onClick={() => deleteAttachment.mutate(att.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* File Upload */}
                <div className="mb-5">
                  <label className="flex items-center gap-2 text-xs text-indigo-600 cursor-pointer hover:text-indigo-800 w-fit">
                    <Paperclip size={14} />
                    파일 첨부
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && uploadFile.mutate(e.target.files[0])}
                    />
                  </label>
                </div>

                {/* Comments */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    댓글 {task.comments?.length ? `(${task.comments.length})` : ''}
                  </h3>
                  <div className="space-y-4">
                    {task.comments?.length ? task.comments.map((c: Comment) => (
                      <div key={c.id} className="flex gap-3 group">
                        <Avatar name={c.author.name} avatar={c.author.avatar} size="sm" className="flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900">{c.author.name}</span>
                            <span className="text-xs text-gray-400">{formatRelativeTime(c.createdAt)}</span>
                          </div>
                          <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-700 whitespace-pre-wrap">
                            {c.content}
                          </div>
                          {c.author.id === user?.id && (
                            <button
                              onClick={() => deleteComment.mutate(c.id)}
                              className="text-[11px] text-gray-400 hover:text-red-500 mt-1 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-gray-400">아직 댓글이 없습니다.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Comment Input (하단 고정) */}
          {task && (
            <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-white">
              <div className="flex gap-3 items-start">
                <Avatar name={user?.name ?? ''} avatar={user?.avatar} size="sm" className="flex-shrink-0 mt-1" />
                <div className="flex-1 rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent overflow-hidden">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="댓글을 작성하세요..."
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && comment.trim()) {
                        e.preventDefault();
                        addComment.mutate();
                      }
                    }}
                    className="w-full px-3 py-2 text-sm focus:outline-none resize-none block"
                  />
                  <div className="flex items-center justify-between px-2 py-1.5 border-t border-gray-100 bg-gray-50/50">
                    <span className="text-[11px] text-gray-400">Ctrl+Enter로 전송</span>
                    <button
                      onClick={() => comment.trim() && addComment.mutate()}
                      disabled={!comment.trim() || addComment.isPending}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <Send size={12} /> 전송
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {task && (
          <div className="w-56 border-l border-gray-200 bg-gray-50/50 flex flex-col overflow-y-auto flex-shrink-0">
            <div className="p-4 space-y-4">
              {/* Step (칸반 컬럼) */}
              {steps && steps.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">단계 (칸반 컬럼)</p>
                  <select
                    value={task.stepId ?? ''}
                    onChange={(e) => updateTask.mutate({ stepId: e.target.value })}
                    className="w-full text-xs rounded-lg border border-gray-200 px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {steps.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status */}
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">상태</p>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full text-xs rounded-lg border border-gray-200 px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">우선순위</p>
                <select
                  value={task.priority}
                  onChange={(e) => updateTask.mutate({ priority: e.target.value })}
                  className="w-full text-xs rounded-lg border border-gray-200 px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>

              {/* Assignees */}
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">담당자</p>
                {task.assignees.length === 0 ? (
                  <p className="text-xs text-gray-400">없음</p>
                ) : (
                  <div className="space-y-1.5">
                    {task.assignees.map(({ user: u }: any) => (
                      <div key={u.id} className="flex items-center gap-1.5">
                        <Avatar name={u.name} avatar={u.avatar} size="xs" />
                        <span className="text-xs text-gray-700">{u.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Partner Personnel */}
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">파트너사 인력</p>
                {!task.personnel?.length ? (
                  <p className="text-xs text-gray-400">없음</p>
                ) : (
                  <div className="space-y-1.5">
                    {task.personnel.map(({ personnel: p }: any) => (
                      <div key={p.id} className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-[9px] font-semibold text-emerald-700">{p.name[0]}</span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs text-gray-700">{p.name}</span>
                          <span className="text-[10px] text-gray-400 ml-1">{p.partner?.name}{p.position ? ` · ${p.position}` : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dates */}
              {(task.startDate || task.dueDate) && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">날짜</p>
                  <div className="space-y-1">
                    {task.startDate && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Calendar size={11} className="text-gray-400" />
                        시작: {formatDate(task.startDate)}
                      </div>
                    )}
                    {task.dueDate && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Clock size={11} className="text-gray-400" />
                        마감: {formatDate(task.dueDate)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Labels */}
              {task.labels.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">레이블</p>
                  <div className="flex flex-wrap gap-1">
                    {task.labels.map(({ label }: any) => (
                      <span
                        key={label.id}
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: label.color + '20', color: label.color }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta */}
              <div className="pt-2 border-t border-gray-200">
                <p className="text-[11px] text-gray-400">
                  생성: {formatRelativeTime(task.createdAt)}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Avatar name={task.createdBy.name} avatar={task.createdBy.avatar} size="xs" />
                  <p className="text-[11px] text-gray-400">{task.createdBy.name}</p>
                </div>
              </div>

              {/* Delete */}
              {canDeleteTask && (
                <div className="pt-2 border-t border-gray-200">
                  <button
                    onClick={() => {
                      if (confirm(`"${task.title}" 태스크를 삭제하시겠습니까?`)) {
                        deleteTask.mutate();
                      }
                    }}
                    disabled={deleteTask.isPending}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 py-1.5 px-2 rounded-lg transition-colors disabled:opacity-40"
                  >
                    <Trash2 size={13} /> 태스크 삭제
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
