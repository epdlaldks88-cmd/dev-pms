import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, Calendar, Users, X, Pencil, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { meetingsApi } from '../../api/meetings';
import { projectsApi } from '../../api/projects';
import { useAuthStore } from '../../store/auth.store';
import { Avatar } from '../../components/ui/Avatar';
import { formatDate, formatRelativeTime } from '../../lib/utils';

interface MeetingForm {
  title: string;
  content: string;
  meetingDate: string;
  attendees: string;
  projectId: string;
}

const emptyForm = (): MeetingForm => ({
  title: '',
  content: '',
  meetingDate: new Date().toISOString().slice(0, 10),
  attendees: '',
  projectId: '',
});

export function MeetingsPage() {
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const [filterProject, setFilterProject] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingMeeting, setViewingMeeting] = useState<any | null>(null);
  const [form, setForm] = useState<MeetingForm>(emptyForm());

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  });

  const { data: meetings, isLoading } = useQuery({
    queryKey: ['meetings', filterProject],
    queryFn: () => meetingsApi.getAll(filterProject ? { projectId: filterProject } : undefined),
  });

  const createMeeting = useMutation({
    mutationFn: () => meetingsApi.create({
      title: form.title,
      content: form.content || undefined,
      meetingDate: form.meetingDate || undefined,
      attendees: form.attendees || undefined,
      projectId: form.projectId || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      setShowModal(false);
      setForm(emptyForm());
      toast.success('회의록이 저장되었습니다.');
    },
    onError: () => toast.error('저장에 실패했습니다.'),
  });

  const updateMeeting = useMutation({
    mutationFn: () => meetingsApi.update(editingId!, {
      title: form.title,
      content: form.content || undefined,
      meetingDate: form.meetingDate || undefined,
      attendees: form.attendees || undefined,
      projectId: form.projectId || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      setShowModal(false);
      setEditingId(null);
      setForm(emptyForm());
      if (viewingMeeting) setViewingMeeting(null);
      toast.success('회의록이 수정되었습니다.');
    },
    onError: () => toast.error('수정에 실패했습니다.'),
  });

  const deleteMeeting = useMutation({
    mutationFn: (id: string) => meetingsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      if (viewingMeeting) setViewingMeeting(null);
      toast.success('회의록이 삭제되었습니다.');
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? '삭제에 실패했습니다.'),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (m: any) => {
    setEditingId(m.id);
    setForm({
      title: m.title,
      content: m.content ?? '',
      meetingDate: m.meetingDate ? m.meetingDate.slice(0, 10) : '',
      attendees: m.attendees ?? '',
      projectId: m.project?.id ?? '',
    });
    setShowModal(true);
  };

  const filtered = (meetings ?? []).filter((m: any) =>
    !search || m.title.toLowerCase().includes(search.toLowerCase()) || (m.content ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-900">회의록</h1>
          <p className="text-xs text-gray-500 mt-0.5">회의 기록 및 결정 사항 관리</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          <Plus size={15} /> 새 회의록
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="회의록 검색..."
            className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52"
          />
        </div>
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

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText size={32} className="mb-3 opacity-40" />
            <p className="text-sm">회의록이 없습니다.</p>
            <button
              onClick={openCreate}
              className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              첫 번째 회의록 작성하기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((m: any) => (
              <div
                key={m.id}
                onClick={() => setViewingMeeting(m)}
                className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-700 transition-colors">
                        {m.title}
                      </h3>
                      {m.project && (
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 flex-shrink-0"
                        >
                          {m.project.name}
                        </span>
                      )}
                    </div>
                    {m.content && (
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{m.content}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Calendar size={11} /> {formatDate(m.meetingDate)}
                      </span>
                      {m.attendees && (
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <Users size={11} /> {m.attendees}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(m); }}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    {m.createdBy?.id === currentUser?.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`"${m.title}" 회의록을 삭제하시겠습니까?`)) deleteMeeting.mutate(m.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-gray-50">
                  <Avatar name={m.createdBy?.name ?? '?'} avatar={m.createdBy?.avatar} size="xs" />
                  <span className="text-[10px] text-gray-400">{m.createdBy?.name} · {formatRelativeTime(m.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-base font-bold text-gray-900">{editingId ? '회의록 수정' : '새 회의록'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">제목 *</label>
                <input
                  autoFocus
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="회의록 제목을 입력하세요"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Date + Project row */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">회의일</label>
                  <input
                    type="date"
                    value={form.meetingDate}
                    onChange={(e) => setForm({ ...form, meetingDate: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">연관 프로젝트</label>
                  <select
                    value={form.projectId}
                    onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">없음</option>
                    {projects?.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Attendees */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">참석자</label>
                <input
                  type="text"
                  value={form.attendees}
                  onChange={(e) => setForm({ ...form, attendees: e.target.value })}
                  placeholder="예: 김철수, 이영희, 박민준"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">내용</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="회의 내용, 결정 사항, 액션 아이템 등을 기록하세요..."
                  rows={8}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={() => editingId ? updateMeeting.mutate() : createMeeting.mutate()}
                disabled={!form.title.trim() || createMeeting.isPending || updateMeeting.isPending}
                className="px-4 py-2 text-sm bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors cursor-pointer"
              >
                {editingId ? '수정' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingMeeting && !showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewingMeeting(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-gray-900">{viewingMeeting.title}</h2>
                {viewingMeeting.project && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                    {viewingMeeting.project.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(viewingMeeting)}
                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Pencil size={14} />
                </button>
                {viewingMeeting.createdBy?.id === currentUser?.id && (
                  <button
                    onClick={() => {
                      if (confirm(`"${viewingMeeting.title}" 회의록을 삭제하시겠습니까?`)) deleteMeeting.mutate(viewingMeeting.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <button onClick={() => setViewingMeeting(null)} className="text-gray-400 hover:text-gray-600 p-1.5 ml-1">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center gap-4 mb-5 pb-4 border-b border-gray-100">
                {viewingMeeting.meetingDate && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Calendar size={14} className="text-gray-400" />
                    {formatDate(viewingMeeting.meetingDate)}
                  </span>
                )}
                {viewingMeeting.attendees && (
                  <span className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Users size={14} className="text-gray-400" />
                    {viewingMeeting.attendees}
                  </span>
                )}
              </div>

              {viewingMeeting.content ? (
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {viewingMeeting.content}
                </div>
              ) : (
                <p className="text-sm text-gray-400">내용이 없습니다.</p>
              )}
            </div>

            <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
              <Avatar name={viewingMeeting.createdBy?.name ?? '?'} avatar={viewingMeeting.createdBy?.avatar} size="xs" />
              <span className="text-[11px] text-gray-400">
                {viewingMeeting.createdBy?.name} · {formatRelativeTime(viewingMeeting.createdAt)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
