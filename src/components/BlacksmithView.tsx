import { useState } from 'react';
import { Equipment, GameState } from '../types';
import { STONE_NAMES, RARITY_TABLE } from '../data';
import { getEnhanceSpecs } from '../utils';
import { Hammer, Sparkles, AlertOctagon, Flame, ChevronRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BlacksmithViewProps {
  gameState: GameState;
  onEnhanceSuccess: (itemId: string, nextLevel: number) => void;
  onEnhanceFail: (itemId: string, nextLevel: number, msg: string) => void;
  onEnhanceDestroy: (itemId: string, msg: string) => void;
}

export default function BlacksmithView({
  gameState,
  onEnhanceSuccess,
  onEnhanceFail,
  onEnhanceDestroy,
}: BlacksmithViewProps) {
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [result, setResult] = useState<{ status: 'success' | 'fail' | 'destroy'; msg: string } | null>(null);

  // Pool of weapons and armors from BOTH inventory and equipped slots
  const allUpgradeableItems: Equipment[] = [];
  
  // Add equipped items
  const slots: ('helmet' | 'armor' | 'pants' | 'shoes' | 'weapon')[] = [
    'helmet', 'armor', 'pants', 'shoes', 'weapon'
  ];
  slots.forEach((s) => {
    const item = gameState.equippedItems?.[s];
    if (item && item.enhanceLevel < 30) {
      allUpgradeableItems.push({ ...item, name: `[착용중] ${item.name}` });
    }
  });

  // Add inventory items
  gameState.inventory.forEach((item) => {
    if (item.enhanceLevel < 30) {
      allUpgradeableItems.push(item);
    }
  });

  // Pick target item
  const handleSelectItem = (item: Equipment) => {
    setSelectedItem(item);
    setResult(null);
  };

  const executeEnhance = () => {
    if (!selectedItem) return;
    const stats = getEnhanceSpecs(selectedItem.enhanceLevel);
    const requiredStone = stats.stoneTierNeeded as keyof typeof gameState.upgradeStones;
    const currentStones = gameState.upgradeStones[requiredStone] || 0;

    if (currentStones < stats.stonesRequired) {
      alert('보유하고 계신 이 티어의 강화석이 부족합니다!');
      return;
    }

    setEnhancing(true);
    setResult(null);

    // Hammer forge delay for suspense
    setTimeout(() => {
      const roll = Math.random() * 100;
      const successChance = stats.successRate;
      const degradeChance = stats.degradeChance;
      const destroyChance = stats.destroyChance;

      if (roll < successChance) {
        // SUCCESS !!
        const nextLv = selectedItem.enhanceLevel + 1;
        onEnhanceSuccess(selectedItem.id, nextLv);
        // Refresh local pointer
        setSelectedItem((prev) => prev ? { ...prev, enhanceLevel: nextLv } : null);
        setResult({
          status: 'success',
          msg: `대성공!! 장비의 강화도가 +${nextLv}(으)로 상승하였으며 주 능력치가 대폭 증가하였습니다!`,
        });
      } else if (roll < successChance + destroyChance && destroyChance > 0) {
        // DESTROYED !!
        const oldName = selectedItem.name;
        onEnhanceDestroy(selectedItem.id, `+${selectedItem.enhanceLevel} 강화 중 장비 장치가 폭주하여 파괴되었습니다!`);
        setSelectedItem(null);
        setResult({
          status: 'destroy',
          msg: `대참사!! ${oldName} 장비가 강화 과부하로 폭발하여 영구 소실되었습니다. 위로의 의미로 일부 잔해(골드)가 지급됩니다.`,
        });
      } else {
        // FAILURE / DEGRADE
        let nextLv = selectedItem.enhanceLevel;
        let penaltyMsg = '강화도가 보존되었습니다.';
        
        if (degradeChance > 0 && selectedItem.enhanceLevel >= 11) {
          nextLv = Math.max(0, selectedItem.enhanceLevel - 1);
          penaltyMsg = `과부하로 인해 강화도가 -1 하락하여 +${nextLv}이(가) 되었습니다.`;
        }

        onEnhanceFail(selectedItem.id, nextLv, penaltyMsg);
        setSelectedItem((prev) => prev ? { ...prev, enhanceLevel: nextLv } : null);
        setResult({
          status: 'fail',
          msg: `강화 실패... 장인 대장장이가 해머 단조 중 흠집을 냈습니다. (${penaltyMsg})`,
        });
      }
      setEnhancing(false);
    }, 1200);
  };

  const getEnhanceRequirementsText = (stats: any) => {
    const requiredStone = stats.stoneTierNeeded as keyof typeof gameState.upgradeStones;
    const requiredAmount = stats.stonesRequired;
    const current = gameState.upgradeStones[requiredStone] || 0;
    const hasEnough = current >= requiredAmount;

    return (
      <div className="flex items-center justify-between text-xs p-3.5 bg-neutral-950 rounded-xl border border-neutral-800">
        <div className="flex items-center gap-2">
          <Sparkles className={`w-4 h-4 ${hasEnough ? 'text-amber-400' : 'text-neutral-500'}`} />
          <div>
            <p className="font-bold text-neutral-300">{STONE_NAMES[requiredStone]}</p>
            <p className="text-[10px] text-neutral-500 font-mono">소비 개수: {requiredAmount}개</p>
          </div>
        </div>
        <span className={`font-mono font-extrabold ${hasEnough ? 'text-green-400' : 'text-red-500'}`}>
          {current} / {requiredAmount} (보유량)
        </span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>

      {/* Left panel - choose item */}
      <div className="lg:col-span-5 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 backdrop-blur-md flex flex-col max-h-[500px]">
        <h3 className="text-sm font-bold text-neutral-300 mb-2.5 flex items-center gap-2">
          <Hammer className="w-4 h-4 text-amber-500" />
          강화할 장비 선택하기 ({allUpgradeableItems.length}개 발견)
        </h3>
        
        <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
          대장간에서는 최대 +30강까지 주 능력치(+15% 복리 시너지)를 무한 돌파시킬 수 있습니다.
        </p>

        {allUpgradeableItems.length === 0 ? (
          <div className="flex-1 border border-dashed border-neutral-800 rounded-xl flex flex-col items-center justify-center p-8 text-neutral-600 text-center">
            <Info className="w-7 h-7 mb-2 text-neutral-700" />
            <p className="text-xs font-semibold">강화 가능한 장비가 보이지 않습니다.</p>
            <p className="text-[10px] text-neutral-600 mt-1">인벤토리에 장비를 장만하거나 +30강 미만인지 확인해보세요.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1.5">
            {allUpgradeableItems.map((item) => {
              const spec = RARITY_TABLE[item.rarity];
              const isSelected = selectedItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${
                    isSelected
                      ? 'border-neutral-100 bg-neutral-800 shadow-[0_0_8px_rgba(255,255,255,0.08)]'
                      : `${spec.bgColor} hover:brightness-110`
                  }`}
                >
                  <div>
                    <p className={`text-xs font-black tracking-tight ${spec.color}`}>
                      {item.enhanceLevel > 0 && `+${item.enhanceLevel} `}
                      {item.name}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      {item.type === 'weapon' ? '공격력' : '방어력'}: {item.baseStat} (+{(item.enhanceLevel * 15)}% 증가된 상태)
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-600" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right panel - forge screen */}
      <div className="lg:col-span-7 bg-neutral-900/40 border border-neutral-850 rounded-2xl p-5 flex flex-col justify-between min-h-[400px]">
        {selectedItem ? (
          <div className="flex-1 flex flex-col justify-between">
            {/* Target item display card */}
            <div className="text-center py-4 border-b border-neutral-850">
              <span className={`text-[9px] font-black tracking-widest uppercase border px-1.5 py-0.5 rounded ${RARITY_TABLE[selectedItem.rarity].color}`}>
                {RARITY_TABLE[selectedItem.rarity].name}
              </span>
              <h4 className={`text-xl font-extrabold mt-3 tracking-tight ${RARITY_TABLE[selectedItem.rarity].color}`}>
                {selectedItem.enhanceLevel > 0 && `+${selectedItem.enhanceLevel} `}
                {selectedItem.name.replace('[착용중] ', '')}
              </h4>
              <p className="text-xs text-neutral-400 mt-1">
                기본치: {selectedItem.baseStat} ➔ 장비 전투력:{' '}
                <span className="font-extrabold font-mono text-neutral-200">
                  {selectedItem.baseStat + Math.floor(selectedItem.baseStat * selectedItem.enhanceLevel * 0.15)}
                </span>
              </p>
            </div>

            {/* Success and hazards specs */}
            <div className="my-6">
              {(() => {
                const spec = getEnhanceSpecs(selectedItem.enhanceLevel);
                const hasStones = gameState.upgradeStones[spec.stoneTierNeeded as keyof typeof gameState.upgradeStones] >= spec.stonesRequired;
                const isImmortalZone = selectedItem.enhanceLevel < 10;
                const isDegradeZone = selectedItem.enhanceLevel >= 10 && selectedItem.enhanceLevel < 20;
                const isDestroyZone = selectedItem.enhanceLevel >= 20;

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850">
                        <p className="text-[10px] text-neutral-500 font-bold leading-none">성공 확률</p>
                        <p className="text-lg font-mono font-black text-green-400 mt-1.5">{spec.successRate}%</p>
                      </div>

                      <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850">
                        <p className="text-[10px] text-neutral-500 font-bold leading-none">하락 확률</p>
                        <p className={`text-lg font-mono font-black mt-1.5 ${spec.degradeChance > 0 ? 'text-amber-500' : 'text-neutral-600'}`}>{spec.degradeChance}%</p>
                      </div>

                      <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-850">
                        <p className="text-[10px] text-neutral-500 font-bold leading-none">파괴 확률</p>
                        <p className={`text-lg font-mono font-black mt-1.5 ${spec.destroyChance > 0 ? 'text-red-500 font-bold animate-pulse' : 'text-neutral-600'}`}>
                          {spec.destroyChance}%
                        </p>
                      </div>
                    </div>

                    {/* Alerts based on safety tier */}
                    {isImmortalZone && (
                      <div className="p-3 bg-green-950/20 border border-green-900/40 text-green-400 text-xs rounded-xl flex items-start gap-2 leading-relaxed">
                        <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>안심 구역 (+1 ~ +10강): 강화는 100% 성공하며, 어떠한 장비 파괴 위험도 동반되지 않는 튼튼한 안전 단조 구간입니다.</span>
                      </div>
                    )}

                    {isDegradeZone && (
                      <div className="p-3 bg-amber-950/20 border border-amber-900/40 text-amber-500 text-xs rounded-xl flex items-start gap-2 leading-relaxed">
                        <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>미끄럼 구역 (+11 ~ +20강): 실패할 위험이 도사리고 있으며, 실패 시 강화도가 -1단계 내려앉을 확률이 있으나, 무기가 부서지지는 않는 단기 연마 구간입니다.</span>
                      </div>
                    )}

                    {isDestroyZone && (
                      <div className="p-3 bg-red-950/30 border border-red-500/30 text-red-500 text-xs rounded-xl flex items-start gap-2 leading-relaxed shadow-lg shadow-red-950/25">
                        <Flame className="w-4 h-4 shrink-0 mt-0.5 animate-bounce" />
                        <span className="font-semibold">파쇄 파괴 위험 구역 (+21 ~ +30강): 심화 하드코어 단조 구간입니다. 단 1%의 실수로 소중한 아이템이 대기로 산화 분해될 수 있는 극도로 위험한 구간 장비입니다! (경고!!)</span>
                      </div>
                    )}

                    {/* Stone requirement rendering panel */}
                    {getEnhanceRequirementsText(spec)}

                    {/* Big Action Forge Button */}
                    <div className="pt-2 relative">
                      <AnimatePresence>
                        {enhancing && (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1.1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-neutral-900/90 z-20 rounded-xl"
                          >
                            <div className="text-center space-y-2">
                              <Hammer className="w-10 h-10 text-amber-500 mx-auto animate-spin" />
                              <p className="text-xs font-bold text-amber-400 uppercase tracking-widest animate-pulse">단조 단타 두드리는 중 (CLANG! CLANG!)...</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <button
                        onClick={executeEnhance}
                        disabled={!hasStones || enhancing}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-sm rounded-xl py-3.5 transition-colors disabled:opacity-30 disabled:pointer-events-none shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2"
                      >
                        <Hammer className="w-4 h-4" />
                        대장간 강화 단조 시작하기 (Forger Upgrade)
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 text-center border border-dashed border-neutral-805 rounded-xl py-10 px-4">
            <Hammer className="w-10 h-10 text-neutral-700 mb-3 animate-pulse" />
            <h4 className="text-sm font-bold text-neutral-400 mb-1">대장간 단조 설비 가동 준비</h4>
            <p className="text-xs text-neutral-600 max-w-sm">
              왼쪽 목록에서 강화하고자 하는 헌터 장비를 선택해 올리면, 강화석 소모량 및 등급별 상승/파괴 확률이 표기됩니다.
            </p>
          </div>
        )}

        {/* Floating enhancement logs */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className={`mt-4 p-4 rounded-xl border text-xs leading-relaxed ${
                result.status === 'success'
                  ? 'bg-green-950/30 border-green-500/40 text-green-400'
                  : result.status === 'destroy'
                  ? 'bg-red-950/40 border-red-500/50 text-red-500 shadow-xl'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {result.status === 'success' ? (
                  <Sparkles className="w-4 h-4 text-green-400" />
                ) : result.status === 'destroy' ? (
                  <Flame className="w-4 h-4 text-red-500" />
                ) : (
                  <AlertOctagon className="w-4 h-4 text-neutral-400" />
                )}
                <span className="font-extrabold">
                  {result.status === 'success' ? '강화 완료!' : result.status === 'destroy' ? '파쇄 소실..' : '강화 실패'}
                </span>
              </div>
              <span>{result.msg}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
