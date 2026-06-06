import { useState, useEffect } from 'react';
import { GameState, Equipment, SkillTree, RebirthUpgrades } from './types';
import { ACHIEVEMENTS_LIST, HUNTING_ZONES, STONE_NAMES, RARITY_TABLE } from './data';
import { calculateCalculatedStats } from './utils';
import AuthModal from './components/AuthModal';
import LeaderboardView from './components/LeaderboardView';
import InventoryView from './components/InventoryView';
import BlacksmithView from './components/BlacksmithView';
import SkillTreeView from './components/SkillTreeView';
import BattlefieldView from './components/BattlefieldView';

import {
  Swords, Backpack, Hammer, Award, User, LogIn, LogOut,
  Save, Trophy, HelpCircle, Shield, Play, ChevronRight, Sparkles, Flame, Coins, Lock, Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const LOCAL_STORAGE_KEY = 'endless_hunter_local_save';

const defaultInitialState: GameState = {
  userId: 'guest_player',
  nickname: '신입 헌터(게스트)',
  level: 1,
  exp: 0,
  nextExp: 20,
  gold: 0,
  rebirthPoints: 0,
  rebirthCount: 0,
  bossKills: 0,
  hp: 100,
  rebirthUpgrades: {
    attackMultiplier: 0,
    expMultiplier: 0,
    dropMultiplier: 0,
    goldMultiplier: 0
  },
  equippedItems: {
    helmet: null,
    armor: null,
    pants: null,
    shoes: null,
    weapon: null
  },
  inventory: [],
  upgradeStones: { t1: 0, t2: 0, t3: 0, t4: 0, t5: 0, t6: 0, t7: 0 },
  skills: {
    attackLevel: 0,
    defenseLevel: 0,
    criticalLevel: 0,
    autoHuntLevel: 0,
    dropLevel: 0
  },
  unlockedHuntingZones: ['초보자의 숲'],
  currentHuntingZone: '초보자의 숲',
  huntingZoneKills: 0,
  achievements: {
    slimeKills: 0,
    demonLordKills: 0,
    totalKills: 0,
    totalClicks: 0,
    totalGoldEarned: 0,
    unlockedAchievements: []
  }
};

export default function App() {
  const [user, setUser] = useState<{ userId: string; nickname: string } | null>(null);
  const [gameState, setGameState] = useState<GameState>(defaultInitialState);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'combat' | 'inventory' | 'blacksmith' | 'skills' | 'achievements'>('combat');
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'done'>('idle');

  // Load state from localStorage on init
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure nesting safety
        if (parsed && typeof parsed === 'object') {
          // Fallback missing properties with defaults
          const merged = { ...defaultInitialState, ...parsed };
          setGameState(merged);
          
          if (merged.userId !== 'guest_player') {
            setUser({ userId: merged.userId, nickname: merged.nickname });
          }
        }
      }
    } catch (e) {
      console.error('Error restoring localStorage:', e);
    }
  }, []);

  // Save to localStorage every time gameState changes
  useEffect(() => {
    if (gameState) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gameState));
    }
  }, [gameState]);

  // Recalculate stats dynamically
  const calculatedStats = calculateCalculatedStats(gameState);

  // Auto passive player HP recovery clock (Heal 5% HP every 1.5s up to maxHp)
  useEffect(() => {
    const hpRegen = setInterval(() => {
      setGameState((prev) => {
        if (prev.hp >= calculatedStats.maxHp) return prev;
        const healed = Math.min(calculatedStats.maxHp, prev.hp + Math.ceil(calculatedStats.maxHp * 0.05));
        return { ...prev, hp: healed };
      });
    }, 1500);

    return () => clearInterval(hpRegen);
  }, [calculatedStats.maxHp, gameState.hp]);

  // Cloud Auto Sync timer (runs every 20 seconds if user logged in)
  useEffect(() => {
    if (!user) return;

    const autoSave = setInterval(() => {
      performCloudSave(gameState);
    }, 20000);

    return () => clearInterval(autoSave);
  }, [user, gameState]);

  // Cloud Save worker
  const performCloudSave = async (stateToSave: GameState) => {
    if (!user) return;
    setSavingStatus('saving');
    try {
      const response = await fetch('/api/game/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.userId,
          gameState: stateToSave
        })
      });

      if (!response.ok) throw new Error('Cloud save failed');

      setSavingStatus('done');
      setTimeout(() => setSavingStatus('idle'), 2000);
    } catch (err) {
      console.error('Auto cloud sync failed:', err);
      setSavingStatus('idle');
    }
  };

  // Auth Handler
  const handleAuthSuccess = (userData: { userId: string; nickname: string; gameState: any }) => {
    setUser({ userId: userData.userId, nickname: userData.nickname });
    // Merge latest cloud state
    setGameState(userData.gameState);
    alert(`반갑습니다 헌터! ${userData.nickname}님의 클라우드 데이터를 성공적으로 연동해 가져왔습니다.`);
  };

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까? 게스트 오프라인 데이터를 기반으로 계속 플레이할 수 있습니다.')) {
      setUser(null);
      // Reset user snap
      setGameState({
        ...gameState,
        userId: 'guest_player',
        nickname: '신입 헌터(게스트)'
      });
      alert('정상적으로 로그아웃되었습니다.');
    }
  };

  // Slay rewards callback
  const handleMonsterKilled = (
    goldGained: number,
    expGained: number,
    isBoss: boolean,
    drops: Equipment | null,
    stone: string | null
  ) => {
    setGameState((prev) => {
      // 1. Gold and EXP
      let newGold = prev.gold + goldGained;
      let newExp = prev.exp + expGained;
      let newLevel = prev.level;
      let newNextExp = prev.nextExp;

      // Achievements trackers
      let slimeKills = prev.achievements.slimeKills;
      let demonLordKills = prev.achievements.demonLordKills;
      let totalKills = prev.achievements.totalKills + 1;
      let totalGoldEarned = prev.achievements.totalGoldEarned + goldGained;
      let unlockedAchievements = [...prev.achievements.unlockedAchievements];

      // Track wood slime kills
      if (prev.currentHuntingZone === '초보자의 숲') {
        slimeKills += 1;
      }

      // Check level-up
      while (newExp >= newNextExp) {
        newExp -= newNextExp;
        newLevel += 1;
        // next exp scaling base 20 (base model is geometric/additive)
        newNextExp = Math.floor(20 + newLevel * 10 + Math.pow(newLevel, 1.6));
      }

      // 2. Resolve equipment drops
      const newInventory = [...prev.inventory];
      if (drops) {
        if (newInventory.length < 50) {
          newInventory.push(drops);
          
          // Achieve track - legendary acquired
          if ((drops.rarity === 'legendary' || drops.rarity === 'mythic' || drops.rarity === 'transcendent' || drops.rarity === 'absolute') && !unlockedAchievements.includes('first_legendary')) {
            unlockedAchievements.push('first_legendary');
          }
        } else {
          // Auto sell as compensation if pack is full
          const basePrices = {
            common: 50, uncommon: 180, rare: 650, epic: 3500,
            legendary: 25000, mythic: 180000, transcendent: 1500000, absolute: 15000000
          };
          const rawSell = basePrices[drops.rarity] || 50;
          newGold += rawSell;
        }
      }

      // 3. Resolve stones
      const newStones = { ...prev.upgradeStones };
      if (stone) {
        const key = stone as keyof typeof prev.upgradeStones;
        newStones[key] = (newStones[key] || 0) + 1;
      }

      // 4. Resolve boss kills progress
      let newBossKills = prev.bossKills;
      let huntingZoneKills = prev.huntingZoneKills;

      if (isBoss) {
        newBossKills += 1;
        
        // Final Demon Lord killed check
        if (prev.currentHuntingZone === '마왕의 성') {
          demonLordKills += 1;
          if (!unlockedAchievements.includes('demon_slayer')) {
            unlockedAchievements.push('demon_slayer');
          }
        }

        // Cave boss kill metrics
        if (prev.currentHuntingZone === '어두운 동굴' && !unlockedAchievements.includes('boss_slayer_1') && newBossKills >= 10) {
          unlockedAchievements.push('boss_slayer_1');
        }

        // Reset stage minions counter
        huntingZoneKills = 0;
      } else {
        huntingZoneKills += 1;
      }

      // Evaluate automatic achievements progress triggers
      if (slimeKills >= 100 && !unlockedAchievements.includes('slime_hunter')) {
        unlockedAchievements.push('slime_hunter');
      }
      if (totalGoldEarned >= 1000000 && !unlockedAchievements.includes('master_enchancer')) {
        // will let forge success trigger 'master_enchancer' directly
      }
      if (prev.achievements.totalClicks >= 2000 && !unlockedAchievements.includes('clicker_god')) {
        unlockedAchievements.push('clicker_god');
      }

      return {
        ...prev,
        level: newLevel,
        exp: newExp,
        nextExp: newNextExp,
        gold: newGold,
        bossKills: newBossKills,
        huntingZoneKills,
        inventory: newInventory,
        upgradeStones: newStones,
        achievements: {
          ...prev.achievements,
          slimeKills,
          demonLordKills,
          totalKills,
          totalGoldEarned,
          unlockedAchievements
        }
      };
    });
  };

  // Player click monitoring (achievement purposes)
  const handlePlayerClickHook = () => {
    setGameState((prev) => {
      const nextClicks = prev.achievements.totalClicks + 1;
      const unlocked = [...prev.achievements.unlockedAchievements];
      if (nextClicks >= 2000 && !unlocked.includes('clicker_god')) {
        unlocked.push('clicker_god');
      }
      return {
        ...prev,
        achievements: {
          ...prev.achievements,
          totalClicks: nextClicks,
          unlockedAchievements: unlocked
        }
      };
    });
  };

  // Combat damage suffered
  const handlePlayerDamaged = (dmg: number) => {
    setGameState((prev) => {
      const nextHp = Math.max(0, prev.hp - dmg);
      return { ...prev, hp: nextHp };
    });
  };

  // Equip triggers
  const handleEquip = (item: Equipment) => {
    setGameState((prev) => {
      const slot = item.type as 'helmet' | 'armor' | 'pants' | 'shoes' | 'weapon';
      const alreadyEquipped = prev.equippedItems?.[slot];

      let nextInventory = prev.inventory.filter((i) => i.id !== item.id);
      if (alreadyEquipped) {
        nextInventory.push(alreadyEquipped);
      }

      return {
        ...prev,
        equippedItems: {
          ...prev.equippedItems,
          [slot]: item
        },
        inventory: nextInventory
      };
    });
  };

  // Unequip triggers
  const handleUnequip = (slot: 'helmet' | 'armor' | 'pants' | 'shoes' | 'weapon') => {
    setGameState((prev) => {
      const item = prev.equippedItems?.[slot];
      if (!item) return prev;

      if (prev.inventory.length >= 50) {
        alert('보따리에 공간이 없어 장비 장착 해제가 불가능합니다!');
        return prev;
      }

      return {
        ...prev,
        equippedItems: {
          ...prev.equippedItems,
          [slot]: null
        },
        inventory: [...prev.inventory, item]
      };
    });
  };

  // Sell items
  const handleSell = (item: Equipment) => {
    const basePrices = {
      common: 50, uncommon: 180, rare: 650, epic: 3500,
      legendary: 25000, mythic: 180000, transcendent: 1500000, absolute: 15000000
    };
    const mult = basePrices[item.rarity] || 50;
    const finalRewardPrice = mult + Math.floor(mult * item.enhanceLevel * 0.3);

    setGameState((prev) => ({
      ...prev,
      gold: prev.gold + finalRewardPrice,
      inventory: prev.inventory.filter((i) => i.id !== item.id)
    }));
  };

  // Dismantle gear for stones
  const handleDismantle = (item: Equipment) => {
    let stoneType = 't1';
    let amount = 1;

    switch (item.rarity) {
      case 'common': stoneType = 't1'; amount = Math.random() < 0.5 ? 1 : 2; break;
      case 'uncommon': stoneType = 't2'; amount = 1; break;
      case 'rare': stoneType = 't3'; amount = 1; break;
      case 'epic': stoneType = 't4'; amount = Math.random() < 0.4 ? 1 : 2; break;
      case 'legendary': stoneType = 't5'; amount = 1; break;
      case 'mythic': stoneType = 't6'; amount = 1; break;
      case 'transcendent': stoneType = 't7'; amount = 1; break;
      case 'absolute': stoneType = 't7'; amount = Math.floor(2 + Math.random() * 3); break;
    }

    setGameState((prev) => {
      const key = stoneType as keyof typeof prev.upgradeStones;
      const updatedInventory = prev.inventory.filter((i) => i.id !== item.id);
      const updatedStones = { ...prev.upgradeStones };
      updatedStones[key] = (updatedStones[key] || 0) + amount;

      return {
        ...prev,
        inventory: updatedInventory,
        upgradeStones: updatedStones
      };
    });

    alert(`[분해 통보] ${item.name}의 해체 분석을 성료하여 ${STONE_NAMES[stoneType]} ${amount}개를 수거했습니다.`);
  };

  // Blacksmith select redirect shortcut
  const handleSelectForEnhance = (item: Equipment) => {
    setActiveTab('blacksmith');
  };

  // Enhancement successes
  const handleEnhanceSuccess = (itemId: string, nextLevel: number) => {
    setGameState((prev) => {
      // 1. Deduct stone resource
      const stats = require('./utils').getEnhanceSpecs(nextLevel - 1);
      const stoneKey = stats.stoneTierNeeded as keyof typeof prev.upgradeStones;
      const updatedStones = { ...prev.upgradeStones };
      updatedStones[stoneKey] = Math.max(0, (updatedStones[stoneKey] || 0) - stats.stonesRequired);

      // 2. Update item in equipped slots or inventory
      const nextEquipped = { ...prev.equippedItems };
      let foundInSlot = false;

      const slotsKeys: ('helmet' | 'armor' | 'pants' | 'shoes' | 'weapon')[] = [
        'helmet', 'armor', 'pants', 'shoes', 'weapon'
      ];
      slotsKeys.forEach((s) => {
        const eq = nextEquipped[s];
        if (eq && eq.id === itemId) {
          nextEquipped[s] = { ...eq, enhanceLevel: nextLevel };
          foundInSlot = true;
        }
      });

      let nextInventory = prev.inventory;
      if (!foundInSlot) {
        nextInventory = prev.inventory.map((i) =>
          i.id === itemId ? { ...i, enhanceLevel: nextLevel } : i
        );
      }

      // Achievement check High upgrade
      const unlocked = [...prev.achievements.unlockedAchievements];
      if (nextLevel >= 15 && !unlocked.includes('master_enchancer')) {
        unlocked.push('master_enchancer');
      }

      return {
        ...prev,
        upgradeStones: updatedStones,
        equippedItems: nextEquipped,
        inventory: nextInventory,
        achievements: {
          ...prev.achievements,
          unlockedAchievements: unlocked
        }
      };
    });
  };

  // Enhancement failures
  const handleEnhanceFail = (itemId: string, nextLevel: number, msg: string) => {
    setGameState((prev) => {
      // Deduct stones based on OLD level (oldLevel = nextLevel + 1 if degraded, else level stays same)
      const isDegraded = prev.inventory.find(i => i.id === itemId)?.enhanceLevel !== nextLevel;
      const oldLevel = isDegraded ? nextLevel + 1 : nextLevel;

      const stats = require('./utils').getEnhanceSpecs(oldLevel);
      const stoneKey = stats.stoneTierNeeded as keyof typeof prev.upgradeStones;
      const updatedStones = { ...prev.upgradeStones };
      updatedStones[stoneKey] = Math.max(0, (updatedStones[stoneKey] || 0) - stats.stonesRequired);

      const nextEquipped = { ...prev.equippedItems };
      const slotsKeys: ('helmet' | 'armor' | 'pants' | 'shoes' | 'weapon')[] = [
        'helmet', 'armor', 'pants', 'shoes', 'weapon'
      ];
      slotsKeys.forEach((s) => {
        const eq = nextEquipped[s];
        if (eq && eq.id === itemId) {
          nextEquipped[s] = { ...eq, enhanceLevel: nextLevel };
        }
      });

      const nextInventory = prev.inventory.map((i) =>
        i.id === itemId ? { ...i, enhanceLevel: nextLevel } : i
      );

      return {
        ...prev,
        upgradeStones: updatedStones,
        equippedItems: nextEquipped,
        inventory: nextInventory
      };
    });
  };

  // Enhancement destruction
  const handleEnhanceDestroy = (itemId: string, msg: string) => {
    setGameState((prev) => {
      // Find old item to extract parameters
      let oldLvl = 20;
      const eqSlots: ('helmet' | 'armor' | 'pants' | 'shoes' | 'weapon')[] = [
        'helmet', 'armor', 'pants', 'shoes', 'weapon'
      ];
      eqSlots.forEach((s) => {
        if (prev.equippedItems?.[s]?.id === itemId) {
          oldLvl = prev.equippedItems[s]?.enhanceLevel || 20;
        }
      });
      const inInv = prev.inventory.find(i => i.id === itemId);
      if (inInv) oldLvl = inInv.enhanceLevel;

      const stats = require('./utils').getEnhanceSpecs(oldLvl);
      const stoneKey = stats.stoneTierNeeded as keyof typeof prev.upgradeStones;
      const updatedStones = { ...prev.upgradeStones };
      updatedStones[stoneKey] = Math.max(0, (updatedStones[stoneKey] || 0) - stats.stonesRequired);

      // Remove from equipment
      const nextEquipped = { ...prev.equippedItems };
      eqSlots.forEach((s) => {
        if (nextEquipped[s]?.id === itemId) {
          nextEquipped[s] = null;
        }
      });

      const nextInventory = prev.inventory.filter((i) => i.id !== itemId);
      // Give some gold compensation
      const compensationGold = 250000;

      return {
        ...prev,
        gold: prev.gold + compensationGold,
        upgradeStones: updatedStones,
        equippedItems: nextEquipped,
        inventory: nextInventory
      };
    });
  };

  // Gold skill upgrades
  const handleUpgradeSkill = (skillKey: keyof SkillTree, goldCost: number) => {
    if (gameState.gold < goldCost) return;
    setGameState((prev) => ({
      ...prev,
      gold: prev.gold - goldCost,
      skills: {
        ...prev.skills,
        [skillKey]: (prev.skills?.[skillKey] || 0) + 1
      }
    }));
  };

  // Rebirth perk points upgrades
  const handleUpgradeRebirthPerk = (perkKey: keyof RebirthUpgrades, pointsCost: number) => {
    if (gameState.rebirthPoints < pointsCost) return;
    setGameState((prev) => ({
      ...prev,
      rebirthPoints: prev.rebirthPoints - pointsCost,
      rebirthUpgrades: {
        ...prev.rebirthUpgrades,
        [perkKey]: (prev.rebirthUpgrades?.[perkKey] || 0) + 1
      }
    }));
  };

  // Active zone toggles
  const handleSwitchZone = (zoneName: string) => {
    setGameState((prev) => ({
      ...prev,
      currentHuntingZone: zoneName,
      // reset hunting progress
      huntingZoneKills: 0
    }));
  };

  // Rebirth Event Trigger
  const handleExecuteRebirth = () => {
    // Requires defeating Demon Lord or rebirthCount > 0
    const hasDemonSlayed = gameState.achievements.unlockedAchievements.includes('demon_slayer');
    if (!hasDemonSlayed && gameState.rebirthCount === 0) {
      alert('마왕의 성 최종 보스를 1회 물리쳐 인류를 구해야만 환생의 차원 자인 관문을 통과할 수 있습니다!');
      return;
    }

    if (!confirm('정말로 환생 가두를 가동시키겠습니까?\n\n환생 시 레벨(Lv.1), 골드(0), 일반 스킬 트리가 초기화되나 영구 지배자 환생 포인트를 획득하여 배가 성장이 가능해집니다.\n\n*장착된 및 보관된 장비 아이템은 안전하게 이송 및 유지됩니다!')) {
      return;
    }

    setGameState((prev) => {
      // Calculate gained points: base 1 point, +1 point per 10 boss milestones
      const gainedPoints = 1 + Math.floor(prev.bossKills / 10);
      const unlocked = [...prev.achievements.unlockedAchievements];
      if (!unlocked.includes('rebirth_1')) {
        unlocked.push('rebirth_1');
      }

      const resetState: GameState = {
        ...prev,
        level: 1,
        exp: 0,
        nextExp: 20,
        gold: 0,
        rebirthCount: prev.rebirthCount + 1,
        rebirthPoints: prev.rebirthPoints + gainedPoints,
        hp: 100, // base Hp
        skills: {
          attackLevel: 0,
          defenseLevel: 0,
          criticalLevel: 0,
          autoHuntLevel: 0,
          dropLevel: 0
        },
        unlockedHuntingZones: ['초보자의 숲'],
        currentHuntingZone: '초보자의 숲',
        huntingZoneKills: 0,
        achievements: {
          ...prev.achievements,
          unlockedAchievements: unlocked
        }
      };

      // Auto save on rebirth directly
      if (user) {
        performCloudSave(resetState);
      }

      return resetState;
    });

    alert('차원을 건너 환생에 성공하여, 한층 영검화된 헌터로 다시 태어났습니다!');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans flex flex-col justify-between">
      {/* 1. Universal Top Header bar */}
      <header className="sticky top-0 bg-neutral-900/90 border-b border-neutral-800/80 z-40 backdrop-blur-md px-4 py-3.5 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-950/40">
            <Swords className="w-5.5 h-5.5 text-white transform -rotate-12" />
          </div>
          <div>
            <h1 className="text-sm font-black font-sans leading-none tracking-tight text-neutral-100">
              Endless Hunter
            </h1>
            <p className="text-[10px] text-neutral-500 font-medium font-sans mt-1">
              Clicker Expansion RPG
            </p>
          </div>
        </div>

        {/* User Account Controls */}
        <div className="flex items-center gap-3.5">
          {savingStatus !== 'idle' && (
            <span className="text-[10px] uppercase font-bold text-neutral-500 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-sky-500 animate-pulse rounded-full"></span>
              {savingStatus === 'saving' ? '클라우드 백업중..' : '저장 완료'}
            </span>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <div className="bg-neutral-800/80 px-3 py-1.5 rounded-lg border border-neutral-700/50 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-xs font-bold leading-none">{user.nickname}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-neutral-300 transition-colors"
                title="로그아웃"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1.5 bg-rose-650 hover:bg-rose-550 text-white font-bold text-xs px-3 py-1.8 rounded-lg shadow transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              멀티 로그인/저장
            </button>
          )}

          <button
            onClick={() => user ? performCloudSave(gameState) : alert('수동 저장은 로그인 후 구동되며, 게스트 계정은 PC 브라우저에 임시 자동 저장됩니다!')}
            className="p-1.8 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg border border-neutral-700/50 transition-colors"
            title="수동 클라우드 저장"
          >
            <Save className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Top-tier Status bars (Level, Gold, Exp trackers) */}
      <section className="bg-neutral-900 border-b border-neutral-850 px-4 py-3 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Core level block */}
        <div className="md:col-span-4 flex items-center gap-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-center min-w-[70px]">
            <div className="text-[9px] font-bold text-neutral-500 leading-none">LEVEL</div>
            <p className="text-base font-black font-mono text-amber-400 mt-1">{gameState.level}</p>
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-neutral-400">사냥꾼 영성치 (EXP)</span>
              <span className="text-neutral-500 font-mono font-bold">
                {gameState.exp.toLocaleString()} / {gameState.nextExp.toLocaleString()} ({((gameState.exp / gameState.nextExp) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-850">
              <div
                className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                style={{ width: `${(gameState.exp / gameState.nextExp) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Current Gold state */}
        <div className="md:col-span-4 flex justify-between md:justify-center items-center bg-neutral-950/40 p-2 rounded-xl border border-neutral-800/50">
          <div className="flex items-center gap-2">
            <div className="w-6.5 h-6.5 bg-yellow-950/50 border border-yellow-750 rounded-lg flex items-center justify-center">
              <Coins className="w-4.5 h-4.5 text-yellow-400" />
            </div>
            <div>
              <div className="text-[9px] text-neutral-500 font-bold leading-none">모험가 자금 (GOLD)</div>
              <p className="text-sm font-extrabold text-neutral-200 mt-1 leading-none font-mono">
                {gameState.gold.toLocaleString()} 골드
              </p>
            </div>
          </div>
        </div>

        {/* Current Boss kills and rebirth milestones */}
        <div className="md:col-span-4 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-neutral-950 p-2 rounded-xl border border-neutral-800 text-center">
            <span className="text-[9px] text-neutral-500 font-bold block uppercase leading-none">보스 레이드</span>
            <span className="font-extrabold text-neutral-100 mt-1.5 block font-mono">
              {gameState.bossKills}마리 토벌
            </span>
          </div>

          <div className="bg-neutral-950 p-2 rounded-xl border border-neutral-800 text-center">
            <span className="text-[9px] text-neutral-500 font-bold block uppercase leading-none">차원 환생수</span>
            <span className="font-extrabold text-purple-400 mt-1.5 block font-mono">
              {gameState.rebirthCount}회 달성
            </span>
          </div>
        </div>
      </section>

      {/* 3. Main Dashboard Navigation tabs and layouts */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 gap-6">
        
        {/* Navigation Selector Rail */}
        <div className="flex bg-neutral-900 rounded-2xl p-1 border border-neutral-800 text-xs overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('combat')}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap outline-none ${
              activeTab === 'combat'
                ? 'bg-neutral-800 text-neutral-100 shadow'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Swords className="w-4 h-4 text-rose-500" />
            몬스터 사냥 (Combat)
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap outline-none ${
              activeTab === 'inventory'
                ? 'bg-neutral-800 text-neutral-100 shadow'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Backpack className="w-4 h-4 text-emerald-500" />
            보따리 인벤토리 (Inventory)
          </button>

          <button
            onClick={() => setActiveTab('blacksmith')}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap outline-none ${
              activeTab === 'blacksmith'
                ? 'bg-neutral-800 text-neutral-100 shadow'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Hammer className="w-4 h-4 text-amber-500" />
            무기 대장간 (Forge)
          </button>

          <button
            onClick={() => setActiveTab('skills')}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap outline-none ${
              activeTab === 'skills'
                ? 'bg-neutral-800 text-neutral-100 shadow'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Award className="w-4 h-4 text-purple-400" />
            수련소 & 환생 (Perks)
          </button>

          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap outline-none ${
              activeTab === 'achievements'
                ? 'bg-neutral-800 text-neutral-100 shadow'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Trophy className="w-4 h-4 text-yellow-500" />
            랭킹 및 업적 (Rank)
          </button>
        </div>

        {/* Selected View Canvas */}
        <div className="flex-1 min-h-[480px]">
          <AnimatePresence mode="wait">
            {activeTab === 'combat' && (
              <motion.div
                key="combat" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
              >
                {/* Huntington stage switcher */}
                <div className="bg-neutral-900/60 border border-neutral-800 px-4 py-3 rounded-2xl flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <Compass className="w-4.5 h-4.5 text-rose-500 animate-spin" style={{ animationDuration: '6s' }} />
                    <span className="text-xs font-bold text-neutral-400">사냥터 게이트 활성화:</span>
                  </div>

                  <div className="flex gap-1.5 flex-wrap">
                    {HUNTING_ZONES.map((zone, idx) => {
                      const isUnlocked = idx === 0 || gameState.rebirthCount > 0 || prevZoneDefeated(idx);
                      const isCurrent = gameState.currentHuntingZone === zone.name;

                      return (
                        <button
                          key={zone.name}
                          onClick={() => isUnlocked && handleSwitchZone(zone.name)}
                          disabled={!isUnlocked}
                          className={`px-3 py-1.8 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border ${
                            isCurrent
                              ? 'bg-rose-900/50 border-rose-500 text-rose-300 font-extrabold'
                              : isUnlocked
                              ? 'bg-neutral-950 hover:bg-neutral-800 border-neutral-850 text-neutral-400'
                              : 'bg-neutral-950/20 border-neutral-900 text-neutral-700 cursor-not-allowed'
                          }`}
                        >
                          {!isUnlocked && <Lock className="w-3 h-3 text-neutral-800 shrink-0" />}
                          {zone.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <BattlefieldView
                  gameState={gameState}
                  calculatedStats={calculatedStats}
                  onMonsterKilled={handleMonsterKilled}
                  onPlayerDamaged={handlePlayerDamaged}
                  onPlayerClickHook={handlePlayerClickHook}
                />
              </motion.div>
            )}

            {activeTab === 'inventory' && (
              <motion.div
                key="inventory" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Stat summaries (Col 4) */}
                  <div className="lg:col-span-4 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 space-y-4">
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-neutral-500">인게임 종합 전투 스펙</h3>
                    
                    <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850 space-y-2.5 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">• 총 소환 공격력 (ATK)</span>
                        <span className="font-bold text-neural-100">{calculatedStats.attack.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">• 토벌 가죽 수비 (DEF)</span>
                        <span className="font-bold text-neutral-100">{calculatedStats.defense.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">• 최대 자아 생명 (MAX HP)</span>
                        <span className="font-bold text-neutral-100">{calculatedStats.maxHp.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">• 일구 치명 타율 (CRIT RATE)</span>
                        <span className="font-bold text-amber-500">{calculatedStats.criticalRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">• 치명타 데미지 (CRIT DMG)</span>
                        <span className="font-bold text-amber-550">{calculatedStats.criticalDamage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">• 동료 자동 지원 사격 속도</span>
                        <span className="font-bold text-purple-400">
                          {gameState.skills.autoHuntLevel > 0 ? `${calculatedStats.attackSpeed}회/초` : '수련 미흡 (0회)'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">• 전리품 연금 골드 배율</span>
                        <span className="font-bold text-emerald-400">×{calculatedStats.goldMultiplier}배</span>
                      </div>
                    </div>

                    {/* Rebirth details action */}
                    {gameState.achievements.unlockedAchievements.includes('demon_slayer') || gameState.rebirthCount > 0 ? (
                      <div className="p-4 bg-purple-950/20 border border-purple-800/60 rounded-xl text-center space-y-3">
                        <h4 className="text-xs font-black uppercase text-purple-300">신성 차원 환생 게이트</h4>
                        <p className="text-[11px] text-neutral-400 leading-normal">
                          환생 진행 시 일부 능력치가 초기화되는 대신, 영구 상승 포인트 <span className="font-extrabold text-purple-350">+{1 + Math.floor(gameState.bossKills / 10)}P</span>가 특별 정산 지급됩니다.
                        </p>
                        <button
                          onClick={handleExecuteRebirth}
                          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs py-2.5 rounded-lg transition-colors shadow shadow-purple-950"
                        >
                          차원 초월 환생 가동 (Rebirth)
                        </button>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-neutral-950/80 border border-neutral-850 rounded-xl">
                        <div className="text-[10px] uppercase font-bold text-neutral-600">환생 활성 가이드</div>
                        <p className="text-[11px] text-neutral-500 mt-1 lines-relaxed">
                          최종 전장 마왕성 우두머리 <span className="font-semibold text-rose-500/80">지배자 마왕</span>을 처단 성료하면, 환생 우회 포로가 개방됩니다.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Inventory nested grids (Col 8) */}
                  <div className="lg:col-span-8">
                    <InventoryView
                      gameState={gameState}
                      calculatedStats={calculatedStats}
                      onEquip={handleEquip}
                      onUnequip={handleUnequip}
                      onSell={handleSell}
                      onDismantle={handleDismantle}
                      onSelectForEnhance={handleSelectForEnhance}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'blacksmith' && (
              <motion.div
                key="blacksmith" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              >
                <BlacksmithView
                  gameState={gameState}
                  onEnhanceSuccess={handleEnhanceSuccess}
                  onEnhanceFail={handleEnhanceFail}
                  onEnhanceDestroy={handleEnhanceDestroy}
                />
              </motion.div>
            )}

            {activeTab === 'skills' && (
              <motion.div
                key="skills" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              >
                <SkillTreeView
                  gameState={gameState}
                  onUpgradeSkill={handleUpgradeSkill}
                  onUpgradeRebirthPerk={handleUpgradeRebirthPerk}
                />
              </motion.div>
            )}

            {activeTab === 'achievements' && (
              <motion.div
                key="achievements" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start"
              >
                {/* Left Col - Ranks (Col 6) */}
                <div className="md:col-span-6">
                  <LeaderboardView />
                </div>

                {/* Right Col - Achievements lists (Col 6) */}
                <div className="md:col-span-6 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur-md">
                  <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2 mb-1.5 font-sans tracking-tight">
                    <Trophy className="w-4.5 h-4.5 text-yellow-500 animate-pulse" />
                    헌터 업적 리스트 (Achievements)
                  </h3>
                  <p className="text-xs text-neutral-500 mb-5 leading-normal">
                    전설적인 이정표를 정복 완료하고 영구 영웅 스펙 보정 혜택을 전수받으세요.
                  </p>

                  <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
                    {ACHIEVEMENTS_LIST.map((ach) => {
                      const completed = gameState.achievements.unlockedAchievements.includes(ach.id);
                      let progress = 0;

                      // Track progress values
                      if (ach.id === 'slime_hunter') {
                        progress = gameState.achievements.slimeKills;
                      } else if (ach.id === 'first_legendary') {
                        progress = gameState.inventory.some(i => i.rarity === 'legendary' || i.rarity === 'mythic' || i.rarity === 'transcendent' || i.rarity === 'absolute') ? 1 : 0;
                      } else if (ach.id === 'boss_slayer_1') {
                        progress = gameState.bossKills;
                      } else if (ach.id === 'master_enchancer') {
                        // find highest upgrade level owned
                        let maxLvl = 0;
                        const slKeys: ('helmet' | 'armor' | 'pants' | 'shoes' | 'weapon')[] = ['helmet','armor','pants','shoes','weapon'];
                        slKeys.forEach(s => {
                          const eq = gameState.equippedItems?.[s];
                          if (eq && eq.enhanceLevel > maxLvl) maxLvl = eq.enhanceLevel;
                        });
                        gameState.inventory.forEach(i => {
                          if (i.enhanceLevel > maxLvl) maxLvl = i.enhanceLevel;
                        });
                        progress = maxLvl;
                      } else if (ach.id === 'demon_slayer') {
                        progress = gameState.achievements.demonLordKills;
                      } else if (ach.id === 'clicker_god') {
                        progress = gameState.achievements.totalClicks;
                      } else if (ach.id === 'rebirth_1') {
                        progress = gameState.rebirthCount;
                      }

                      const pct = Math.min(100, Math.floor((progress / ach.maxProgress) * 100));

                      return (
                        <div
                          key={ach.id}
                          className={`p-3.5 rounded-xl border ${
                            completed
                              ? 'bg-neutral-950/40 border-yellow-800/40 opacity-80'
                              : 'bg-neutral-950/25 border-neutral-850'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h4 className={`text-xs font-extrabold ${completed ? 'text-yellow-500 font-black' : 'text-neutral-200'}`}>
                                {ach.title} {completed && '(달성완료 !!)'}
                              </h4>
                              <p className="text-[10px] text-neutral-510 leading-normal mt-1">{ach.description}</p>
                              <p className="text-[10px] text-green-400 font-semibold font-sans mt-1.5 leading-none">
                                보상: {ach.rewardDescription}
                              </p>
                            </div>
                            <span className={`text-[9px] font-bold px-1.5 rounded-md py-0.5 border font-mono ${
                              completed
                                ? 'bg-yellow-950/20 text-yellow-405 border-yellow-700/40'
                                : 'bg-neutral-900 border-neutral-805 text-neutral-500'
                            }`}>
                              {completed ? 'COMPLETED' : `${pct}%`}
                            </span>
                          </div>

                          {!completed && (
                            <div className="mt-3 space-y-1">
                              <div className="flex justify-between text-[9px] text-neutral-500 font-mono leading-none">
                                <span>진행율</span>
                                <span>{progress.toLocaleString()} / {ach.maxProgress.toLocaleString()}</span>
                              </div>
                              <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden border border-neutral-850">
                                <div
                                  className="h-full bg-yellow-550 rounded-full"
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* 4. Footer credits line / System credit */}
      <footer className="bg-neutral-950/80 py-4 mt-12 border-t border-neutral-900 text-center text-[10px] text-neutral-600 font-mono tracking-tight">
        &copy; 2026 ENDLESS HUNTER clicker RPG. Offline save replication supported.
      </footer>

      {/* 5. Signup/Login Modal Popup triggers */}
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal
            onAuthSuccess={handleAuthSuccess}
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );

  // Helper check zone unlock constraints
  function prevZoneDefeated(index: number): boolean {
    if (index === 0) return true;
    
    // Check if player has killed at least 1 boss or completed some metrics.
    // For a simple clicker zone lock loop, unlocking the next zone requires being of high enough level:
    // Zone 1: Lv.1+, Zone 2: Lv.10+, Zone 3: Lv.25+, Zone 4: Lv.50+, Zone 5: Lv.80+, Zone 6: Lv.100+
    const reqLevels = [1, 10, 25, 50, 80, 100];
    return gameState.level >= reqLevels[index];
  }
}
