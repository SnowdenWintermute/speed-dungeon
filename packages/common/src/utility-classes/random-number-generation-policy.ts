import { NormalizedPercentage } from "../aliases.js";
import { invariant } from "../utils/index.js";
import {
  BasicRandomNumberGenerator,
  FixedNumberGenerator,
  RandomNumberGenerator,
} from "./randomizers.js";

export const RANDOM_VALUE = { MIN: 0, MAX: 1 };

export function isValidNormalized(value: number): boolean {
  return value >= 0 && value <= 1;
}

export function rollIsSuccess(chance: NormalizedPercentage, roll: NormalizedPercentage): boolean {
  invariant(isValidNormalized(chance), "chance must be between 0 and 1");
  invariant(isValidNormalized(roll), "roll must be between 0 and 1");

  // High-roll system: success occurs if the roll falls within the top `chance`
  // portion of the [0, 1] range. The comparison is inclusive so that:
  // - chance === 0 always fails
  // - chance === 1 always succeeds (even when roll = 0)
  return roll >= 1 - chance;
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
  combatHitDetermination: RandomNumberGenerator;
  combatCriticalHit: RandomNumberGenerator;
  combatResourceChange: RandomNumberGenerator;
  combatDurabilityTarget: RandomNumberGenerator;
  bouncingProjectileTargetSelection: RandomNumberGenerator;
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
      combatHitDetermination: basic,
      combatCriticalHit: basic,
      combatResourceChange: basic,
      combatDurabilityTarget: basic,
      bouncingProjectileTargetSelection: basic,
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
      combatHitDetermination: fixed,
      combatCriticalHit: fixed,
      combatResourceChange: fixed,
      combatDurabilityTarget: fixed,
      bouncingProjectileTargetSelection: fixed,
      consumableEffect: fixed,
      dungeonLayout: fixed,
      monsterEquipment: fixed,
      ...overrides,
    };
  }
}
