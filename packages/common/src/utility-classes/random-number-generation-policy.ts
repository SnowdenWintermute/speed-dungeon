import { NormalizedPercentage } from "../aliases.js";
import {
  BasicRandomNumberGenerator,
  FixedNumberGenerator,
  RandomNumberGenerator,
} from "./randomizers.js";

export const NORMALIZED_VALUE = { MIN: 0, MAX: 1 };
export const RNG_RANGE = { MIN: 0, MAX: 1 - Number.EPSILON };

export function isValidNormalized(value: number): boolean {
  return value >= NORMALIZED_VALUE.MIN && value <= NORMALIZED_VALUE.MAX;
}

export function rollIsSuccess(props: {
  successChance: NormalizedPercentage;
  roll: NormalizedPercentage;
}): boolean {
  const { successChance, roll } = props;
  const boundedSuccess = Math.max(0, Math.min(1, successChance));

  // High-roll system: success occurs if the roll falls within the top `chance`
  // portion of the [0, 1] range. The comparison is inclusive so that:
  // - chance === 0 always fails
  // - chance === 1 always succeeds (even when roll = 0)
  return roll >= 1 - boundedSuccess;
}

export interface RandomNumberGenerationPolicy {
  // Item/Loot generation
  lootTableSelection: RandomNumberGenerator;
  consumableTypeFallback: RandomNumberGenerator;
  // Equipment base properties
  equipmentBaseProperties: RandomNumberGenerator;
  equipmentDurability: RandomNumberGenerator;
  // Magical & affix system
  magicalDetermination: RandomNumberGenerator;
  affixSlotDistribution: RandomNumberGenerator;
  affixTypeSelection: RandomNumberGenerator;
  affixTier: RandomNumberGenerator;
  affixValue: RandomNumberGenerator;
  // Combat
  hitChance: RandomNumberGenerator;
  criticalStrike: RandomNumberGenerator;
  parry: RandomNumberGenerator;
  counterAttack: RandomNumberGenerator;
  shieldBlock: RandomNumberGenerator;
  spellResist: RandomNumberGenerator;
  combatResourceChange: RandomNumberGenerator;
  combatDurabilityTarget: RandomNumberGenerator;
  bouncingProjectileTargetSelection: RandomNumberGenerator;
  // Monsters
  monsterAiRandomAction: RandomNumberGenerator;
  monsterEquipmentChoice: RandomNumberGenerator;
  // Consumables
  consumableEffect: RandomNumberGenerator;
  // World generation
  dungeonLayout: RandomNumberGenerator;
  monsterEquipment: RandomNumberGenerator;
}

export class RandomNumberGenerationPolicyFactory {
  static allRandomPolicy(
    overrides?: Partial<RandomNumberGenerationPolicy>
  ): RandomNumberGenerationPolicy {
    const basic = new BasicRandomNumberGenerator();
    return {
      lootTableSelection: basic,
      consumableTypeFallback: basic,
      equipmentBaseProperties: basic,
      equipmentDurability: basic,
      magicalDetermination: basic,
      affixSlotDistribution: basic,
      affixTypeSelection: basic,
      affixTier: basic,
      affixValue: basic,
      hitChance: basic,
      criticalStrike: basic,
      parry: basic,
      counterAttack: basic,
      shieldBlock: basic,
      spellResist: basic,
      combatResourceChange: basic,
      combatDurabilityTarget: basic,
      bouncingProjectileTargetSelection: basic,
      monsterAiRandomAction: basic,
      monsterEquipmentChoice: basic,
      consumableEffect: basic,
      dungeonLayout: basic,
      monsterEquipment: basic,
      ...overrides,
    };
  }

  static allFixedPolicy(
    value: NormalizedPercentage,
    overrides?: Partial<RandomNumberGenerationPolicy>
  ): RandomNumberGenerationPolicy {
    const fixed = new FixedNumberGenerator(value);
    return {
      lootTableSelection: fixed,
      consumableTypeFallback: fixed,
      equipmentBaseProperties: fixed,
      equipmentDurability: fixed,
      magicalDetermination: fixed,
      affixSlotDistribution: fixed,
      affixTypeSelection: fixed,
      affixTier: fixed,
      affixValue: fixed,
      hitChance: fixed,
      criticalStrike: fixed,
      parry: fixed,
      counterAttack: fixed,
      shieldBlock: fixed,
      spellResist: fixed,
      combatResourceChange: fixed,
      combatDurabilityTarget: fixed,
      bouncingProjectileTargetSelection: fixed,
      monsterAiRandomAction: fixed,
      monsterEquipmentChoice: fixed,
      consumableEffect: fixed,
      dungeonLayout: fixed,
      monsterEquipment: fixed,
      ...overrides,
    };
  }
}
