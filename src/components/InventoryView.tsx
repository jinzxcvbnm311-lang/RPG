import { useState } from 'react';
import { Equipment, EquipmentType, RarityType, GameState } from '../types';
import { RARITY_TABLE, STONE_NAMES } from '../data';
import { Shield, Sparkles, Trash2, Settings, ArrowUpCircle, Hammer, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InventoryViewProps {
  gameState: GameState;
  calculatedStats: any;
  onEquip: (item: Equipment) => void;
  onUnequip: (slot: 'helmet' | 'armor' | 'pants' | 'shoes' | 'weapon') => void;
  onSell: (item: Equipment) => void;
  onDismantle: (item: Equipment) => void;
  onSelectForEnhance: (item: Equipment) => void;
}

export default function InventoryView({
  gameState,
  calculatedStats,
  onEquip,
  onUnequip,
  onSell,
  onDismantle,
  onSelectForEnhance,
}: InventoryViewProps) {
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);
  const [activeInventoryTab, setActiveInventoryTab] = useState<'all' | 'weapon' | 'armor'>('all');

  // Filter inventory
  const filteredInventory = gameState.inventory.filter((item) => {
    if (activeInventoryTab === 'all') return true;
    if (activeInventoryTab === 'weapon') return item.type === 'weapon';
    // Helmet, armor, pants, shoes correspond to "armor" tab
    return item.type !== 'weapon';
  });

  const getSellPrice = (item: Equipment): number => {
    const basePrices: Record<RarityType, number> = {
      common: 50,
      uncommon: 180,
      rare: 650,
      epic: 3500,
      legendary: 25000,
      mythic: 180000,
      transcendent: 1500000,
      absolute: 15000000,
    };
    const mult = basePrices[item.rarity] || 50;
    // Add enhance boost
    return mult + Math.floor(mult * item.enhanceLevel * 0.3);
  };

  const getDismantleReward = (item: Equipment) => {
    // Returns type of stone and amount
    let stoneType = 't1';
    let amount = 1;

    switch (item.rarity) {
      case 'common':
        stoneType = 't1';
        amount = Math.random() < 0.5 ? 1 : 2;
        break;
      case 'uncommon':
        stoneType = 't2';
        amount = 1;
        break;
      case 'rare':
        stoneType = 't3';
        amount = 1;
        break;
      case 'epic':
        stoneType = 't4';
        amount = Math.random() < 0.4 ? 1 : 2;
        break;
      case 'legendary':
        stoneType = 't5';
        amount = 1;
        break;
      case 'mythic':
        stoneType = 't6';
        amount = 1;
        break;
      case 'transcendent':
        stoneType = 't7';
        amount = 1;
        break;
      case 'absolute':
        stoneType = 't7';
        amount = Math.floor(2 + Math.random() * 3);
        break;
    }

    return {
      type: stoneType as keyof typeof gameState.upgradeStones,
      name: STONE_NAMES[stoneType],
      amount,
    };
  };

  const slotKeys: { label: string; key: 'helmet' | 'armor' | 'pants' | 'shoes' | 'weapon' }[] = [
    { label: '투구 [Helmet]', key: 'helmet' },
    { label: '갑옷 [Armor]', key: 'armor' },
    { label: '바지 [Pants]', key: 'pants' },
    { label: '신발 [Shoes]', key: 'shoes' },
    { label: '무기 [Weapon]', key: 'weapon' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Currently Equipped Slots */}
      <div>
        <h3 className="text-sm font-bold text-neutral-400 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-rose-500" />
          장착용 장비 슬롯 (Equipped Gears)
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {slotKeys.map((slot) => {
            const item = gameState.equippedItems?.[slot.key];
            const spec = item ? RARITY_TABLE[item.rarity] : null;

            return (
              <div
                key={slot.key}
                onClick={() => item && setSelectedItem(item)}
                className={`relative rounded-xl p-3 flex flex-col justify-between min-h-[110px] cursor-pointer transition-all border ${
                  item && spec
                    ? `${spec.bgColor} ${spec.glowColor || ''} hover:brightness-110 shadow-lg`
                    : 'bg-neutral-950/40 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950/80'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-neutral-500 font-semibold tracking-tight uppercase">
                    {slot.label.split(' ')[0]}
                  </span>
                  {item && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-neutral-900 border border-neutral-700/50 rounded text-neutral-400 font-mono">
                      {RARITY_TABLE[item.rarity].name}
                    </span>
                  )}
                </div>

                {item ? (
                  <div className="mt-2">
                    <p className={`text-xs font-bold leading-tight line-clamp-1 ${spec?.color}`}>
                      {item.enhanceLevel > 0 && `+${item.enhanceLevel} `}
                      {item.name}
                    </p>
                    <p className="text-[10px] font-mono font-medium text-neutral-300 mt-1">
                      {item.type === 'weapon' ? '공격력' : '방어력'}: {item.baseStat + Math.floor(item.baseStat * item.enhanceLevel * 0.15)}
                    </p>
                  </div>
                ) : (
                  <div className="mt-2 py-2 flex items-center justify-center">
                    <span className="text-[10px] text-neutral-700 align-middle text-center italic">비어있음</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Materials (Enhancement stones inventory) */}
      <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-4">
        <h4 className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          보유 중인 강화 재료 (Upgrade Stones)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {(['t1', 't2', 't3', 't4', 't5', 't6', 't7'] as const).map((t, idx) => {
            const count = gameState.upgradeStones?.[t] || 0;
            const colors = [
              'text-gray-400 bg-neutral-800/10 border-neutral-800',
              'text-green-400 bg-green-950/10 border-green-900/30',
              'text-blue-400 bg-blue-950/10 border-blue-900/30',
              'text-purple-400 bg-purple-950/10 border-purple-900/30',
              'text-amber-400 bg-amber-950/10 border-amber-900/40',
              'text-red-500 bg-red-950/10 border-red-900/40',
              'text-cyan-400 bg-cyan-950/20 border-cyan-800/50 shadow-[0_0_6px_rgba(34,211,238,0.1)]',
            ];
            return (
              <div key={t} className={`p-2 rounded-lg border text-center ${colors[idx]}`}>
                <div className="text-[9px] font-bold line-clamp-1 text-neutral-500">
                  {idx + 1}티어
                </div>
                <div className="text-[11px] font-extrabold mt-0.5 line-clamp-1 leading-none">{STONE_NAMES[t].split(' ')[0]}</div>
                <div className="text-xs font-mono font-bold mt-1 text-neutral-200">
                  {count.toLocaleString()}개
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Base Inventory Grid */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h3 className="text-sm font-bold text-neutral-400 flex items-center gap-2">
            지니고 있는 보따리 ({gameState.inventory.length} / 50 슬롯)
          </h3>

          <div className="flex bg-neutral-950 rounded-lg p-0.5 border border-neutral-800 text-xs">
            <button
              onClick={() => setActiveInventoryTab('all')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                activeInventoryTab === 'all'
                  ? 'bg-neutral-800 text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setActiveInventoryTab('weapon')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                activeInventoryTab === 'weapon'
                  ? 'bg-neutral-800 text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              무기
            </button>
            <button
              onClick={() => setActiveInventoryTab('armor')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                activeInventoryTab === 'armor'
                  ? 'bg-neutral-800 text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              방어구
            </button>
          </div>
        </div>

        {filteredInventory.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-neutral-800/80 rounded-2xl text-neutral-600 bg-neutral-950/20">
            <Info className="w-8 h-8 mx-auto mb-2 text-neutral-700" />
            <p className="text-sm font-semibold mb-0.5">인벤토리가 비어있습니다.</p>
            <p className="text-xs">사냥터에서 몬스터를 처치하여 고성능 장비를 발굴해보세요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {filteredInventory.map((item) => {
              const spec = RARITY_TABLE[item.rarity];
              return (
                <motion.div
                  layoutId={item.id}
                  onClick={() => setSelectedItem(item)}
                  key={item.id}
                  className={`p-2.5 rounded-xl border flex flex-col justify-between aspect-square cursor-pointer transition-all ${
                    selectedItem?.id === item.id 
                      ? 'border-neutral-100 bg-neutral-800 shadow-[0_0_12px_rgba(255,255,255,0.15)] scale-98'
                      : `${spec.bgColor} ${spec.glowColor || ''} hover:brightness-110 hover:border-neutral-600`
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-[8px] font-bold text-neutral-400 capitalize opacity-90 truncate">
                      {item.type === 'weapon' ? item.weaponStyle || '무기' : item.type}
                    </span>
                    <span className={`text-[8px] font-black uppercase ${spec.color}`}>
                      {spec.name}
                    </span>
                  </div>

                  <div className="my-1.5">
                    <p className={`text-xs font-extrabold line-clamp-1 ${spec.color}`}>
                      {item.enhanceLevel > 0 && `+${item.enhanceLevel} `}
                      {item.name}
                    </p>
                  </div>

                  <div className="text-[10px] font-mono leading-none flex justify-between text-neutral-400">
                    <span>{item.type === 'weapon' ? 'ATK' : 'DEF'}</span>
                    <span className="font-bold text-neutral-200">
                      {(item.baseStat + Math.floor(item.baseStat * item.enhanceLevel * 0.15)).toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Equipment Detail Drawer / Tooltip */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 relative overflow-hidden"
            >
              {/* Colored backdrop glow corresponding to rarity */}
              <div className={`absolute -top-16 -right-16 w-32 h-32 rounded-full blur-3xl opacity-25 ${
                selectedItem.rarity === 'absolute' ? 'bg-rose-500' :
                selectedItem.rarity === 'transcendent' ? 'bg-cyan-500' :
                selectedItem.rarity === 'mythic' ? 'bg-red-500' :
                selectedItem.rarity === 'legendary' ? 'bg-amber-500' :
                selectedItem.rarity === 'epic' ? 'bg-purple-500' :
                selectedItem.rarity === 'rare' ? 'bg-blue-500' :
                selectedItem.rarity === 'uncommon' ? 'bg-green-500' : 'bg-neutral-500'
              }`}></div>

              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 bg-neutral-950 border border-neutral-800/80 rounded uppercase ${RARITY_TABLE[selectedItem.rarity].color}`}>
                    {RARITY_TABLE[selectedItem.rarity].name} 장비
                  </span>
                  <h3 className={`text-lg font-black mt-2 font-sans tracking-tight ${RARITY_TABLE[selectedItem.rarity].color}`}>
                    {selectedItem.enhanceLevel > 0 && `+${selectedItem.enhanceLevel} `}
                    {selectedItem.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-neutral-500 hover:text-neutral-300 text-xs py-1 px-2 hover:bg-neutral-800 rounded-md transition-colors"
                >
                  닫기
                </button>
              </div>

              {/* Stats values block */}
              <div className="bg-neutral-950 rounded-xl p-3 mb-4 border border-neutral-800/80">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-400 font-bold">
                    기본 주 능력치 ({selectedItem.type === 'weapon' ? '공격력' : '방어력'})
                  </span>
                  <span className="font-bold text-neutral-100 font-mono text-base">
                    {(selectedItem.baseStat + Math.floor(selectedItem.baseStat * selectedItem.enhanceLevel * 0.15)).toLocaleString()}
                  </span>
                </div>
                <div className="text-[10px] text-neutral-500 mt-1 flex justify-between">
                  <span>기본치: {selectedItem.baseStat}</span>
                  {selectedItem.enhanceLevel > 0 && (
                    <span className="text-green-400 font-medium">
                      강화 효과 (+{Math.floor(selectedItem.baseStat * selectedItem.enhanceLevel * 0.15)})
                    </span>
                  )}
                </div>
              </div>

              {/* Options lists */}
              <div className="mb-6 space-y-2">
                <h4 className="text-[11px] font-black uppercase text-neutral-500 tracking-wider">
                  랜덤 추가 부여 옵션 ({selectedItem.options?.length || 0})
                </h4>
                {selectedItem.options && selectedItem.options.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedItem.options.map((opt, i) => (
                      <div key={i} className="bg-neutral-950/40 px-3 py-2 rounded-lg border border-neutral-800/40 text-xs flex justify-between text-neutral-300">
                        <span className="text-neutral-400">• {opt.label.split(' +')[0]}</span>
                        <span className="font-mono text-neutral-200 font-semibold">+{opt.label.split(' +')[1]}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-600 italic">추가 옵션이 부여되지 않은 일반 장비입니다.</p>
                )}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                {/* 1. Equip Button */}
                {gameState.equippedItems?.[selectedItem.type as any]?.id === selectedItem.id ? (
                  <button
                    onClick={() => {
                      onUnequip(selectedItem.type as any);
                      setSelectedItem(null);
                    }}
                    className="col-span-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 py-2.5 rounded-xl text-xs font-bold font-sans transition-colors flex items-center justify-center gap-1 border border-neutral-700"
                  >
                    장비 장착 해제 (Unequip)
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onEquip(selectedItem);
                      setSelectedItem(null);
                    }}
                    className="col-span-2 bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-xl text-xs font-extrabold font-sans transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/40"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    이 장비 착용하기 (Equip)
                  </button>
                )}

                {/* Sell button */}
                <button
                  onClick={() => {
                    onSell(selectedItem);
                    setSelectedItem(null);
                  }}
                  disabled={gameState.equippedItems?.[selectedItem.type as any]?.id === selectedItem.id}
                  className="bg-neutral-950 hover:bg-red-950/20 text-neutral-400 hover:text-red-400 py-2.5 rounded-xl text-xs font-bold transition-all border border-neutral-800 hover:border-red-900/60 flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  판매: {getSellPrice(selectedItem).toLocaleString()}골드
                </button>

                {/* Dismantle button */}
                <button
                  onClick={() => {
                    onDismantle(selectedItem);
                    setSelectedItem(null);
                  }}
                  disabled={gameState.equippedItems?.[selectedItem.type as any]?.id === selectedItem.id}
                  className="bg-neutral-950 hover:bg-amber-950/20 text-neutral-400 hover:text-amber-500 py-2.5 rounded-xl text-xs font-bold transition-all border border-neutral-800 hover:border-amber-800/40 flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Settings className="w-3.5 h-3.5" />
                  분해 수거
                </button>

                {/* Blacksmith upgrade redirection shortcut */}
                <button
                  onClick={() => {
                    onSelectForEnhance(selectedItem);
                    setSelectedItem(null);
                  }}
                  className="col-span-2 bg-neutral-950 hover:bg-neutral-800 text-amber-400 hover:text-amber-300 py-2.5 rounded-xl text-xs font-bold transition-all border border-neutral-800/80 flex items-center justify-center gap-1.5"
                >
                  <Hammer className="w-3.5 h-3.5" />
                  대장간으로 보내기 (아이템 강화하러 가기)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
