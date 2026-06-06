import { Equipment, RarityType, EquipmentType, WeaponStyle, GameState, EquipmentOption } from './types';
import { ITEM_NAMES, WEAPON_NAMES, RARITY_TABLE, MONSTER_OPTIONS } from './data';

/**
 * Generates an item drop based on current hunting zone difficulty
 */
export function generateRandomEquipment(zoneIndex: number, forceBossDrop = false): Equipment {
  const roll = Math.random();
  let rarity: RarityType = 'common';

  if (forceBossDrop) {
    // Boss has higher rates
    if (roll < 0.0015) rarity = 'absolute';      // 0.15%
    else if (roll < 0.008) rarity = 'transcendent'; // 0.65%
    else if (roll < 0.03) rarity = 'mythic';        // 2.2%
    else if (roll < 0.11) rarity = 'legendary';     // 8.0%
    else if (roll < 0.35) rarity = 'epic';          // 24.0%
    else if (roll < 0.75) rarity = 'rare';          // 40.0%
    else rarity = 'uncommon';                       // 25.0%
  } else {
    // Normal rates
    if (roll < 0.00001) rarity = 'absolute';       // 0.001%
    else if (roll < 0.0001) rarity = 'transcendent';  // 0.009%
    else if (roll < 0.001) rarity = 'mythic';         // 0.09%
    else if (roll < 0.01) rarity = 'legendary';       // 0.9%
    else if (roll < 0.05) rarity = 'epic';            // 4.0%
    else if (roll < 0.15) rarity = 'rare';            // 10.0%
    else if (roll < 0.40) rarity = 'uncommon';        // 25.0%
    else rarity = 'common';                           // 60.0%
  }

  const types: EquipmentType[] = ['helmet', 'armor', 'pants', 'shoes', 'weapon'];
  const type = types[Math.floor(Math.random() * types.length)];

  let name = '';
  let weaponStyle: WeaponStyle | undefined;

  if (type === 'weapon') {
    const styles: WeaponStyle[] = ['sword', 'bow', 'gun', 'bomb'];
    weaponStyle = styles[Math.floor(Math.random() * styles.length)];
    const nameList = WEAPON_NAMES[weaponStyle];
    const nameIdx = Math.min(zoneIndex, nameList.length - 1);
    name = nameList[nameIdx];
  } else {
    const nameList = ITEM_NAMES[type];
    const nameIdx = Math.min(zoneIndex, nameList.length - 1);
    name = nameList[nameIdx];
  }

  // Calculate stats based on zone progression
  const scale = 5 + zoneIndex * 20 + (zoneIndex * zoneIndex * 12);
  const spec = RARITY_TABLE[rarity];
  const baseStat = Math.floor(scale * spec.statMultiplier);

  // Roll random options
  const options: EquipmentOption[] = [];
  const optionsToRoll = spec.optionCountPoints;
  const pool = [...MONSTER_OPTIONS];

  for (let i = 0; i < optionsToRoll; i++) {
    if (pool.length === 0) break;
    const poolIdx = Math.floor(Math.random() * pool.length);
    const target = pool.splice(poolIdx, 1)[0];

    // Scale values based on rarity weight and zone level
    const upgradeFactor = 1 + zoneIndex * 0.35 + (spec.statMultiplier * 0.1);
    const rolled = target.min + Math.random() * (target.max - target.min);
    const finalVal = Number((rolled * upgradeFactor).toFixed(target.isPercent ? 1 : 0));

    options.push({
      statName: target.statName,
      value: finalVal,
      label: `${target.label} +${finalVal}${target.isPercent ? '%' : ''}`
    });
  }

  return {
    id: `item_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
    name,
    type,
    weaponStyle,
    rarity,
    baseStat,
    enhanceLevel: 0,
    options
  };
}

/**
 * Calculates current aggregate combat stats from level, skills, rebirth benefits, and equipped gear.
 */
export function calculateCalculatedStats(state: GameState) {
  // 1. Calculate Base Values
  let baseAttack = 10 + (state.level - 1) * 2;
  let baseDefense = 5 + (state.level - 1) * 1;
  let baseMaxHp = 100 + (state.level - 1) * 15;

  if (state.level >= 100) {
    baseAttack += (state.level - 99) * 4;
    baseDefense += (state.level - 99) * 2;
    baseMaxHp += (state.level - 99) * 35;
  }

  // 2. Add Skill Upgrades
  baseAttack += (state.skills?.attackLevel || 0) * 5;
  baseDefense += (state.skills?.defenseLevel || 0) * 3;
  baseMaxHp += (state.skills?.defenseLevel || 0) * 40;

  // 3. Gather Equipment Multipliers and Additive Stats
  let weaponAttack = 0;
  let gearDefense = 0;
  let flatAttackAdd = 0;
  let flatDefenseAdd = 0;
  let flatHpAdd = 0;

  let attackPercentMod = 0;
  let defensePercentMod = 0;
  let critRateBonus = 0;
  let critDamageBonus = 0;
  let speedBonus = 0;
  let goldBonus = 0;

  const slots: ('helmet' | 'armor' | 'pants' | 'shoes' | 'weapon')[] = [
    'helmet', 'armor', 'pants', 'shoes', 'weapon'
  ];

  slots.forEach((slot) => {
    const item = state.equippedItems?.[slot];
    if (item) {
      // Calculate gear stat including Enhancement Level (15% multiplier per level)
      const gearBase = item.baseStat;
      const enhancedValue = Math.floor(gearBase * (1 + (item.enhanceLevel || 0) * 0.15));

      if (slot === 'weapon') {
        weaponAttack += enhancedValue;

        // Weapon style bonuses
        if (item.weaponStyle === 'bow') {
          critRateBonus += 8; // Bow bonus
        } else if (item.weaponStyle === 'gun') {
          speedBonus += 15; // Gun passive speed bonus
        } else if (item.weaponStyle === 'bomb') {
          attackPercentMod += 10; // Bomb passive attack bonus
        } else if (item.weaponStyle === 'sword') {
          weaponAttack += Math.floor(enhancedValue * 0.1); // Sword raw damage bonus
        }
      } else {
        gearDefense += enhancedValue;
      }

      // Roll options
      if (item.options) {
        item.options.forEach((opt) => {
          switch (opt.statName) {
            case 'attack_flat':
              flatAttackAdd += opt.value;
              break;
            case 'attack_percent':
              attackPercentMod += opt.value;
              break;
            case 'defense_flat':
              flatDefenseAdd += opt.value;
              break;
            case 'defense_percent':
              defensePercentMod += opt.value;
              break;
            case 'hp_flat':
              flatHpAdd += opt.value;
              break;
            case 'critical_chance':
              critRateBonus += opt.value;
              break;
            case 'critical_damage':
              critDamageBonus += opt.value;
              break;
            case 'attack_speed':
              speedBonus += opt.value;
              break;
            case 'gold_gain':
              goldBonus += opt.value;
              break;
          }
        });
      }
    }
  });

  // 4. Skill Tree Percentage Boosts
  critRateBonus += (state.skills?.criticalLevel || 0) * 1.5;
  critDamageBonus += (state.skills?.criticalLevel || 0) * 10;
  attackPercentMod += (state.skills?.dropLevel || 0) * 2; // small synergy helper
  goldBonus += (state.skills?.dropLevel || 0) * 5;

  // 5. Rebirth Point Multipliers (purchased boosts)
  // Rebirth points spent on attack give compound or additive
  const rebAttackPoints = state.rebirthUpgrades?.attackMultiplier || 0;
  const rebAttackFactor = Math.pow(1.15, rebAttackPoints); // +15% compound

  const rebExpPoints = state.rebirthUpgrades?.expMultiplier || 0;
  const rebExpFactor = 1 + rebExpPoints * 0.2; // +20% additive

  const rebDropPoints = state.rebirthUpgrades?.dropMultiplier || 0;
  const rebDropFactor = 1 + rebDropPoints * 0.15; // +15% additive

  const rebGoldPoints = state.rebirthUpgrades?.goldMultiplier || 0;
  const rebGoldFactor = 1 + rebGoldPoints * 0.25; // +25% additive

  // Add achievement boosts
  let achievementAttackBonus = 0;
  let achievementDropBonus = 0;
  let achievementGoldBonus = 0;
  let achievementCritRateBonus = 0;
  let achievementSpeedBonus = 0;
  let achievementExpBonus = 0;

  if (state.achievements?.unlockedAchievements) {
    const list = state.achievements.unlockedAchievements;
    if (list.includes('slime_hunter')) achievementAttackBonus += 10;
    if (list.includes('clicker_god')) achievementAttackBonus += 30;
    if (list.includes('first_legendary')) achievementDropBonus += 2; // +2% drop rate
    if (list.includes('boss_slayer_1')) achievementCritRateBonus += 3; // +3% crit chance
    if (list.includes('master_enchancer')) achievementGoldBonus += 15; // +15% gold gain
    if (list.includes('demon_slayer')) achievementExpBonus += 30; // +30% exp rate
    if (list.includes('rebirth_1')) {
      achievementAttackBonus += 50;
      achievementSpeedBonus += 5;
    }
  }

  // 6. Aggregate Final Combat stats
  const finalAttack = Math.floor(
    (baseAttack + weaponAttack + flatAttackAdd + achievementAttackBonus) *
    (1 + attackPercentMod / 100) *
    rebAttackFactor
  );

  const finalDefense = Math.floor(
    (baseDefense + gearDefense + flatDefenseAdd) *
    (1 + defensePercentMod / 100)
  );

  const finalMaxHp = Math.floor(baseMaxHp + flatHpAdd);

  // Critical chance starts at 5% base
  const finalCritRate = Number(Math.min(100, 5 + critRateBonus + achievementCritRateBonus).toFixed(1));

  // Critical damage starts at 150% base
  const finalCritDamage = Number((150 + critDamageBonus).toFixed(1));

  // Attack Speed (attacks/second if auto-hunt is on, or passive automation speed triggers)
  // Unlocked only if autoHuntLevel > 0! Starts at 0
  let finalAttackSpeed = 0;
  if (state.skills?.autoHuntLevel > 0) {
    // base speed is 0.8 hits/sec, +0.15 hits/sec per skill level
    const baseAutoSpeed = 0.8 + (state.skills.autoHuntLevel - 1) * 0.15;
    finalAttackSpeed = Number((baseAutoSpeed * (1 + (speedBonus + achievementSpeedBonus) / 100)).toFixed(2));
  }

  // Gold Multiplier starts at 1.0 (100%), boosts gold dropped by monsters
  const finalGoldMultiplier = Number(
    (1.0 * (1 + (goldBonus + achievementGoldBonus) / 100) * rebGoldFactor).toFixed(2)
  );

  // Experience Multiplier
  const finalExpMultiplier = Number((1.0 * (1 + achievementExpBonus / 100) * rebExpFactor).toFixed(2));

  // Drop Rate Mod
  const finalDropMultiplier = Number((1.0 * (1 + achievementDropBonus / 100) * rebDropFactor).toFixed(2));

  return {
    attack: finalAttack,
    defense: finalDefense,
    maxHp: finalMaxHp,
    criticalRate: finalCritRate,
    criticalDamage: finalCritDamage,
    attackSpeed: finalAttackSpeed,
    goldMultiplier: finalGoldMultiplier,
    expMultiplier: finalExpMultiplier,
    dropMultiplier: finalDropMultiplier
  };
}

/**
 * Gets enhancement parameters for an item given its current level.
 * Returns: { stonesRequired: number, stoneTierNeeded: string, successRate: number, degradeChance: number, destroyChance: number }
 */
export function getEnhanceSpecs(level: number) {
  let stoneTierNeeded = 't1';
  let stonesRequired = 1;

  if (level < 5) {
    stoneTierNeeded = 't1';
    stonesRequired = 1;
  } else if (level < 10) {
    stoneTierNeeded = 't2';
    stonesRequired = 2;
  } else if (level < 15) {
    stoneTierNeeded = 't3';
    stonesRequired = 2;
  } else if (level < 20) {
    stoneTierNeeded = 't4';
    stonesRequired = 3;
  } else if (level < 23) {
    stoneTierNeeded = 't5';
    stonesRequired = 3;
  } else if (level < 27) {
    stoneTierNeeded = 't6';
    stonesRequired = 4;
  } else {
    stoneTierNeeded = 't7';
    stonesRequired = 5;
  }

  // Rates based on level ranges:
  // 0 -> 10: 100% Success
  // 11 -> 20: Chance of failure, level down
  // 21 -> 30: Chance of destruction!
  let successRate = 1.0;
  let degradeChance = 0.0;
  let destroyChance = 0.0;

  if (level >= 10 && level < 15) {
    successRate = 0.8 - (level - 10) * 0.08; // 80% down to 48%
    degradeChance = 0.15;
  } else if (level >= 15 && level < 20) {
    successRate = 0.45 - (level - 15) * 0.07; // 45% down to 17%
    degradeChance = 0.35;
  } else if (level >= 20 && level < 25) {
    successRate = 0.15 - (level - 20) * 0.02; // 15% down to 7%
    degradeChance = 0.50;
    destroyChance = 0.05; // 5% blow up
  } else if (level >= 25 && level <= 30) {
    successRate = Math.max(0.01, 0.05 - (level - 25) * 0.01); // 5% down to 1% absolute floor
    degradeChance = 0.55;
    destroyChance = 0.15; // 15% blow up
  }

  return {
    stoneTierNeeded,
    stonesRequired,
    successRate: Number((successRate * 100).toFixed(0)),
    degradeChance: Number((degradeChance * 100).toFixed(0)),
    destroyChance: Number((destroyChance * 100).toFixed(0))
  };
}
