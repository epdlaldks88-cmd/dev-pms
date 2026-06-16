import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { User, Lock, Phone, Briefcase, Building, Save, Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../../api/users';
import { useAuthStore } from '../../store/auth.store';
import { Avatar } from '../../components/ui/Avatar';

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();

  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    position: user?.position ?? '',
    department: user?.department ?? '',
    phone: user?.phone ?? '',
  });

  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwChanged, setPwChanged] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name ?? '',
        position: user.position ?? '',
        department: user.department ?? '',
        phone: user.phone ?? '',
      });
    }
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: () => usersApi.updateProfile(profile),
    onSuccess: (updated) => {
      updateUser({ ...user!, ...updated });
      toast.success('프로필이 저장되었습니다.');
    },
    onError: () => toast.error('저장에 실패했습니다.'),
  });

  const changePassword = useMutation({
    mutationFn: () =>
      usersApi.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      }),
    onSuccess: () => {
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwChanged(true);
      setTimeout(() => setPwChanged(false), 3000);
      toast.success('비밀번호가 변경되었습니다.');
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message ?? '비밀번호 변경에 실패했습니다.'),
  });

  const pwValid =
    pwForm.currentPassword.length > 0 &&
    pwForm.newPassword.length >= 6 &&
    pwForm.newPassword === pwForm.confirmPassword;

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
        <h1 className="text-lg font-bold text-gray-900">프로필 설정</h1>
        <p className="text-xs text-gray-500 mt-0.5">개인 정보 및 계정 설정을 관리합니다</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Avatar + 이메일 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <Avatar name={user?.name ?? ''} avatar={user?.avatar} size="lg" />
              <div>
                <p className="text-base font-bold text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <span className={`mt-1 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  user?.role === 'ADMIN'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {user?.role === 'ADMIN' ? '관리자' : '일반 사용자'}
                </span>
              </div>
            </div>
          </div>

          {/* 기본 정보 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <User size={15} className="text-indigo-500" /> 기본 정보
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">이름 *</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="이름을 입력하세요"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    <span className="flex items-center gap-1"><Briefcase size={11} /> 직급/직책</span>
                  </label>
                  <input
                    type="text"
                    value={profile.position}
                    onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="예: 과장, 시니어 개발자"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    <span className="flex items-center gap-1"><Building size={11} /> 부서</span>
                  </label>
                  <input
                    type="text"
                    value={profile.department}
                    onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="예: 개발팀, 기획팀"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  <span className="flex items-center gap-1"><Phone size={11} /> 전화번호</span>
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="예: 010-1234-5678"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => updateProfile.mutate()}
                disabled={!profile.name.trim() || updateProfile.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Save size={14} />
                {updateProfile.isPending ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>

          {/* 비밀번호 변경 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Lock size={15} className="text-indigo-500" /> 비밀번호 변경
            </h2>

            {pwChanged && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                <CheckCircle size={15} /> 비밀번호가 성공적으로 변경되었습니다.
              </div>
            )}

            <div className="space-y-4">
              {/* 현재 비밀번호 */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">현재 비밀번호</label>
                <div className="relative">
                  <input
                    type={showPw.current ? 'text' : 'password'}
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="현재 비밀번호"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw({ ...showPw, current: !showPw.current })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw.current ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* 새 비밀번호 */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">새 비밀번호 (6자 이상)</label>
                <div className="relative">
                  <input
                    type={showPw.next ? 'text' : 'password'}
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="새 비밀번호"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw({ ...showPw, next: !showPw.next })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw.next ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* 비밀번호 확인 */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">새 비밀번호 확인</label>
                <div className="relative">
                  <input
                    type={showPw.confirm ? 'text' : 'password'}
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                    className={`w-full text-sm border rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword
                        ? 'border-red-300'
                        : 'border-gray-300'
                    }`}
                    placeholder="새 비밀번호 재입력"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                  <p className="text-[11px] text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => changePassword.mutate()}
                disabled={!pwValid || changePassword.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Lock size={14} />
                {changePassword.isPending ? '변경 중...' : '비밀번호 변경'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
