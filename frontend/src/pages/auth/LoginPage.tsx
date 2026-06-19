import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Zap, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/auth.store';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

type FindTab = 'id' | 'password';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  // 찾기 모달
  const [showFind, setShowFind] = useState(false);
  const [findTab, setFindTab] = useState<FindTab>('id');
  const [findName, setFindName] = useState('');
  const [findPhone, setFindPhone] = useState('');
  const [findEmail, setFindEmail] = useState('');
  const [foundId, setFoundId] = useState<string | null>(null);
  const [foundPw, setFoundPw] = useState<string | null>(null);

  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate('/dashboard');
      toast.success(`안녕하세요, ${data.user.name}님!`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? '로그인에 실패했습니다.');
    },
  });

  const findId = useMutation({
    mutationFn: () => authApi.findId(findName, findPhone),
    onSuccess: (data) => setFoundId(data.email),
    onError: (err: any) => toast.error(err.response?.data?.message ?? '일치하는 계정이 없습니다.'),
  });

  const findPassword = useMutation({
    mutationFn: () => authApi.findPassword(findName, findEmail),
    onSuccess: (data) => setFoundPw(data.tempPassword),
    onError: (err: any) => toast.error(err.response?.data?.message ?? '일치하는 계정이 없습니다.'),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    login.mutate({ email, password });
  };

  const openFind = (tab: FindTab) => {
    setFindTab(tab);
    setFindName('');
    setFindPhone('');
    setFindEmail('');
    setFoundId(null);
    setFoundPw(null);
    setShowFind(true);
  };

  const closeFind = () => {
    setShowFind(false);
    setFoundId(null);
    setFoundPw(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-white">L.PMS</span>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">로그인</h1>
          <p className="text-sm text-gray-500 mb-6">계정에 로그인하여 시작하세요.</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="이메일"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <Input
              label="비밀번호"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={login.isPending}
              className="w-full"
            >
              로그인
            </Button>
          </form>

          {/* 아이디/비번 찾기 */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              type="button"
              onClick={() => openFind('id')}
              className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
            >
              아이디 찾기
            </button>
            <span className="text-gray-200">|</span>
            <button
              type="button"
              onClick={() => openFind('password')}
              className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
            >
              비밀번호 찾기
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-4">
            계정이 없으신가요?{' '}
            <Link to="/register" className="text-indigo-600 font-medium hover:underline">
              회원가입
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          소규모 팀을 위한 프로젝트 관리 도구
        </p>
      </div>

      {/* 찾기 모달 */}
      {showFind && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex gap-4">
                <button
                  onClick={() => { setFindTab('id'); setFoundId(null); setFoundPw(null); }}
                  className={`text-sm font-semibold pb-0.5 transition-colors ${findTab === 'id' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  아이디 찾기
                </button>
                <button
                  onClick={() => { setFindTab('password'); setFoundId(null); setFoundPw(null); }}
                  className={`text-sm font-semibold pb-0.5 transition-colors ${findTab === 'password' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  비밀번호 찾기
                </button>
              </div>
              <button onClick={closeFind} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {findTab === 'id' ? (
                <>
                  {!foundId ? (
                    <>
                      <p className="text-xs text-gray-500">가입 시 등록한 이름과 전화번호를 입력하세요.</p>
                      <Input
                        label="이름"
                        placeholder="홍길동"
                        value={findName}
                        onChange={(e) => setFindName(e.target.value)}
                      />
                      <Input
                        label="전화번호"
                        placeholder="010-1234-5678"
                        value={findPhone}
                        onChange={(e) => setFindPhone(e.target.value)}
                      />
                      <Button
                        variant="primary"
                        className="w-full"
                        loading={findId.isPending}
                        onClick={() => findId.mutate()}
                        disabled={!findName || !findPhone}
                      >
                        아이디 찾기
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-4 space-y-3">
                      <p className="text-sm text-gray-500">회원님의 아이디는</p>
                      <p className="text-lg font-bold text-indigo-600 bg-indigo-50 rounded-xl py-3">{foundId}</p>
                      <p className="text-xs text-gray-400">입니다.</p>
                      <Button variant="secondary" className="w-full" onClick={closeFind}>확인</Button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {!foundPw ? (
                    <>
                      <p className="text-xs text-gray-500">가입 시 등록한 이름과 이메일을 입력하세요.<br />임시 비밀번호가 발급됩니다.</p>
                      <Input
                        label="이름"
                        placeholder="홍길동"
                        value={findName}
                        onChange={(e) => setFindName(e.target.value)}
                      />
                      <Input
                        label="이메일"
                        type="email"
                        placeholder="name@company.com"
                        value={findEmail}
                        onChange={(e) => setFindEmail(e.target.value)}
                      />
                      <Button
                        variant="primary"
                        className="w-full"
                        loading={findPassword.isPending}
                        onClick={() => findPassword.mutate()}
                        disabled={!findName || !findEmail}
                      >
                        비밀번호 찾기
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-4 space-y-3">
                      <p className="text-sm text-gray-500">임시 비밀번호가 발급되었습니다.</p>
                      <p className="text-lg font-bold text-indigo-600 bg-indigo-50 rounded-xl py-3 tracking-widest">{foundPw}</p>
                      <p className="text-xs text-gray-400">로그인 후 프로필 설정에서 비밀번호를 변경하세요.</p>
                      <Button variant="secondary" className="w-full" onClick={closeFind}>확인</Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
