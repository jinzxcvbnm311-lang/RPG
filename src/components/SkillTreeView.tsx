import { GameState, SkillTree, RebirthUpgrades } from '../types';
import { Swords, Shield, Disc, Zap, Flame, Award, Coins, Compass } from 'lucide-react';
import { motion } from 'motion/react';

interface SkillTreeViewProps {
  gameState: GameState;
  onUpgradeSkill: (skillKey: keyof SkillTree, goldCost: number) => void;
  onUpgradeRebirthPerk: (perkKey: keyof RebirthUpgrades, pointsCost: number) => void;
}

export default function SkillTreeView({
  gameState,
  onUpgradeSkill,
  onUpgradeRebirthPerk,
}: SkillTreeViewProps) {
  
  // Normal skills config
  const skillDefinitions: {
    key: keyof SkillTree;
    name: string;
    description: string;
    effectDescription: (level: number) => string;
    baseCost: number;
    costScaling: number; // multiplier per level
    icon: any;
    color: string;
  }[] = [
    {
      key: 'attackLevel',
      name: '맹렬한 격파술 (Attack)',
      description: '물리적인 힘의 한계를 넓혀 적에게 한층 강력한 충격을 입힙니다.',
      effectDescription: (level) => `기본 공격력 +${level * 5} 증가`,
      baseCost: 200,
      costScaling: 1.45,
      icon: Swords,
      color: 'border-rose-900/40 text-rose-400 bg-rose-950/20',
    },
    {
      key: 'defenseLevel',
      name: '수호자의 철옹성 (Defense & HP)',
      description: '방어 세포와 연계 내구력을 증폭시켜 생존 한계선을 밀어 올립니다.',
      effectDescription: (level) => `기본 방어력 +${level * 3}, 최대 생명력 +${level * 40} 증가`,
      baseCost: 200,
      costScaling: 1.45,
      icon: Shield,
      color: 'border-blue-900/40 text-blue-400 bg-blue-950/20',
    },
    {
      key: 'criticalLevel',
      name: '빛의 일격술 (Critical Hits)',
      description: '약점 급소 분석 능력을 강화하여 살상 극대 타격을 유도합니다.',
      effectDescription: (level) => `치명타 확률 +${(level * 1.5).toFixed(1)}%, 치명타 피해 +${level * 10}% 증가`,
      baseCost: 800,
      costScaling: 1.52,
      icon: Flame,
      color: 'border-amber-900/40 text-amber-500 bg-amber-950/20',
    },
    {
      key: 'autoHuntLevel',
      name: '시계태엽 인형 사냥 (Auto-Hunt)',
      description: '태엽 장치 인형 기술을 해금하여 오프라인/방치형 자동 공격 메커니즘을 부여합니다.',
      effectDescription: (level) => level === 0 
        ? '[비활성화] 최소 1레벨 달성 시 자동 타격이 해금됩니다.' 
        : `자동 타격 개시 (속도: ${(0.8 + (level - 1) * 0.15).toFixed(2)}회/초, 속도옵션 영향)`,
      baseCost: 1500,
      costScaling: 1.6,
      icon: Zap,
      color: 'border-purple-900/40 text-purple-400 bg-purple-950/20',
    },
    {
      key: 'dropLevel',
      name: '황금 탐닉 술책 (Reward Boost)',
      description: '주변 대기를 훑는 자력을 형성하여, 전리품 골드와 장비의 드랍 가능성을 극대화합니다.',
      effectDescription: (level) => `골드 드랍량 +${level * 5}%, 간접 공격력 시너지 시너지 +${level * 2}% 증가`,
      baseCost: 1000,
      costScaling: 1.48,
      icon: Coins,
      color: 'border-green-900/40 text-green-400 bg-green-950/20',
    }
  ];

  // Rebirth permanent perks config
  const rebirthPerks: {
    key: keyof RebirthUpgrades;
    name: string;
    description: string;
    effectDescription: (level: number) => string;
    perPointCost: number;
    icon: any;
    color: string;
  }[] = [
    {
      key: 'attackMultiplier',
      name: '절대 지배자의 마력 공격 (ATK Multiplier)',
      description: '시공을 관통하는 차원 마법 충격으로 공격량을 배가시킵니다.',
      effectDescription: (level) => `모든 최종 공격력 ×${Math.pow(1.15, level).toFixed(2)}배 증가 (+15% 복리)`,
      perPointCost: 1,
      icon: Award,
      color: 'border-amber-600 bg-amber-950/20 text-amber-400'
    },
    {
      key: 'expMultiplier',
      name: '고대 인과의 서 (EXP Multiplier)',
      description: '인간 정수 영성의 그릇을 수호하여 레벨업 성장을 기하급수적으로 이끕니다.',
      effectDescription: (level) => `사냥 몬스터 경험치 비율 +${(level * 20)}% 추가 증가`,
      perPointCost: 1,
      icon: Compass,
      color: 'border-sky-500/50 bg-sky-950/20 text-sky-400'
    },
    {
      key: 'goldMultiplier',
      name: '마이더스의 심장 (GOLD Multiplier)',
      description: '처치한 생명의 체내 연금 자원을 황금 광산으로 치환시킵니다.',
      effectDescription: (level) => `골드 총 획득량 보정 배율 +${(level * 25)}% 증가`,
      perPointCost: 1,
      icon: Coins,
      color: 'border-green-500/50 bg-green-950/20 text-green-400'
    },
    {
      key: 'dropMultiplier',
      name: '행운의 성배 보석 (DROP Multiplier)',
      description: '시공을 거쳐 드랍되는 신화, 전설 아이템의 우주 관측을 향상시킵니다.',
      effectDescription: (level) => `영구 장비 드랍 발생률 +${(level * 15)}% 증가`,
      perPointCost: 2,
      icon: Disc,
      color: 'border-rose-500/50 bg-rose-950/20 text-rose-400'
    }
  ];

  const getSkillCost = (def: typeof skillDefinitions[0], level: number): number => {
    return Math.floor(def.baseCost * Math.pow(def.costScaling, level));
  };

  return (
    <div className="space-y-10">
      
      {/* SECTION 1: Gold skill trees */}
      <div>
        <h3 className="text-sm font-black text-neutral-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
          <Coins className="w-4 h-4 text-emerald-500" />
          모험가 길드 훈련원 (Gold Skill Tree)
        </h3>
        <p className="text-xs text-neutral-500 mb-5 leading-relaxed">
          수집한 골드를 길드 마스터에게 제출하여 사냥에 유용한 패시브 특성 및 자동 사냥 기계를 해금하세요.
        </p>

        <div className="space-y-3.5">
          {skillDefinitions.map((def) => {
            const currentLevel = gameState.skills?.[def.key] || 0;
            const cost = getSkillCost(def, currentLevel);
            const canAfford = gameState.gold >= cost;
            const Icon = def.icon;

            return (
              <div
                key={def.key}
                className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-2xl border ${def.color}`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 shrink-0">
                    <Icon className="w-5.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm font-sans text-neutral-100 flex items-center gap-2">
                      {def.name}
                      <span className="text-[10px] bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded text-neutral-400 font-mono">
                        Lv.{currentLevel}
                      </span>
                    </h4>
                    <p className="text-[11px] text-neutral-400 mt-1 max-w-lg leading-relaxed">
                      {def.description}
                    </p>
                    <p className="text-[11px] text-emerald-400/80 font-bold font-mono mt-1.5 leading-none">
                      현재 보너스: {def.effectDescription(currentLevel)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onUpgradeSkill(def.key, cost)}
                  disabled={!canAfford}
                  className={`w-full sm:w-auto mt-4 sm:mt-0 font-extrabold text-xs px-4 py-3 rounded-xl transition-all font-sans whitespace-nowrap outline-none ${
                    canAfford
                      ? 'bg-neutral-100 text-neutral-950 hover:bg-neutral-200 cursor-pointer shadow-lg shadow-neutral-950/20'
                      : 'bg-neutral-950 text-neutral-600 border border-neutral-900/60 pointer-events-none'
                  }`}
                >
                  수련하기: {cost.toLocaleString()}골드
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Rebirth point Shop */}
      <div className="border-t border-neutral-850 pt-8 relative overflow-hidden">
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex justify-between items-center mb-1.5 flex-wrap gap-2">
          <h3 className="text-sm font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
            <Award className="w-4.5 h-4.5 text-purple-400 animate-pulse" />
            초월 환생 포인트 상점 (Rebirth Perpetuals)
          </h3>
          <span className="text-xs bg-purple-950/50 text-purple-450 border border-purple-800/80 px-2.5 py-1 rounded-xl font-extrabold font-mono shadow-[0_0_8px_rgba(168,85,247,0.15)]">
            보유 환생 포인트: {gameState.rebirthPoints} P
          </span>
        </div>
        <p className="text-xs text-neutral-500 mb-5 leading-relaxed">
          마왕성의 마왕 사냥 이후 환생 자격을 얻습니다. 환생 시 캐릭터 공격력, 경험치 획득량, 골드 등 성장 가중치를 영구적으로 복리 증폭시켜보세요.
        </p>

        {gameState.rebirthCount === 0 && !gameState.achievements.unlockedAchievements.includes('demon_slayer') ? (
          <div className="text-center py-10 border border-dashed border-neutral-805 rounded-2xl bg-neutral-950/40 p-4">
            <h4 className="text-sm font-bold text-neutral-400 mb-1">상점 아직 봉인 상태</h4>
            <p className="text-xs text-neutral-600 max-w-sm mx-auto">
              사냥터 최종 마왕 <span className="font-bold text-rose-500">지배자 마왕</span>을 1회 이상 격퇴하고 환생(Rebirth)을 가동시켜야 활성화되는 비밀 상점입니다.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {rebirthPerks.map((perk) => {
              const currentLvl = gameState.rebirthUpgrades?.[perk.key] || 0;
              const pointsCost = perk.perPointCost;
              const canAfford = gameState.rebirthPoints >= pointsCost;
              const Icon = perk.icon;

              return (
                <div
                  key={perk.key}
                  className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-2xl border ${perk.color}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 shrink-0">
                      <Icon className="w-5.5 h-4.5 text-purple-450" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm font-sans flex items-center gap-2">
                        {perk.name}
                        <span className="text-[10px] bg-neutral-905 border border-purple-900/30 px-2 py-0.5 rounded text-purple-300 font-mono">
                          성능 Lv.{currentLvl}
                        </span>
                      </h4>
                      <p className="text-[11px] text-neutral-405 mt-1 max-w-lg leading-relaxed">
                        {perk.description}
                      </p>
                      <p className="text-[11px] text-purple-400 font-black font-mono mt-1.5 leading-none">
                        상태: {perk.effectDescription(currentLvl)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onUpgradeRebirthPerk(perk.key, pointsCost)}
                    disabled={!canAfford}
                    className={`w-full sm:w-auto mt-4 sm:mt-0 font-black text-xs px-4 py-3 rounded-xl transition-all tracking-tight ${
                      canAfford
                        ? 'bg-purple-600 text-white hover:bg-purple-500 cursor-pointer shadow-lg shadow-purple-950/40'
                        : 'bg-neutral-950 text-neutral-600 border border-neutral-900/60 pointer-events-none'
                    }`}
                  >
                    영구 각성: {pointsCost}P 소모
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
