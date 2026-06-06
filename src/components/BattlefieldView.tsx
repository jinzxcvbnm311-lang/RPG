import React, { useState, useEffect, useRef } from 'react';
import { GameState, Equipment } from '../types';
import { generateRandomEquipment } from '../utils';
import { HUNTING_ZONES, HuntingZoneSpec, MonsterSpec, STONE_NAMES, RARITY_TABLE } from '../data';
import { Shield, Sparkles, Flame, Swords, ArrowRight, Zap, RefreshCw, AlertCircle, PlayCircle, LogOut, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BattlefieldViewProps {
  gameState: GameState;
  calculatedStats: any;
  onMonsterKilled: (gold: number, exp: number, isBoss: boolean, drops: Equipment | null, stoneTier: string | null) => void;
  onPlayerDamaged: (dmg: number) => void;
  onPlayerClickHook: () => void;
}

interface FloatingDamage {
  id: string;
  value: string | number;
  x: number;
  y: number;
  isCrit: boolean;
}

interface VisualDrop {
  id: string;
  name: string;
  amount?: string;
  type: 'gold' | 'exp' | 'gear' | 'stone';
  rarity?: string;
  icon: string;
  colorClass: string;
  x: number;
  y: number;
}

interface ZoneTheme {
  name: string;
  bgGradient: string;
  bannerBg: string;
  borderColor: string;
  glowColor: string;
  buttonBorderColor: string;
  buttonGlow: string;
  titleColor: string;
  ambientGlow: string;
  accentIconColor: string;
  ambientVibeText: string;
  particles: { emoji: string; textClass: string }[];
}

const ZONE_THEMES: Record<string, ZoneTheme> = {
  '초보자의 숲': {
    name: '초보자의 숲',
    bgGradient: 'from-emerald-950/45 via-neutral-900/90 to-neutral-950/95',
    bannerBg: 'bg-emerald-950/40 border-emerald-900/40 text-emerald-400',
    borderColor: 'border-emerald-900/50',
    glowColor: 'shadow-[0_0_30px_rgba(16,185,129,0.06)]',
    buttonBorderColor: 'border-emerald-500/50 text-emerald-400',
    buttonGlow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
    titleColor: 'text-emerald-400',
    ambientGlow: 'bg-emerald-500/10',
    accentIconColor: 'text-emerald-500',
    ambientVibeText: '🌿 아늑한 벼랑 밑자락, 솔바람 소리와 풀벌레들의 평화로운 숨결이 가득합니다.',
    particles: [
      { emoji: '🍃', textClass: 'text-emerald-400/30 text-xs' },
      { emoji: '✨', textClass: 'text-green-500/40 text-[10px]' },
      { emoji: '🌿', textClass: 'text-emerald-600/20 text-sm' }
    ]
  },
  '어두운 동굴': {
    name: '어두운 동굴',
    bgGradient: 'from-slate-950/90 via-indigo-950/30 to-neutral-950/95',
    bannerBg: 'bg-indigo-950/40 border-indigo-900/40 text-indigo-400',
    borderColor: 'border-indigo-905/40',
    glowColor: 'shadow-[0_0_30px_rgba(99,102,241,0.06)]',
    buttonBorderColor: 'border-indigo-500/50 text-indigo-400',
    buttonGlow: 'shadow-[0_0_20px_rgba(99,102,241,0.18)]',
    titleColor: 'text-indigo-400',
    ambientGlow: 'bg-indigo-600/10',
    accentIconColor: 'text-indigo-400',
    ambientVibeText: '🦇 한기가 맴도는 동굴 벽면, 축축하게 흘러내리는 마나 점액과 어둠의 메아리에 소름이 돋습니다.',
    particles: [
      { emoji: '💧', textClass: 'text-indigo-400/30 text-xs' },
      { emoji: '🦇', textClass: 'text-slate-600/20 text-sm' },
      { emoji: '❄️', textClass: 'text-cyan-400/20 text-[10px]' }
    ]
  },
  '버려진 성': {
    name: '버려진 성',
    bgGradient: 'from-purple-950/40 via-neutral-900/90 to-neutral-950/95',
    bannerBg: 'bg-purple-950/40 border-purple-900/40 text-purple-400',
    borderColor: 'border-purple-900/50',
    glowColor: 'shadow-[0_0_30px_rgba(168,85,247,0.06)]',
    buttonBorderColor: 'border-purple-500/50 text-purple-400',
    buttonGlow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]',
    titleColor: 'text-purple-400',
    ambientGlow: 'bg-purple-500/10',
    accentIconColor: 'text-purple-500',
    ambientVibeText: '🏰 차디찬 대리석성, 오래전에 몰살당한 전령 기사들의 차가운 영혼들이 옥죄어옵니다.',
    particles: [
      { emoji: '✨', textClass: 'text-purple-450/30 text-[11px]' },
      { emoji: '👻', textClass: 'text-purple-300/15 text-xs' },
      { emoji: '🪐', textClass: 'text-violet-550/20 text-sm' }
    ]
  },
  '불타는 협곡': {
    name: '불타는 협곡',
    bgGradient: 'from-orange-950/30 via-neutral-900/90 to-neutral-950/95',
    bannerBg: 'bg-red-950/40 border-red-900/40 text-red-400',
    borderColor: 'border-red-900/50',
    glowColor: 'shadow-[0_0_30px_rgba(239,68,68,0.08)]',
    buttonBorderColor: 'border-red-500/50 text-red-500',
    buttonGlow: 'shadow-[0_0_20px_rgba(239,68,68,0.25)]',
    titleColor: 'text-rose-500',
    ambientGlow: 'bg-red-500/10',
    accentIconColor: 'text-red-500',
    ambientVibeText: '🔥 펄펄 소적되며 흐르는 용암 마그마 천지, 숨 쉬는 구멍마다 격렬한 유황 열기가 터져 나옵니다.',
    particles: [
      { emoji: '🔥', textClass: 'text-red-500/25 text-xs' },
      { emoji: '☄️', textClass: 'text-amber-500/25 text-sm' },
      { emoji: '⚡', textClass: 'text-yellow-650/20 text-xs' }
    ]
  },
  '고대 유적': {
    name: '고대 유적',
    bgGradient: 'from-amber-950/40 via-neutral-900/90 to-neutral-950/95',
    bannerBg: 'bg-amber-950/40 border-amber-900/40 text-amber-400',
    borderColor: 'border-amber-900/50',
    glowColor: 'shadow-[0_0_30px_rgba(245,158,11,0.06)]',
    buttonBorderColor: 'border-amber-500/50 text-amber-500',
    buttonGlow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
    titleColor: 'text-amber-400',
    ambientGlow: 'bg-amber-500/10',
    accentIconColor: 'text-amber-500',
    ambientVibeText: '☀️ 부서진 신화의 신전 잔해 속, 고대 유물의 아우라와 금빛 비석가루가 우주 먼지처럼 반짝입니다.',
    particles: [
      { emoji: '💎', textClass: 'text-yellow-400/25 text-[10px]' },
      { emoji: '⚡', textClass: 'text-amber-300/30 text-[9px]' },
      { emoji: '📜', textClass: 'text-amber-600/15 text-xs' }
    ]
  },
  '마왕의 성': {
    name: '마왕의 성',
    bgGradient: 'from-rose-950/45 via-neutral-950 to-neutral-950',
    bannerBg: 'bg-rose-950/40 border-rose-900/50 text-rose-400',
    borderColor: 'border-rose-900/60',
    glowColor: 'shadow-[0_0_40px_rgba(244,63,94,0.15)]',
    buttonBorderColor: 'border-rose-500/65 text-rose-450',
    buttonGlow: 'shadow-[0_0_25px_rgba(244,63,94,0.35)]',
    titleColor: 'text-rose-500 font-extrabold',
    ambientGlow: 'bg-rose-650/15',
    accentIconColor: 'text-rose-500',
    ambientVibeText: '⚡ 최종 결전의 성벽! 진동하는 검은 마력 폭풍과 지배자 발록의 압도적인 패기가 온몸을 가릅니다.',
    particles: [
      { emoji: '🩸', textClass: 'text-rose-600/25 text-xs' },
      { emoji: '⚡', textClass: 'text-red-500/30 text-xs' },
      { emoji: '🖤', textClass: 'text-rose-950/40 text-[10px]' }
    ]
  }
};

export default function BattlefieldView({
  gameState,
  calculatedStats,
  onMonsterKilled,
  onPlayerDamaged,
  onPlayerClickHook,
}: BattlefieldViewProps) {
  // Hunting Zone details
  const activeZoneIndex = HUNTING_ZONES.findIndex(z => z.name === gameState.currentHuntingZone);
  const activeZone = HUNTING_ZONES[activeZoneIndex] || HUNTING_ZONES[0];

  const theme = ZONE_THEMES[activeZone.name] || ZONE_THEMES['초보자의 숲'];

  const [currentMonster, setCurrentMonster] = useState<MonsterSpec | null>(null);
  const [monsterMaxHp, setMonsterMaxHp] = useState(1);
  const [monsterCurrentHp, setMonsterCurrentHp] = useState(1);
  const [combatLogs, setCombatLogs] = useState<string[]>(['조용한 전장에서 모험자 사냥 전투 준비중...']);
  const [floatingDamages, setFloatingDamages] = useState<FloatingDamage[]>([]);
  const [visualDrops, setVisualDrops] = useState<VisualDrop[]>([]);
  const [shieldHitActive, setShieldHitActive] = useState(false);
  const [monsterShake, setMonsterShake] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [respawnCountdown, setRespawnCountdown] = useState(0);

  const monsterAttackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoAttackIntervalRef = useRef<NodeJS.Timeout | null>(null);


  // 1. Initialize monster spawn based on kills progress
  useEffect(() => {
    spawnNewMonster();
  }, [gameState.currentHuntingZone, gameState.huntingZoneKills]);

  const spawnNewMonster = () => {
    // 100 kills trigger Boss!
    const isBossThreshold = gameState.huntingZoneKills >= 100;
    let spec: MonsterSpec;

    if (isBossThreshold) {
      spec = { ...activeZone.boss };
    } else {
      // Pick random minion
      const minionList = activeZone.monsters;
      const r = Math.floor(Math.random() * minionList.length);
      spec = { ...minionList[r] };
    }

    setCurrentMonster(spec);
    setMonsterMaxHp(spec.hp);
    setMonsterCurrentHp(spec.hp);
    addLog(`[출현] ${spec.name} (HP: ${spec.hp.toLocaleString()})이(가) 나타났습니다!`);
  };

  const addLog = (msg: string) => {
    setCombatLogs((prev) => [msg, ...prev.slice(0, 15)]);
  };

  // 2. Auto Hack Attack Loop (based on speed stats)
  useEffect(() => {
    if (gameState.skills.autoHuntLevel > 0 && calculatedStats.attackSpeed > 0 && !isDead && monsterCurrentHp > 0) {
      const spdMs = 1000 / calculatedStats.attackSpeed;
      
      autoAttackIntervalRef.current = setInterval(() => {
        executeCombatDamage(false); // passive trigger
      }, spdMs);
    }

    return () => {
      if (autoAttackIntervalRef.current) clearInterval(autoAttackIntervalRef.current);
    };
  }, [gameState.skills.autoHuntLevel, calculatedStats.attackSpeed, isDead, currentMonster, monsterCurrentHp]);

  // 3. Monster counter-attacks player clock
  useEffect(() => {
    if (currentMonster && !isDead && monsterCurrentHp > 0) {
      // Monsters attack player every 2.2 seconds
      monsterAttackIntervalRef.current = setInterval(() => {
        executeMonsterAttack();
      }, 2200);
    }

    return () => {
      if (monsterAttackIntervalRef.current) clearInterval(monsterAttackIntervalRef.current);
    };
  }, [currentMonster, isDead, monsterCurrentHp, calculatedStats.defense]);

  const executeMonsterAttack = () => {
    if (!currentMonster || isDead) return;
    const rawDmg = currentMonster.attack;
    const finalDmg = Math.max(1, rawDmg - calculatedStats.defense);

    onPlayerDamaged(finalDmg);
    addLog(`🛡️ [피격] ${currentMonster.name}이(가) 나를 타격하여 -${finalDmg} 피해를 주었습니다!`);

    // Check player death status
    if (gameState.hp <= finalDmg) {
      handlePlayerDefeat();
    }
  };

  const handlePlayerDefeat = () => {
    setIsDead(true);
    addLog(`💀 [사망] 몬스터 공격을 견디지 못하고 쓰러졌습니다. 안전지대(초보자의 숲)로 이송 중...`);
    setRespawnCountdown(3);

    // Stop loops
    if (monsterAttackIntervalRef.current) clearInterval(monsterAttackIntervalRef.current);
    if (autoAttackIntervalRef.current) clearInterval(autoAttackIntervalRef.current);

    const countdown = setInterval(() => {
      setRespawnCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          setIsDead(false);
          // Safely respawn
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Core Combat Slaying Calculation
  const executeCombatDamage = (isManualClick: boolean, clickEvent?: React.MouseEvent) => {
    if (!currentMonster || isDead || monsterCurrentHp <= 0) return;

    // Trigger click visual hooks
    if (isManualClick) {
      onPlayerClickHook();
      setShieldHitActive(true);
      setTimeout(() => setShieldHitActive(false), 80);
    }

    setMonsterShake(true);
    setTimeout(() => setMonsterShake(false), 120);

    // Roll critical
    const rollCrit = (Math.random() * 100) < calculatedStats.criticalRate;
    let finalDmg = calculatedStats.attack;

    if (rollCrit) {
      finalDmg = Math.floor(finalDmg * (calculatedStats.criticalDamage / 100));
    }

    // Determine damage coordinates
    let coordX = 50 + (Math.random() * 40 - 20); // random offset %
    let coordY = 40 + (Math.random() * 20 - 10);

    if (clickEvent) {
      const rect = clickEvent.currentTarget.getBoundingClientRect();
      coordX = ((clickEvent.clientX - rect.left) / rect.width) * 100;
      coordY = ((clickEvent.clientY - rect.top) / rect.height) * 100;
    }

    // Add floating visual particle
    const labelId = `dmg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    setFloatingDamages((prev) => [
      ...prev,
      {
        id: labelId,
        value: finalDmg.toLocaleString(),
        x: coordX,
        y: coordY,
        isCrit: rollCrit,
      },
    ]);

    // Cleanup floating particles in 700ms
    setTimeout(() => {
      setFloatingDamages((prev) => prev.filter((d) => d.id !== labelId));
    }, 700);

    // Deduct monster health
    const nextHp = Math.max(0, monsterCurrentHp - finalDmg);
    setMonsterCurrentHp(nextHp);

    if (nextHp <= 0) {
      handleMonsterSlayed();
    }
  };

  const handleMonsterSlayed = () => {
    if (!currentMonster) return;
    const isBoss = currentMonster.isBoss;

    // Standard baseline multipliers
    const specGold = Math.floor(currentMonster.gold * calculatedStats.goldMultiplier);
    const specExp = Math.floor(currentMonster.exp * calculatedStats.expMultiplier);

    // Drop equipment calculation
    let gearDrop = null;
    let stoneDrop = null;

    // Equipment rolls:
    // Regular has 12% drop probability, Boss has 100% guaranteed gear drop chance
    const dropPercentRoll = Math.random() * 100;
    const equipmentDropChanceLimit = 12 * calculatedStats.dropMultiplier;

    if (isBoss || (dropPercentRoll < equipmentDropChanceLimit)) {
      // Call utility drop generator
      gearDrop = generateRandomEquipment(activeZoneIndex, isBoss);
    }

    // Stone rolls:
    // Regular monster rolls drop stones (15% base rate * drop multiplier). Boss has 100% guaranteed T1~T7 upgrade stones!
    const stoneRoll = Math.random() * 100;
    if (isBoss || (stoneRoll < (15 * calculatedStats.dropMultiplier))) {
      // Pick from zone allowed materials
      const allowedMats = activeZone.matsDropped;
      stoneDrop = allowedMats[Math.floor(Math.random() * allowedMats.length)];
    }

    // Trigger state callbacks
    onMonsterKilled(specGold, specExp, isBoss, gearDrop, stoneDrop);

    // Create gorgeous dynamic loot popups scattering around the click button!
    const droppedItemsList: VisualDrop[] = [];
    const nowId = Date.now();

    const getScatterPos = (index: number, total: number) => {
      // Circular offset scatter logic
      const angle = (index * (2 * Math.PI) / total) - (Math.PI / 2) + (Math.random() * 0.3 - 0.15);
      const radius = 65 + Math.random() * 25;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      };
    };

    const dropProps: { type: 'gold' | 'exp' | 'gear' | 'stone'; name: string; amount: string; icon: string; colorClass: string; rarity?: string }[] = [
      { type: 'gold', name: `+${specGold.toLocaleString()}`, amount: '골드 획득', icon: '🪙', colorClass: 'text-amber-400 font-extrabold' },
      { type: 'exp', name: `+${specExp.toLocaleString()} XP`, amount: '경험치 획득', icon: '✨', colorClass: 'text-cyan-400 font-extrabold' }
    ];

    if (gearDrop) {
      const spec = RARITY_TABLE[gearDrop.rarity];
      dropProps.push({
        type: 'gear' as const,
        name: gearDrop.name,
        amount: `[${spec?.name || '장비'}]`,
        icon: gearDrop.type === 'weapon' ? '⚔️' : '🛡️',
        colorClass: `${spec?.color || 'text-neutral-200'} font-black`,
        rarity: gearDrop.rarity
      } as any);
    }

    if (stoneDrop) {
      dropProps.push({
        type: 'stone' as const,
        name: STONE_NAMES[stoneDrop] ? STONE_NAMES[stoneDrop].split(' ')[0] : '강화석',
        amount: `[${stoneDrop.toUpperCase()} 가공석]`,
        icon: '💎',
        colorClass: 'text-purple-400 font-black'
      });
    }

    dropProps.forEach((d, idx) => {
      const pos = getScatterPos(idx, dropProps.length);
      droppedItemsList.push({
        id: `drop_${nowId}_${idx}_${Math.random()}`,
        name: d.name,
        amount: d.amount,
        type: d.type,
        icon: d.icon,
        colorClass: d.colorClass,
        rarity: (d as any).rarity,
        x: pos.x,
        y: pos.y
      });
    });

    setVisualDrops((prev) => [...prev, ...droppedItemsList]);

    // Cleanup after 2.2 seconds
    setTimeout(() => {
      setVisualDrops((prev) => prev.filter(item => !droppedItemsList.some(d => d.id === item.id)));
    }, 2205);

    addLog(`⚔️ [처치] ${currentMonster.name} 격파완료! EXP +${specExp}, GOLD +${specGold}`);
    if (gearDrop) {
      addLog(`✨ [전리품 발견] [${RARITY_TABLE[gearDrop.rarity].name}] 등급 ${gearDrop.name} 장비를 손에 얻었습니다!`);
    }
    if (stoneDrop) {
      addLog(`💎 [가공석 파편] ${STONE_NAMES[stoneDrop]} 강화석을 전장에서 캐내었습니다.`);
    }

    // Let state refresh a subtle delay, then spawn next
    setTimeout(() => {
      spawnNewMonster();
    }, 280);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Target active hunting zone metadata - Col span 4 */}
      <div className={`lg:col-span-4 bg-neutral-900/70 border ${theme.borderColor} rounded-2xl p-4 backdrop-blur-md space-y-3 transition-colors duration-500`}>
        <div className="flex items-center gap-2">
          <Compass className={`w-4 h-4 ${theme.accentIconColor} animate-spin-slow`} />
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-neutral-400">관할 사냥터 정보</h3>
        </div>
        
        <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-850">
          <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">진행 중인 게이트</div>
          <p className={`text-base font-black mt-1 tracking-tight ${theme.titleColor}`}>{activeZone.name}</p>
          <div className="text-[10px] text-neutral-500 font-mono mt-2 flex justify-between">
            <span>권장 공격력:</span>
            <span className={`font-bold ${theme.titleColor}`}>{activeZone.recAttack.toLocaleString()} AP</span>
          </div>
        </div>

        {/* Brand new immersive description lore box */}
        <div className={`p-3 rounded-xl border bg-neutral-950/50 ${theme.borderColor} text-[11px] leading-relaxed text-neutral-400 min-h-[58px] transition-all duration-300`}>
          {theme.ambientVibeText}
        </div>

        {/* Boss progression */}
        <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-850 space-y-1.5">
          <div className="flex justify-between text-[11px] font-bold">
            <span className="text-neutral-450">&apos;네임드 보스&apos; 소출 권한</span>
            <span className={`font-mono font-black ${theme.titleColor}`}>{gameState.huntingZoneKills} / 100</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-850">
            <div
              className={`h-full bg-gradient-to-r from-red-650 to-amber-500 transition-all duration-300 rounded-full`}
              style={{ width: `${Math.min(100, gameState.huntingZoneKills)}%` }}
            ></div>
          </div>
          <p className="text-[9px] text-neutral-500 leading-normal">
            {gameState.huntingZoneKills >= 100 
              ? '★ 토벌 준비 완료! 게이트 최종 거대 보스가 대기를 채웁니다!' 
              : '전장 수호자 100마리를 소멸 시, 궁극의 옵션을 가진 보스가 게이트를 막아섭니다.'}
          </p>
        </div>

        {/* Combat logging logs */}
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">전장 작전 상세 보고</h4>
          <div className="bg-neutral-950/90 rounded-xl border border-neutral-850/70 p-3 h-[140px] overflow-y-auto space-y-2 text-[11px] font-mono leading-relaxed">
            {combatLogs.map((log, idx) => (
              <p key={idx} className={idx === 0 ? `${theme.titleColor} font-bold` : 'text-neutral-500'}>
                {log}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Main Clicking Canvas Slaying Stage - Col span 8 */}
      <div className={`lg:col-span-8 bg-gradient-to-b ${theme.bgGradient} border ${theme.borderColor} ${theme.glowColor} rounded-2xl p-5 relative min-h-[440px] flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-500`}>
        
        {/* Dynamic ambient radial glow backing */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[85px] pointer-events-none opacity-50 ${theme.ambientGlow} transition-colors duration-500 z-0`}></div>

        {/* Dynamic Floating Ambient Particle Emitters */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl z-0">
          {theme.particles.map((p, idx) => {
            const duration = 12 + (idx * 4);
            const delay = idx * 2;
            return (
              <motion.div
                key={idx}
                className={`absolute select-none font-sans filter blur-[0.4px] ${p.textClass}`}
                initial={{ 
                  top: `${15 + (idx * 28) % 70}%`, 
                  left: `${10 + (idx * 33) % 80}%`, 
                  opacity: 0.1, 
                  scale: 0.9 
                }}
                animate={{
                  y: [-30, 30, -30],
                  x: [-20, 20, -20],
                  rotate: [0, 180, 360],
                  opacity: [0.15, 0.6, 0.15],
                  scale: [0.9, 1.3, 0.9]
                }}
                transition={{
                  duration: duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: delay
                }}
              >
                {p.emoji}
              </motion.div>
            );
          })}
        </div>

        {/* Absolute Dead overlay respawn */}
        <AnimatePresence>
          {isDead && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-neutral-950/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-6 rounded-2xl"
            >
              <AlertCircle className="w-12 h-12 text-red-500 animate-bounce mb-3" />
              <h3 className="text-lg font-black text-red-400 font-sans">헌터가 전투 중 사망하였습니다!</h3>
              <p className="text-xs text-neutral-500 max-w-sm mt-1 mb-6">
                공격력을 더 늘리거나 내구력(체력/방어력)을 강화소 및 특성창에서 보강 및 수련하십시오.
              </p>
              <div className="text-xl font-bold font-mono">
                성당 소생까지 후송 카운트다운... <span className="text-rose-500 font-black">{respawnCountdown}초</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {currentMonster ? (
          <div className="flex-1 flex flex-col justify-between gap-6 z-10">
            
            {/* Monster name and Level */}
            <div className="flex justify-between items-center bg-neutral-955/80 p-3 rounded-xl border border-neutral-850/60 backdrop-blur-md flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Swords className={`w-4 h-4 ${currentMonster.isBoss ? 'text-red-500 animate-pulse' : 'text-neutral-400'}`} />
                <span className={`text-sm font-bold font-sans ${currentMonster.isBoss ? 'text-red-500 font-black scale-102 inline-block' : 'text-neutral-200'}`}>
                  {currentMonster.name} {currentMonster.isBoss && '👹 (영지 보스)'}
                </span>
              </div>

              <div className="flex gap-2">
                <span className="text-xs font-mono bg-neutral-950 border border-neutral-850 px-2 py-0.5 rounded text-neutral-400">
                  체력 {monsterCurrentHp.toLocaleString()} / {monsterMaxHp.toLocaleString()}
                </span>
              </div>
            </div>

            {/* HP Sliders */}
            <div className="w-full h-3.5 bg-neutral-955 rounded-full overflow-hidden border border-neutral-850 relative">
              <div
                className="h-full bg-gradient-to-r from-red-650 via-rose-550 to-red-600 transition-all duration-75 rounded-full shadow-lg"
                style={{ width: `${(monsterCurrentHp / monsterMaxHp) * 100}%` }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black tracking-widest font-mono text-white select-none drop-shadow">
                {((monsterCurrentHp / monsterMaxHp) * 100).toFixed(1)}%
              </div>
            </div>

            {/* Click Interactive Action Circle canvas space */}
            <div className="flex-1 flex items-center justify-center relative min-h-[160px]">
              
              {/* Slaying Item Loot Drop pop-up badges */}
              <div className="absolute inset-0 pointer-events-none z-30 overflow-visible flex items-center justify-center">
                <AnimatePresence>
                  {visualDrops.map((drop) => {
                    // Determine background design based on type & rarity
                    let cardStyle = "bg-neutral-950/90 border border-neutral-800 text-neutral-200 shadow-md";
                    if (drop.type === 'gear' && drop.rarity) {
                      const rspec = RARITY_TABLE[drop.rarity as any];
                      cardStyle = `${rspec?.bgColor || 'bg-neutral-900 border border-neutral-800'} ${rspec?.glowColor || 'shadow-[0_0_8px_rgba(255,255,255,0.15)]'} border-2`;
                    } else if (drop.type === 'stone') {
                      cardStyle = "bg-purple-950/90 border border-purple-800 shadow-[0_0_12px_rgba(168,85,247,0.3)] text-purple-200";
                    } else if (drop.type === 'gold') {
                      cardStyle = "bg-amber-950/90 border border-amber-800/80 text-amber-200 shadow-[0_0_6px_rgba(245,158,11,0.2)]";
                    } else if (drop.type === 'exp') {
                      cardStyle = "bg-cyan-950/90 border border-cyan-800/80 text-cyan-200 shadow-[0_0_6px_rgba(6,182,212,0.2)]";
                    }

                    return (
                      <motion.div
                        key={drop.id}
                        initial={{ opacity: 0, scale: 0.2, x: 0, y: 0 }}
                        animate={{
                          opacity: [0, 1, 1, 0],
                          scale: [0.2, 1.1, 1, 0.75],
                          x: drop.x,
                          y: [0, drop.y, drop.y - 45]
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 2.1,
                          times: [0, 0.12, 0.85, 1],
                          ease: "easeOut"
                        }}
                        className={`absolute z-35 pointer-events-none select-none rounded-xl px-2.5 py-1.5 flex items-center gap-2 backdrop-blur-md border ${cardStyle}`}
                      >
                        <span className="text-sm filter drop-shadow-md">{drop.icon}</span>
                        <div className="flex flex-col text-left leading-tight shrink-0 max-w-[120px]">
                          {drop.amount && (
                            <span className="text-[8px] font-black tracking-wide text-neutral-400 font-mono scale-90 -ml-0.5 uppercase mb-0.5">
                              {drop.amount}
                            </span>
                          )}
                          <span className={`${drop.colorClass} truncate text-[11px] font-bold`}>
                            {drop.name}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Slaying particle effects pop-up anchors */}
              <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                <AnimatePresence>
                  {floatingDamages.map((dmg) => (
                    <motion.span
                      key={dmg.id}
                      initial={{ opacity: 1, scale: 0.8, y: `${dmg.y}%`, x: `${dmg.x}%` }}
                      animate={{ opacity: 0, scale: 1.4, y: `${dmg.y - 35}%` }}
                      exit={{ opacity: 0 }}
                      className={`absolute font-black font-mono tracking-tighter text-lg select-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${
                        dmg.isCrit ? 'text-yellow-400 font-black text-2xl tracking-tight' : 'text-rose-500 font-extrabold'
                      }`}
                    >
                      {dmg.isCrit ? `⚡CRIT ${dmg.value}` : dmg.value}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>

              {/* Big Slaying Interactive target button */}
              <motion.button
                onMouseDown={(e) => {
                  e.preventDefault();
                  executeCombatDamage(true, e);
                }}
                animate={monsterShake ? { x: [1, -5, 5, -5, 4, 0], scale: 1.02 } : { scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-36 h-36 rounded-full flex flex-col items-center justify-center gap-1.5 cursor-pointer relative font-sans transition-all z-10 select-none shadow-2xl focus:outline-none border-4 outline-none ${
                  currentMonster.isBoss 
                    ? 'bg-rose-950/50 border-red-500 hover:border-red-400 text-red-500 shadow-red-950/60'
                    : `bg-neutral-950/70 hover:bg-neutral-950/90 ${theme.buttonBorderColor} ${theme.buttonGlow} hover:brightness-110`
                }`}
              >
                {/* Visual core ripple glow */}
                <div className={`absolute inset-2 rounded-full border border-dashed transition-transform duration-300 opacity-20 ${
                  currentMonster.isBoss ? 'border-red-500 animate-spin-slow' : 'border-neutral-500 animate-spin-slow'
                }`}></div>

                <Swords className={`w-10 h-10 ${currentMonster.isBoss ? 'text-red-505 animate-pulse' : theme.accentIconColor}`} />
                <span className="text-[10px] uppercase font-black tracking-widest leading-none mt-2">
                  {currentMonster.isBoss ? '보스 퇴치' : '클릭격파'}
                </span>
                <span className="text-[8px] opacity-60">마구 연타 가능</span>
              </motion.button>

            </div>

            {/* Combat status helpers: user HP stat and speed triggers */}
            <div className="flex justify-between items-center bg-neutral-955/80 p-3.5 rounded-xl border border-neutral-850/60 backdrop-blur-md flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></div>
                <span className="text-neutral-400 text-xs">영웅 생명력:</span>
                <span className="font-extrabold font-mono text-sm text-red-400">
                  {gameState.hp.toLocaleString()} / {calculatedStats.maxHp.toLocaleString()} hp
                </span>
              </div>

              {gameState.skills.autoHuntLevel > 0 && (
                <div className="flex items-center gap-1.5 text-purple-400 font-extrabold text-xs">
                  <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span>소환수 자동 사격 (속도: {calculatedStats.attackSpeed}회/초)</span>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 py-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mb-3 text-rose-500" />
            <p className="text-sm font-block">전장 탐색 및 기습 준비 중...</p>
          </div>
        )}

      </div>
    </div>
  );
}
