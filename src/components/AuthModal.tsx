import React, { useState } from 'react';
import { Shield, Eye, EyeOff, AlertTriangle, Key, Loader2, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthModalProps {
  onAuthSuccess: (user: { userId: string; nickname: string; gameState: any }) => void;
  onClose: () => void;
}

export default function AuthModal({ onAuthSuccess, onClose }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);
    setSuccessText(null);

    if (!username.trim() || !password.trim()) {
      setErrorText('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    if (isRegister && !nickname.trim()) {
      setErrorText('닉네임을 입력해주세요.');
      return;
    }

    setLoading(true);
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister 
      ? { username, password, nickname } 
      : { username, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '인증 처리에 실패하였습니다.');
      }

      if (isRegister) {
        setSuccessText('계정이 생성되었습니다! 이제 로그인할 수 있습니다.');
        setIsRegister(false);
        setPassword('');
      } else {
        onAuthSuccess(data.user);
        onClose();
      }
    } catch (err: any) {
      setErrorText(err.message || '인증 서버와의 연결이 원활하지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 relative overflow-hidden"
      >
        {/* Background glow effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-rose-500" />
            <h2 className="text-xl font-bold font-sans tracking-tight text-neutral-100">
              {isRegister ? '헌터 길드 신규 등록' : '클라우드 로그인'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 transition-colors text-sm"
          >
            닫기
          </button>
        </div>

        {errorText && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-red-400 text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorText}</span>
          </div>
        )}

        {successText && (
          <div className="mb-4 p-3 bg-green-950/40 border border-green-900/60 rounded-xl text-green-400 text-sm">
            {successText}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">아이디 (ID)</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="영문, 숫자 가능"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">비밀번호 (PASSWORD)</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-4 pr-10 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {isRegister && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-2">
                  <label className="block text-xs font-medium text-neutral-400 mb-1">닉네임 (NICKNAME)</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="길드 랭킹에 표시될 이름"
                    maxLength={12}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-700 transition-colors"
                    required={isRegister}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm rounded-xl py-3 mt-4 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isRegister ? (
              '헌터 등록 완료하기'
            ) : (
              '로그인 및 데이터 불러오기'
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-neutral-800/80 text-center space-y-3">
          <p className="text-xs text-neutral-500">
            {isRegister ? '이미 헌터 길드에 등록하셨나요?' : '처음 방문한 헌터이신가요?'}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorText(null);
                setSuccessText(null);
              }}
              className="text-rose-400 hover:text-rose-300 font-medium ml-1 bg-none border-none p-0 focus:outline-none underline"
            >
              {isRegister ? '로그인하기' : '회원가입하기'}
            </button>
          </p>

          <p className="text-[10px] text-neutral-600">
            * 오프라인 모드로 게스트 계정 플레이를 바로 시작하셔도, 상단의 로그인 버튼을 통해 클라우드에 진행사항을 언제든 연동할 수 있습니다.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
