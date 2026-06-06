/**
 * RPG Clicker Game Core TypeScript Types
 */

export type EquipmentType = 'helmet' | 'armor' | 'pants' | 'shoes' | 'weapon';
export type WeaponStyle = 'sword' | 'bow' | 'gun' | 'bomb';

export type RarityType =
  | 'common' // 일반 (60%)
  | 'uncommon' // 고급 (25%)
  | 'rare' // 희귀 (10%)
  | 'epic' // 영웅 (4%)
  | 'legendary' // 전설 (0.9%)
  | 'mythic' // 신화 (0.09%)
  | 'transcendent' // 초월 (0.009%)
  | 'absolute'; // 절대자 (0.001%)

export interface EquipmentOption {
  statName: 'attack_flat' | 'attack_percent' | 'defense_flat' | 'defense_percent' | 'hp_flat' | 'critical_chance' | 'critical_damage' | 'attack_speed' | 'gold_gain';
  value: number; // e.g. 10 (flat) or 15 (which is 15%)
  label: string;  // e.g. "공격력 +10%"
}

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  weaponStyle?: WeaponStyle; // only if type === 'weapon'
  rarity: RarityType;
  baseStat: number; // Attack for weapons, Defense for other gear
  enhanceLevel: number; // 0 to 30
  options: EquipmentOption[];
}

export interface UpgradeStones {
  t1: number; // 작은 강화석 (+1~10용)
  t2: number; // 단단한 강화석 (+1~10용 고체)
  t3: number; // 빛나는 강화석 (+11~20용)
  t4: number; // 고대 강화석 (+11~20용)
  t5: number; // 신성 강화석 (+21~30용)
  t6: number; // 차원 강화석 (+21~30용)
  t7: number; // 신격 강화석 (+21~30용 전용)
}

export interface SkillTree {
  attackLevel: number;   // 공격 트리
  defenseLevel: number;  // 방어 트리
  criticalLevel: number; // 치명타 트리
  autoHuntLevel: number; // 자동 사냥 트리
  dropLevel: number;     // 드랍/골드 트리
}

export interface RebirthUpgrades {
  attackMultiplier: number; // 공격력 증가 (환생포인트당 +10% 복리)
  expMultiplier: number;    // 경험치 증가
  dropMultiplier: number;   // 드랍률 증가
  goldMultiplier: number;   // 골드 증가
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  rewardDescription: string;
  maxProgress: number;
  completed: boolean;
}

export interface AchievementProgress {
  slimeKills: number;      // 슬라임 처치 수
  demonLordKills: number;  // 마왕 처치 수
  totalKills: number;      // 총 처치 수
  totalClicks: number;     // 총 클릭 수
  totalGoldEarned: number; // 총 골드 획득량
  unlockedAchievements: string[]; // 해금된 업적 ID 목록
}

export interface GameState {
  userId: string;
  nickname: string;
  level: number;
  exp: number;
  nextExp: number;
  gold: number;
  rebirthPoints: number;
  rebirthCount: number;
  bossKills: number;
  hp: number;

  rebirthUpgrades: RebirthUpgrades;
  equippedItems: {
    helmet: Equipment | null;
    armor: Equipment | null;
    pants: Equipment | null;
    shoes: Equipment | null;
    weapon: Equipment | null;
  };
  inventory: Equipment[];
  upgradeStones: UpgradeStones;
  skills: SkillTree;
  unlockedHuntingZones: string[]; // e.g. ["초보자의 숲"]
  currentHuntingZone: string;
  huntingZoneKills: number;       // 100마리 처치하면 보스!
  achievements: AchievementProgress;
}

export interface UserAccountSnapshot {
  userId: string;
  nickname: string;
  level: number;
  rebirthCount: number;
  maxAttack: number;
  bossKills: number;
}

export interface LeaderboardEntry {
  userId: string;
  nickname: string;
  value: number;
  rank: number;
}

export interface Leaderboards {
  levelRank: LeaderboardEntry[];
  attackRank: LeaderboardEntry[];
  rebirthRank: LeaderboardEntry[];
  bossKillsRank: LeaderboardEntry[];
}
