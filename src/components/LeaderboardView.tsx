import { useEffect, useState } from 'react';
import { Trophy, RefreshCw, Award, Target, Flame, ChevronRight, Swords } from 'lucide-react';
import { Leaderboards, LeaderboardEntry } from '../types';
import { motion } from 'motion/react';
import { hasSupabaseConfig, getRankingsDirectFromSupabase } from '../lib/supabase';

export default function LeaderboardView() {
  const [leaderboards, setLeaderboards] = useState<Leaderboards | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'level' | 'attack' | 'rebirth' | 'boss'>('level');

  const fetchRankings = async () => {
    try {
      setLoading(true);
      setError(null);
      let data: any = null;

      try {
        const res = await fetch('/api/game/rankings');
        
        const textRes = await res.text();
        if (textRes.trim().startsWith('<') || textRes.includes('The page c') || textRes.includes('not found')) {
          throw new Error('Vercel Static Route Error');
        }

        if (!res.ok) throw new Error('랭킹 데이터를 불러오지 못했습니다.');
        
        data = JSON.parse(textRes);
      } catch (backendError: any) {
        if (hasSupabaseConfig) {
          console.log('[Leaderboard] Backend rankings failed (Vercel static). Fetching from client-side Supabase...');
          const directRankings = await getRankingsDirectFromSupabase();
          if (directRankings) {
            data = directRankings;
          } else {
            throw new Error('클라우드 데이터베이스에서 직접 랭킹을 로드하는데 실패했습니다.');
          }
        } else {
          throw backendError;
        }
      }

      setLeaderboards(data);
    } catch (err: any) {
      setError(err.message || '서버와의 통신이 원활하지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  const getRankList = (): LeaderboardEntry[] => {
    if (!leaderboards) return [];
    switch (activeTab) {
      case 'level':
        return leaderboards.levelRank || [];
      case 'attack':
        return leaderboards.attackRank || [];
      case 'rebirth':
        return leaderboards.rebirthRank || [];
      case 'boss':
        return leaderboards.bossKillsRank || [];
    }
  };

  const getTabLabel = () => {
    switch (activeTab) {
      case 'level': return '최고 레벨';
      case 'attack': return '최고 공격력';
      case 'rebirth': return '환생 횟수';
      case 'boss': return '보스 처치 수';
    }
  };

  const formatValue = (val: number) => {
    if (activeTab === 'attack') {
      return val.toLocaleString() + ' ATK';
    }
    if (activeTab === 'level') {
      return 'Lv.' + val;
    }
    if (activeTab === 'rebirth') {
      return val + '회 환생';
    }
    return val + '마리 처치';
  };

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md">
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold text-neutral-100 font-sans tracking-tight">
              실시간 월드 랭킹 (명예의 전당)
            </h3>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            전 세계 헌터들과 경쟁하여 절대자의 자리를 쟁취해보세요!
          </p>
        </div>

        <button
          onClick={fetchRankings}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700/80 text-xs text-neutral-300 font-semibold rounded-lg transition-colors border border-neutral-700/50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          갱신
        </button>
      </div>

      {/* Tabs list */}
      <div className="grid grid-cols-4 gap-1 mb-5 bg-neutral-950 p-1 rounded-xl border border-neutral-800/60">
        <button
          onClick={() => setActiveTab('level')}
          className={`py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'level'
              ? 'bg-neutral-800 text-amber-400 font-extrabold'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          최고 레벨
        </button>
        <button
          onClick={() => setActiveTab('attack')}
          className={`py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'attack'
              ? 'bg-neutral-800 text-rose-400 font-extrabold'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          공격력
        </button>
        <button
          onClick={() => setActiveTab('rebirth')}
          className={`py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'rebirth'
              ? 'bg-neutral-800 text-purple-400 font-extrabold'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          환생 횟수
        </button>
        <button
          onClick={() => setActiveTab('boss')}
          className={`py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'boss'
              ? 'bg-neutral-800 text-sky-400 font-extrabold'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          보스킬
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-500 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-amber-500/75" />
          <p className="text-sm font-medium">실시간 대형 랭킹보드 불러오는 중...</p>
        </div>
      ) : error ? (
        <div className="bg-red-950/20 border border-red-900/40 p-4 rounded-xl text-center py-8">
          <p className="text-red-400 text-sm mb-3 font-medium">{error}</p>
          <button
            onClick={fetchRankings}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 font-bold rounded-lg transition-colors border border-neutral-700"
          >
            다시 시도하기
          </button>
        </div>
      ) : getRankList().length === 0 ? (
        <div className="text-center py-16 border border-dashed border-neutral-800 rounded-xl text-neutral-500">
          <Swords className="w-8 h-8 mx-auto mb-2 text-neutral-700" />
          <p className="text-sm font-sans mb-1 font-semibold">도착한 헌터 데이터 목록이 없습니다.</p>
          <p className="text-xs">첫 번째 계정을 등록해 월드 순위판을 개방해보세요!</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {getRankList().map((item, idx) => {
            const isTop3 = idx < 3;
            const medals = [
              'text-yellow-400 bg-yellow-950/40 border-yellow-700/60 shadow-[0_0_8px_rgba(234,179,8,0.25)]',
              'text-slate-300 bg-slate-900/60 border-slate-700/60 shadow-[0_0_8px_rgba(148,163,184,0.15)]',
              'text-amber-600 bg-amber-950/20 border-amber-800/40'
            ];

            return (
              <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                key={item.userId + idx}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isTop3 
                    ? medals[idx]
                    : 'bg-neutral-950/40 hover:bg-neutral-950/80 border-neutral-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-black ${
                    isTop3 ? '' : 'text-neutral-500 bg-neutral-900 border border-neutral-800'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <span className="font-bold font-sans text-sm tracking-tight text-neutral-200">
                      {item.nickname}
                    </span>
                    <span className="text-[10px] text-neutral-500 ml-1.5 font-mono">
                      @{item.userId}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold font-mono text-neutral-100">
                    {formatValue(item.value)}
                  </span>
                  {idx === 0 && <Award className="w-4.5 h-4.5 text-yellow-400 animate-bounce" />}
                  {idx === 1 && <Award className="w-4 h-4 text-slate-300" />}
                  {idx === 2 && <Award className="w-4 h-4 text-amber-600" />}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
