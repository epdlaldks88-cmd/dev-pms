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

const STATUS_PRESETS = [
  { emoji: '🟢', text: '업무 중' },
  { emoji: '🔴', text: '자리 비움' },
  { emoji: '🟡', text: '잠깐 자리 비움' },
  { emoji: '🎯', text: '집중 중 — 방해 금지' },
  { emoji: '📅', text: '미팅 중' },
  { emoji: '🏠', text: '재택 근무' },
  { emoji: '🌴', text: '휴가 중' },
  { emoji: '🤒', text: '병가' },
  { emoji: '⛔', text: '오프라인' },
];

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
    statusEmoji: user?.statusEmoji ?? '🟢',
    statusText: user?.statusText ?? '',
  });

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);


  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name ?? '',
        position: user.position ?? '',
        department: user.department ?? '',
        phone: user.phone ?? '',
        avatar: user.avatar ?? '',
        statusEmoji: user.statusEmoji ?? '🟢',
        statusText: user.statusText ?? '',
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

  const _changePassword = useMutation({
    mutationFn: (_: { currentPassword: string; newPassword: string }) =>
      usersApi.changePassword(_),
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

          {/* 내 상태 */}
          <div className="bg-white/85 backdrop-blur-md rounded-xl border border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04),0_0_0_1px_rgba(255,255,255,0.9)_inset] ring-1 ring-gray-900/5 p-6">
            <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Smile size={15} className="text-gray-600" /> 내 상태
            </h2>

            {/* 현재 상태 미리보기 */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100 mb-4">
              <span className="text-xl leading-none">{profile.statusEmoji || '🟢'}</span>
              <span className={`text-sm ${profile.statusText ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                {profile.statusText || '상태 메시지 없음'}
              </span>
            </div>

            {/* 프리셋 */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {STATUS_PRESETS.map((p) => (
                <button
                  key={p.emoji + p.text}
                  onClick={() => setProfile({ ...profile, statusEmoji: p.emoji, statusText: p.text })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-xs transition-colors ${profile.statusEmoji === p.emoji && profile.statusText === p.text ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'}`}
                >
                  <span className="text-base leading-none flex-shrink-0">{p.emoji}</span>
                  <span className="truncate">{p.text}</span>
                </button>
              ))}
            </div>

            {/* 직접 입력 */}
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(v => !v)}
                  className="w-10 h-10 flex items-center justify-center text-xl border border-gray-300 rounded-lg hover:border-gray-400 transition-colors bg-white"
                >
                  {profile.statusEmoji || '🟢'}
                </button>
                {showEmojiPicker && (
                  <div ref={pickerRef} className="absolute left-0 top-12 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-2 w-48 grid grid-cols-6 gap-1">
                    {['🟢','🟡','🔴','⛔','🎯','📅','🏠','🌴','🤒','💼','☕','🎉','✈️','💤','🔕','🤫'].map((e) => (
                      <button key={e} onClick={() => { setProfile({ ...profile, statusEmoji: e }); setShowEmojiPicker(false); }}
                        className="w-7 h-7 flex items-center justify-center text-base hover:bg-gray-100 rounded transition-colors">
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="text"
                value={profile.statusText}
                onChange={(e) => setProfile({ ...profile, statusText: e.target.value })}
                maxLength={80}
                placeholder="상태 메시지를 입력하세요"
                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="primary" onClick={() => updateProfile.mutate()} loading={updateProfile.isPending}>
                <Save size={14} /> 저장
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
