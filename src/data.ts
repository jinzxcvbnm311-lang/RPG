import { RarityType, EquipmentType, WeaponStyle, Achievement } from './types';

// Rarity detail specs
export interface RaritySpec {
  rarity: RarityType;
  name: string;
  chance: number; // probability between 0 and 1
  color: string;  // CSS text color
  bgColor: string; // CSS bg badge color
  glowColor?: string; // Box shadow styling for ultra-rare items
  statMultiplier: number; // multiplier for baseline gear values
  optionCountPoints: number; // how many random options it rolls
}

export const RARITY_TABLE: Record<RarityType, RaritySpec> = {
  common: {
    rarity: 'common',
    name: '일반',
    chance: 0.60,
    color: 'text-gray-400',
    bgColor: 'bg-neutral-800 border-neutral-700',
    statMultiplier: 1.0,
    optionCountPoints: 0
  },
  uncommon: {
    rarity: 'uncommon',
    name: '고급',
    chance: 0.25,
    color: 'text-green-400',
    bgColor: 'bg-green-950/40 border-green-800/60',
    statMultiplier: 1.5,
    optionCountPoints: 1
  },
  rare: {
    rarity: 'rare',
    name: '희귀',
    chance: 0.10,
    color: 'text-blue-400',
    bgColor: 'bg-blue-950/40 border-blue-800/60',
    statMultiplier: 2.2,
    optionCountPoints: 1
  },
  epic: {
    rarity: 'epic',
    name: '영웅',
    chance: 0.04,
    color: 'text-purple-400',
    bgColor: 'bg-purple-950/40 border-purple-800',
    glowColor: 'shadow-[0_0_8px_rgba(168,85,247,0.4)]',
    statMultiplier: 3.5,
    optionCountPoints: 2
  },
  legendary: {
    rarity: 'legendary',
    name: '전설',
    chance: 0.009,
    color: 'text-amber-400 font-bold',
    bgColor: 'bg-amber-950/50 border-amber-600',
    glowColor: 'shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse',
    statMultiplier: 6.0,
    optionCountPoints: 2
  },
  mythic: {
    rarity: 'mythic',
    name: '신화',
    chance: 0.0009,
    color: 'text-red-500 font-bold',
    bgColor: 'bg-red-950/60 border-red-500',
    glowColor: 'shadow-[0_0_16px_rgba(239,68,68,0.8)]',
    statMultiplier: 12.0,
    optionCountPoints: 3
  },
  transcendent: {
    rarity: 'transcendent',
    name: '초월',
    chance: 0.00009,
    color: 'text-cyan-400 font-extrabold tracking-wide',
    bgColor: 'bg-cyan-950/70 border-cyan-400',
    glowColor: 'shadow-[0_0_20px_rgba(34,211,238,0.9)]',
    statMultiplier: 25.0,
    optionCountPoints: 3
  },
  absolute: {
    rarity: 'absolute',
    name: '절대자',
    chance: 0.00001,
    color: 'text-rose-500 font-extrabold tracking-wider bg-clip-text',
    bgColor: 'bg-rose-950/80 border-rose-500',
    glowColor: 'shadow-[0_0_25px_rgba(244,63,94,1.0)]',
    statMultiplier: 60.0,
    optionCountPoints: 4
  }
};

// Item templates for random generation
export interface ItemTemplate {
  name: string;
  baseStat: number; // Attack for weapons, Defense for gear
}

export const ITEM_NAMES: Record<Exclude<EquipmentType, 'weapon'>, string[]> = {
  helmet: ['가죽 투구', '사슬 두건', '브론즈 투구', '철 장갑 투구', '미스릴 보호 서클릿', '다이아 성 헬멧', '신성 아바타 골드 투구', '지배자의 다이아몬드 크라운'],
  armor: ['헌 옷', '질긴 가죽 갑옷', '청동 가슴보호구', '단단한 강철 판금갑', '엘븐 미스릴 체인 메일', '발키리 나이트 성 아머', '세라핌의 가호 빛 축복 아머', '절대 수호자의 로드 아머'],
  pants: ['가죽 바지', '두꺼운 천 각반', '청동 수호대 각반', '강화 금속 무릎 보호바지', '그리폰 파일론 보우 팬츠', '용 비늘 타이츠 그리브', '대천사의 사슬 각반', '시공 수호자의 그리브 바지'],
  shoes: ['낡은 장화', '가죽 가죽 부츠', '브론즈 전투화', '철제 군화 부츠', '황금 기사단 신발', '발할라 날개 슈즈', '신의 사도 가호 부츠', '성신 수호 군화 레깅스 부츠']
};

export const WEAPON_NAMES: Record<WeaponStyle, string[]> = {
  sword: [
    '나무 연습용 칼',
    '예리한 무쇠 검',
    '수호대의 명검',
    '황금 명예 롱소드',
    '아라곤의 불꽃 펜릴검',
    '마수 용살검 드래곤 슬레이어',
    '우주의 차원 절단 베기검',
    '신격 파괴 절대 수호도'
  ],
  bow: [
    '연습용 고무나무 탄궁',
    '사냥꾼의 사령 활',
    '붉은 수리 깃궁 활',
    '정찰 스포터 전술 각궁',
    '자유 숲 고대 엘프 장궁',
    '수호가디언 천사 날개 깃궁',
    '시계태엽 초신성 유성 활',
    '파멸의 절대 폭풍 하이퍼궁'
  ],
  gun: [
    '목제 매치 머스킷 권총',
    '화염 발사 구식 장총',
    '강철 개틀링 멀티 샷건',
    '황동 라이플 레인저 소총',
    '수은 미스릴 레피드 리볼버',
    '번개 뇌신 입자 에너지 플라즈마건',
    '퀘이사 중력장 침묵 스나이퍼',
    '세계 소멸 파멸의 무한 절대포'
  ],
  bomb: [
    '녹슨 구식 수류탄',
    '시한 태엽 도화선 폭약',
    '시안 연기 마비독 수류탄',
    '다이너마이트 트라이나이트 폭약',
    '고밀도 네이팜 화력폭탄',
    '화령 정령 핵 수소 연쇄 폭탄',
    '퀘이사 중성자 양자 파쇄 탄환',
    '우주 대폭발의 카오스 절대 파동 탄약'
  ]
};

// Option tables
export interface OptionRoll {
  statName: 'attack_flat' | 'attack_percent' | 'defense_flat' | 'defense_percent' | 'hp_flat' | 'critical_chance' | 'critical_damage' | 'attack_speed' | 'gold_gain';
  label: string;
  min: number;
  max: number;
  isPercent: boolean;
}

export const MONSTER_OPTIONS: OptionRoll[] = [
  { statName: 'attack_flat', label: '공격력', min: 2, max: 20, isPercent: false },
  { statName: 'attack_percent', label: '공격력 %', min: 2, max: 12, isPercent: true },
  { statName: 'defense_flat', label: '방어력', min: 1, max: 15, isPercent: false },
  { statName: 'defense_percent', label: '방어력 %', min: 2, max: 12, isPercent: true },
  { statName: 'hp_flat', label: '최대 체력', min: 10, max: 200, isPercent: false },
  { statName: 'critical_chance', label: '치명타 확률 %', min: 1, max: 8, isPercent: true },
  { statName: 'critical_damage', label: '치명타 피해 %', min: 5, max: 25, isPercent: true },
  { statName: 'attack_speed', label: '공격 속도 %', min: 1, max: 8, isPercent: true },
  { statName: 'gold_gain', label: '골드 획득량 %', min: 3, max: 15, isPercent: true }
];

// Monster specs
export interface MonsterSpec {
  name: string;
  hp: number;
  attack: number;
  gold: number;
  exp: number;
  isBoss: boolean;
}

// Hunting Zone database
export interface HuntingZoneSpec {
  name: string;
  recAttack: number;
  matsDropped: string[]; // which mats drops
  monsters: MonsterSpec[];
  boss: MonsterSpec;
}

export const HUNTING_ZONES: HuntingZoneSpec[] = [
  {
    name: '초보자의 숲',
    recAttack: 10,
    matsDropped: ['t1', 't2'],
    monsters: [
      { name: '새끼 초록 슬라임', hp: 30, attack: 1, gold: 5, exp: 4, isBoss: false },
      { name: '심술쟁이 고블린', hp: 80, attack: 3, gold: 12, exp: 10, isBoss: false },
      { name: '숲의 고블린 전사', hp: 160, attack: 5, gold: 25, exp: 20, isBoss: false }
    ],
    boss: { name: '★왕고블린 족장★', hp: 1200, attack: 15, gold: 350, exp: 300, isBoss: true }
  },
  {
    name: '어두운 동굴',
    recAttack: 100,
    matsDropped: ['t2', 't3'],
    monsters: [
      { name: '눈먼 악마의 박쥐', hp: 450, attack: 12, gold: 55, exp: 48, isBoss: false },
      { name: '동굴 부식 좀비', hp: 950, attack: 25, gold: 110, exp: 100, isBoss: false },
      { name: '해골 칼잡이병', hp: 1600, attack: 40, gold: 220, exp: 190, isBoss: false }
    ],
    boss: { name: '★거대 해골 백사장★', hp: 15000, attack: 120, gold: 2400, exp: 2000, isBoss: true }
  },
  {
    name: '버려진 성',
    recAttack: 500,
    matsDropped: ['t3', 't4'],
    monsters: [
      { name: '떠돌이 기사 망령', hp: 4200, attack: 95, gold: 480, exp: 420, isBoss: false },
      { name: '저주받은 고성 마법사', hp: 7500, attack: 160, gold: 950, exp: 850, isBoss: false },
      { name: '고스트 가고일', hp: 13500, attack: 280, gold: 1800, exp: 1600, isBoss: false }
    ],
    boss: { name: '★타락한 성의 폭군 기사★', hp: 120000, attack: 850, gold: 18000, exp: 15000, isBoss: true }
  },
  {
    name: '불타는 협곡',
    recAttack: 2000,
    matsDropped: ['t4', 't5'],
    monsters: [
      { name: '불의 불타는 정령', hp: 45000, attack: 680, gold: 4200, exp: 3800, isBoss: false },
      { name: '마그마 파투 슬라임', hp: 92000, attack: 1100, gold: 8800, exp: 7600, isBoss: false },
      { name: '협곡의 화염 골렘', hp: 185000, attack: 1900, gold: 17000, exp: 15000, isBoss: false }
    ],
    boss: { name: '★폭주하는 불의 대마왕★', hp: 1550000, attack: 6500, gold: 150000, exp: 120000, isBoss: true }
  },
  {
    name: '고대 유적',
    recAttack: 10000,
    matsDropped: ['t5', 't6'],
    monsters: [
      { name: '사원 전령 가디언', hp: 680000, attack: 4100, gold: 38000, exp: 33000, isBoss: false },
      { name: '고대 비석 석상수호물', hp: 1450000, attack: 8500, gold: 82000, exp: 71000, isBoss: false },
      { name: '영원의 고대 드레이크', hp: 3200000, attack: 16800, gold: 175000, exp: 150000, isBoss: false }
    ],
    boss: { name: '★고대 신화 골든 드래곤★', hp: 28000000, attack: 52000, gold: 1850000, exp: 1600000, isBoss: true }
  },
  {
    name: '마왕의 성',
    recAttack: 50000,
    matsDropped: ['t6', 't7'],
    monsters: [
      { name: '타락 마왕군 보병', hp: 12500000, attack: 31000, gold: 420000, exp: 380000, isBoss: false },
      { name: '마왕군 고위 제사장', hp: 31000000, attack: 69000, gold: 1050000, exp: 900000, isBoss: false },
      { name: '심연 마왕 수호 장군', hp: 75000000, attack: 140000, gold: 2600000, exp: 2200000, isBoss: false }
    ],
    boss: { name: '★심연의 파괴 마왕 발록★', hp: 650000000, attack: 450000, gold: 32000000, exp: 28000000, isBoss: true }
  }
];

// Rebirth points rewards calculations
export const REBIRTH_PERK_COSTS = [1, 2, 4, 8, 15, 30, 50, 80, 120, 200, 350, 500, 750, 1000];

// Achievements Definitions
export const ACHIEVEMENTS_LIST: Achievement[] = [
  {
    id: 'slime_hunter',
    title: '슬라임 학살자',
    description: '초보자의 숲 슬라임계열 몬스터를 100마리 무찌르세요.',
    rewardDescription: '영구 공격력 +10 증가',
    maxProgress: 100,
    completed: false
  },
  {
    id: 'first_legendary',
    title: '전설의 출현',
    description: '인벤토리에 첫 전설(Legendary) 이상의 장비를 획득하세요.',
    rewardDescription: '영구 아이템 드랍률 +2% 증가',
    maxProgress: 1,
    completed: false
  },
  {
    id: 'boss_slayer_1',
    title: '동굴의 백사장 처단자',
    description: '어두운 동굴 보스 해골 백사장을 10회 처치하세요.',
    rewardDescription: '치명타 확률 +3% 증가',
    maxProgress: 10,
    completed: false
  },
  {
    id: 'master_enchancer',
    title: '행운의 손길',
    description: '어떠한 장비든 +15강 이상 성공을 달성하세요.',
    rewardDescription: '영구 골드 획득량 +15% 증가',
    maxProgress: 15, // max level reached
    completed: false
  },
  {
    id: 'demon_slayer',
    title: '인류의 영웅',
    description: '마왕의 성 최종 보스를 1회 무찌르세요. (환생 권한 획득)',
    rewardDescription: '영구 경험치 획득 +30% 증가 및 환생 상점 오픈',
    maxProgress: 1,
    completed: false
  },
  {
    id: 'rebirth_1',
    title: '차원을 초월한 헌터',
    description: '환생(Rebirth)을 1회 이상 진행하세요.',
    rewardDescription: '영구 기본 공격력 +50, 공격 속도 +5% 증가',
    maxProgress: 1,
    completed: false
  },
  {
    id: 'clicker_god',
    title: '빛의 광클 기술자',
    description: '클릭 횟수 총 2000회를 채우세요.',
    rewardDescription: '영구 기본 공격력 +30 증가',
    maxProgress: 2000,
    completed: false
  }
];

export const STONE_NAMES: Record<string, string> = {
  t1: '작은 강화석 (1티어)',
  t2: '단단한 강화석 (2티어)',
  t3: '빛나는 강화석 (3티어)',
  t4: '고대 강화석 (4티어)',
  t5: '신성 강화석 (5티어)',
  t6: '차원 강화석 (6티어)',
  t7: '신격 강화석 (7티어)'
};
