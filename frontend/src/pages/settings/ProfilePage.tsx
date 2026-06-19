import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { User, Lock, Phone, Briefcase, Building, Save, Eye, EyeOff, CheckCircle, Smile, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../../api/users';
import { useAuthStore } from '../../store/auth.store';
import { useUiStore } from '../../store/ui.store';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';

const EMOJI_LIST = [
  '😀','😎','🥸','🤓','🥳','😇','🥰','🤩','😜','🤪','😏','🙃','🤔','🤠','🧐','😴','🤗','😈',
  '👻','🤖','👽','🤡','💀','👹','🧙','🧛','🧟','🧝','🦸','🧚','🧜','🧞',
  '🐱','🐶','🐸','🐼','🦊','🐨','🐮','🐯','🦁','🐻','🐰','🐭','🐺','🐧','🦉','🦅',
  '🌈','⭐','🔥','💎','🚀','🌙','🎯','🎮','🌊','🍀',
];

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const mentionAlarm = useUiStore((s) => s.mentionAlarm);
  const setMentionAlarm = useUiStore((s) => s.setMentionAlarm);
  const pickerRef = useRef<HTMLDivElement>(null);

  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    position: user?.position ?? '',
    department: user?.department ?? '',
    phone: user?.phone ?? '',
    avatar: user?.avatar ?? '',
  });

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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
        avatar: user.avatar ?? '',
      });
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    if (showEmojiPicker) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

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
      <PageHeader title="프로필 설정" description="개인 정보 및 계정 설정을 관리합니다" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Avatar + 이메일 */}
          <div className={`relative bg-white/85 backdrop-blur-md rounded-xl border border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04),0_0_0_1px_rgba(255,255,255,0.9)_inset] ring-1 ring-gray-900/5 p-6 ${showEmojiPicker ? 'z-50' : ''}`}>
            <div className="flex items-center gap-4">
              {/* 아바타 + 이모지 선택 버튼 */}
              <div className="relative flex-shrink-0" ref={pickerRef}>
                <Avatar name={profile.name || user?.name || ''} avatar={profile.avatar || undefined} size="lg" />
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  className="absolute -bottom-1 -right-1 w-5 h-5 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-sm hover:bg-primary-50 hover:border-gray-300 transition-colors"
                  title="이모지 변경"
                >
                  <Smile size={11} className="text-gray-500" />
                </button>

                {/* 이모지 피커 */}
                {showEmojiPicker && (
                  <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-3 w-72">
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-xs font-semibold text-gray-500">캐릭터 이모지 선택</p>
                      {profile.avatar && (
                        <button
                          type="button"
                          onClick={() => { setProfile({ ...profile, avatar: '' }); setShowEmojiPicker(false); }}
                          className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                        >
                          초기화
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-10 gap-0.5">
                      {EMOJI_LIST.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => { setProfile({ ...profile, avatar: emoji }); setShowEmojiPicker(false); }}
                          className={`w-7 h-7 flex items-center justify-center text-lg rounded-lg transition-all hover:bg-primary-50 hover:scale-110 ${
                            profile.avatar === emoji ? 'bg-primary-100 ring-2 ring-primary-400' : ''
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className="text-base font-bold text-gray-600">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <span className={`mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                  user?.role === 'ADMIN'
                    ? 'bg-primary-100 text-gray-800'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {user?.role === 'ADMIN' ? '관리자' : '일반 사용자'}
                </span>
                <p className="text-xs text-gray-400 mt-1.5">아바타를 클릭해 이모지를 선택하세요</p>
              </div>
            </div>
          </div>

          {/* 기본 정보 */}
          <div className="bg-white/85 backdrop-blur-md rounded-xl border border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04),0_0_0_1px_rgba(255,255,255,0.9)_inset] ring-1 ring-gray-900/5 p-6">
            <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <User size={15} className="text-gray-600" /> 기본 정보
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">이름 *</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="예: 010-1234-5678"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                variant="primary"
                onClick={() => updateProfile.mutate()}
                disabled={!profile.name.trim()}
                loading={updateProfile.isPending}
              >
                <Save size={14} /> 저장
              </Button>
            </div>
          </div>

          {/* 비밀번호 변경 */}
          <div className="bg-white/85 backdrop-blur-md rounded-xl border border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04),0_0_0_1px_rgba(255,255,255,0.9)_inset] ring-1 ring-gray-900/5 p-6">
            <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Lock size={15} className="text-gray-600" /> 비밀번호 변경
            </h2>

            {pwChanged && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                <CheckCircle size={15} /> 비밀번호가 성공적으로 변경되었습니다.
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">현재 비밀번호</label>
                <div className="relative">
                  <input
                    type={showPw.current ? 'text' : 'password'}
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
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

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">새 비밀번호 (6자 이상)</label>
                <div className="relative">
                  <input
                    type={showPw.next ? 'text' : 'password'}
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500"
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

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">새 비밀번호 확인</label>
                <div className="relative">
                  <input
                    type={showPw.confirm ? 'text' : 'password'}
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                    className={`w-full text-sm border rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
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
                  <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다.</p>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                variant="primary"
                onClick={() => changePassword.mutate()}
                disabled={!pwValid}
                loading={changePassword.isPending}
              >
                <Lock size={14} /> 비밀번호 변경
              </Button>
            </div>
          </div>

          {/* 알림 설정 */}
          <div className="bg-white/85 backdrop-blur-md rounded-xl border border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04),0_0_0_1px_rgba(255,255,255,0.9)_inset] ring-1 ring-gray-900/5 p-6">
            <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Bell size={15} className="text-gray-600" /> 알림 설정
            </h2>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-800">멘션 알림</p>
                <p className="text-xs text-gray-400 mt-0.5">누군가 나를 멘션하면 화면 우측 하단에 알림 팝업이 표시됩니다</p>
              </div>
              <button
                type="button"
                onClick={() => setMentionAlarm(!mentionAlarm)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                  mentionAlarm ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
                    mentionAlarm ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
