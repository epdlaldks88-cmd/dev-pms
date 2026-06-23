import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Trash2, FlaskConical } from 'lucide-react';
import toast from 'react-hot-toast';
import { qaApi, QA_STATUS_CONFIG, QA_RESULT_CONFIG, type QATest } from '../../api/qa';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate, cn } from '../../lib/utils';

const SR_NUMBER_PATTERN = /^SR-\d{2}-\d{4}$/;

interface QAForm {
  srNumber: string;
  title: string;
  content: string;
  tester: string;
}

const defaultForm: QAForm = { srNumber: '', title: '', content: '', tester: '' };

export function QATestPage() {
  const qc = useQueryClient();
  const [filterSR, setFilterSR] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<QAForm>(defaultForm);

  // 상세 팝업
  const [viewItem, setViewItem] = useState<QATest | null>(null);
  const [detailForm, setDetailForm] = useState({ title: '', content: '', tester: '' });

  useEffect(() => {
    if (viewItem) {
      setDetailForm({ title: viewItem.title, content: viewItem.content ?? '', tester: viewItem.tester ?? '' });
    }
  }, [viewItem]);

  const { data: tests, isLoading } = useQuery({
    queryKey: ['qa-tests', filterSR],
    queryFn: () => qaApi.getAll(filterSR || undefined),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['qa-tests'] });

  const createMutation = useMutation({
    mutationFn: () => qaApi.create({
      srNumber: form.srNumber,
      title: form.title,
      content: form.content || undefined,
      tester: form.tester || undefined,
    }),
    onSuccess: () => { invalidate(); setShowAddModal(false); setForm(defaultForm); toast.success('QA요청이 등록되었습니다.'); },
    onError: () => toast.error('등록에 실패했습니다.'),
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => qaApi.accept(id),
    onSuccess: (data) => { invalidate(); setViewItem(data); toast.success('QA 접수되었습니다. QA번호가 발급되었습니다.'); },
    onError: () => toast.error('접수에 실패했습니다.'),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => qaApi.confirm(id),
    onSuccess: (data) => { invalidate(); setViewItem(data); toast.success('QA 확인 처리되었습니다.'); },
    onError: () => toast.error('처리에 실패했습니다.'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => qaApi.reject(id),
    onSuccess: (data) => { invalidate(); setViewItem(data); toast.success('QA 반려 처리되었습니다.'); },
    onError: () => toast.error('처리에 실패했습니다.'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => qaApi.cancel(id),
    onSuccess: (data) => { invalidate(); setViewItem(data); toast.success('QA 취소 처리되었습니다.'); },
    onError: () => toast.error('처리에 실패했습니다.'),
  });

  const updateMutation = useMutation({
    mutationFn: () => qaApi.update(viewItem!.id, {
      title: detailForm.title || undefined,
      content: detailForm.content || undefined,
      tester: detailForm.tester || undefined,
    }),
    onSuccess: (data) => { invalidate(); setViewItem(data); toast.success('수정되었습니다.'); },
    onError: () => toast.error('수정에 실패했습니다.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => qaApi.remove(id),
    onSuccess: () => { invalidate(); setViewItem(null); toast.success('삭제되었습니다.'); },
  });

  const isValidSR = SR_NUMBER_PATTERN.test(form.srNumber);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="QA 테스트"
        description="SR번호와 QA번호를 매핑하여 테스트를 관리합니다."
        actions={
          <Button variant="primary" onClick={() => { setForm(defaultForm); setShowAddModal(true); }}>
            <Plus size={16} className="mr-1" /> QA 등록
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        {/* 필터 */}
        <div className="mb-4 flex gap-3">
          <input
            type="text"
            placeholder="SR번호 검색 (예: SR-26-0001)"
            value={filterSR}
            onChange={(e) => setFilterSR(e.target.value)}
            className="w-64 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {filterSR && (
            <Button variant="ghost" onClick={() => setFilterSR('')}>
              <X size={14} /> 초기화
            </Button>
          )}
        </div>

        {/* 목록 */}
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">로딩 중...</div>
        ) : !tests || tests.length === 0 ? (
          <EmptyState icon={<FlaskConical size={32} />} title="QA 테스트가 없습니다." description="워크로드 상세에서 QA요청 버튼을 눌러 등록하세요." />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">QA번호</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">SR번호</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">제목</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">테스터</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">결과</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">등록일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tests.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setViewItem(t)}
                    className="hover:bg-primary-50/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-primary-600">
                      {t.qaNumber ?? <span className="text-gray-300">미발급</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{t.srNumber}</td>
                    <td className="px-4 py-3 max-w-xs truncate text-sm">{t.title}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{t.tester || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', QA_STATUS_CONFIG[t.status].bg, QA_STATUS_CONFIG[t.status].color)}>
                        {QA_STATUS_CONFIG[t.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {t.result ? (
                        <span className={cn('font-semibold text-xs', QA_RESULT_CONFIG[t.result].color)}>
                          {QA_RESULT_CONFIG[t.result].label}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 등록 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold">QA 테스트 등록</h2>
              <button onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">SR번호 *</label>
                <input
                  type="text"
                  value={form.srNumber}
                  onChange={(e) => setForm({ ...form, srNumber: e.target.value })}
                  placeholder="SR-26-0001"
                  className={cn(
                    'w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500',
                    form.srNumber && !isValidSR ? 'border-red-400' : 'border-gray-300',
                  )}
                />
                {form.srNumber && !isValidSR && (
                  <p className="text-xs text-red-500 mt-1">형식: SR-년도뒷2자리-시퀀스4자리 (예: SR-26-0001)</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">제목 *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="테스트 항목 제목"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">테스터</label>
                <input
                  type="text"
                  value={form.tester}
                  onChange={(e) => setForm({ ...form, tester: e.target.value })}
                  placeholder="담당자 이름"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">내용</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="테스트 내용 또는 시나리오"
                  rows={3}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>취소</Button>
              <Button
                variant="primary"
                onClick={() => createMutation.mutate()}
                disabled={!form.srNumber || !isValidSR || !form.title || createMutation.isPending}
              >
                등록
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 상세 팝업 (행 클릭) */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewItem(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* 헤더 */}
            <div className="px-6 py-5 bg-gray-50 border-b border-gray-200 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-semibold text-primary-600">
                    {viewItem.qaNumber ?? '미발급'}
                  </span>
                  <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium', QA_STATUS_CONFIG[viewItem.status].bg, QA_STATUS_CONFIG[viewItem.status].color)}>
                    {QA_STATUS_CONFIG[viewItem.status].label}
                  </span>
                  {viewItem.result && (
                    <span className={cn('text-[11px] font-bold', QA_RESULT_CONFIG[viewItem.result].color)}>
                      {QA_RESULT_CONFIG[viewItem.result].label}
                    </span>
                  )}
                </div>
                <h2 className="text-base font-bold text-gray-700 leading-snug truncate">{viewItem.title}</h2>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">SR: {viewItem.srNumber}</p>
              </div>
              <button onClick={() => setViewItem(null)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg flex-shrink-0">
                <X size={16} />
              </button>
            </div>

            {/* 상태 변경 액션 바 */}
            <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap items-center gap-2">
              {viewItem.status === 'PENDING' && (
                <button
                  onClick={() => acceptMutation.mutate(viewItem.id)}
                  disabled={acceptMutation.isPending}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                >
                  접수 (QA번호 발급)
                </button>
              )}
              {viewItem.status === 'IN_PROGRESS' && (
                <>
                  <button
                    onClick={() => { if (confirm('확인 처리하시겠습니까?')) confirmMutation.mutate(viewItem.id); }}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                  >
                    확인
                  </button>
                  <button
                    onClick={() => { if (confirm('반려 처리하시겠습니까?')) rejectMutation.mutate(viewItem.id); }}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors"
                  >
                    반려
                  </button>
                  <button
                    onClick={() => { if (confirm('취소 처리하시겠습니까?')) cancelMutation.mutate(viewItem.id); }}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    취소
                  </button>
                </>
              )}
              {(viewItem.status === 'COMPLETED' || viewItem.status === 'CANCELLED') && (
                <span className="text-xs text-gray-400">처리 완료된 항목입니다.</span>
              )}
            </div>

            {/* 수정 가능한 본문 */}
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">제목</label>
                <input
                  type="text"
                  value={detailForm.title}
                  onChange={(e) => setDetailForm({ ...detailForm, title: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">테스터</label>
                <input
                  type="text"
                  value={detailForm.tester}
                  onChange={(e) => setDetailForm({ ...detailForm, tester: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">내용</label>
                <textarea
                  value={detailForm.content}
                  onChange={(e) => setDetailForm({ ...detailForm, content: e.target.value })}
                  rows={3}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
              <p className="text-[11px] text-gray-400">등록일: {formatDate(viewItem.createdAt)}</p>
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => { if (confirm('삭제하시겠습니까?')) deleteMutation.mutate(viewItem.id); }}
                className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 size={14} /> 삭제
              </button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setViewItem(null)}>닫기</Button>
                <Button variant="primary" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
                  저장
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
