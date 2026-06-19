import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2, Users, Trash2, Mail, Phone, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { partnersApi } from '../../api/partners';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import type { Partner } from '../../types';

export function PartnersPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', contactName: '', email: '', phone: '' });

  const { data: partners, isLoading } = useQuery({
    queryKey: ['partners'],
    queryFn: partnersApi.getAll,
  });

  const createPartner = useMutation({
    mutationFn: partnersApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partners'] });
      setCreateOpen(false);
      setForm({ name: '', description: '', contactName: '', email: '', phone: '' });
      toast.success('파트너사가 등록되었습니다.');
    },
    onError: () => toast.error('등록에 실패했습니다.'),
  });

  const deletePartner = useMutation({
    mutationFn: partnersApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partners'] });
      toast.success('파트너사가 삭제되었습니다.');
    },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-700">파트너사 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">협력 업체와 인력 정보를 관리하세요.</p>
        </div>
        <Button variant="primary" size="md" onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> 파트너사 등록
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : !partners?.length ? (
        <EmptyState
          icon={<Building2 size={48} />}
          title="등록된 파트너사가 없습니다"
          description="협력 업체를 등록하고 인력 정보를 관리하세요."
          action={<Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={16} /> 파트너사 등록</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(partners as Partner[]).map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-gray-300 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <Building2 size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <Link to={`/partners/${p.id}`} className="font-semibold text-sm text-gray-600 hover:text-red-600 transition-colors">
                      {p.name}
                    </Link>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <Users size={11} /> 인력 {p._count?.personnel ?? 0}명
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { if (confirm(`"${p.name}" 파트너사를 삭제하시겠습니까?\n소속 인력 정보도 함께 삭제됩니다.`)) deletePartner.mutate(p.id); }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 transition-all cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {p.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{p.description}</p>}

              <div className="space-y-1 mb-3">
                {p.contactName && <p className="text-xs text-gray-600">담당: {p.contactName}</p>}
                {p.email && (
                  <p className="flex items-center gap-1.5 text-xs text-gray-500"><Mail size={11} /> {p.email}</p>
                )}
                {p.phone && (
                  <p className="flex items-center gap-1.5 text-xs text-gray-500"><Phone size={11} /> {p.phone}</p>
                )}
              </div>

              <Link to={`/partners/${p.id}`} className="flex items-center justify-center gap-1 text-xs text-gray-600 font-medium hover:text-red-600 pt-2 border-t border-gray-100">
                인력 관리 <ChevronRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="파트너사 등록">
        <form
          onSubmit={(e) => { e.preventDefault(); if (form.name.trim()) createPartner.mutate(form as any); }}
          className="p-6 space-y-4"
        >
          <Input label="파트너사 이름 *" placeholder="(주)협력업체" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-600">설명</label>
            <textarea
              placeholder="사업 분야, 협력 내용 등"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <Input label="담당자명" placeholder="홍길동" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
          <div className="flex gap-4">
            <Input label="이메일" type="email" placeholder="contact@partner.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="flex-1" />
            <Input label="연락처" placeholder="02-1234-5678" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="flex-1" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>취소</Button>
            <Button type="submit" variant="primary" loading={createPartner.isPending}>등록</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
