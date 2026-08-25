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
  consumableTypeFallback: RandomNumberGenerator;
  lootDropRuleChance: RandomNumberGenerator;
  lootDropQuantity: RandomNumberGenerator;
  lootItemLevelRoll: RandomNumberGenerator;
  lootItemSelection: RandomNumberGenerator;
  // Equipment base properties
  equipmentBaseProperties: RandomNumberGenerator;
  equipmentGenerationDurability: RandomNumberGenerator;
  // Magical & affix system
  magicalDetermination: RandomNumberGenerator;
  affixSlotDistribution: RandomNumberGenerator;
  affixTypeSelection: RandomNumberGenerator;
  affixTier: RandomNumberGenerator;
  affixValue: RandomNumberGenerator;
  guaranteedAffixCategoryDraw: RandomNumberGenerator;
  // Combat
  hitChance: RandomNumberGenerator;
  criticalStrike: RandomNumberGenerator;
  parry: RandomNumberGenerator;
  counterAttack: RandomNumberGenerator;
  shieldBlock: RandomNumberGenerator;
  spellResist: RandomNumberGenerator;
  combatResourceChange: RandomNumberGenerator;
  durabilityLossOnHitOutcome: RandomNumberGenerator;
  durabilityLossOnUse: RandomNumberGenerator;
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
  monsterGenerationTypeSelection: RandomNumberGenerator;
  floorPaletteSelection: RandomNumberGenerator;
  roomFillSelection: RandomNumberGenerator;
  bossSelection: RandomNumberGenerator;
}

export class RandomNumberGenerationPolicyFactory {
  static policyFromGenerator(
    generator: RandomNumberGenerator,
    overrides?: Partial<RandomNumberGenerationPolicy>
  ): RandomNumberGenerationPolicy {
    return {
      consumableTypeFallback: generator,
      lootDropRuleChance: generator,
      lootDropQuantity: generator,
      lootItemLevelRoll: generator,
      lootItemSelection: generator,
      equipmentBaseProperties: generator,
      equipmentGenerationDurability: generator,
      magicalDetermination: generator,
      affixSlotDistribution: generator,
      affixTypeSelection: generator,
      affixTier: generator,
      affixValue: generator,
      guaranteedAffixCategoryDraw: generator,
      hitChance: generator,
      criticalStrike: generator,
      parry: generator,
      counterAttack: generator,
      shieldBlock: generator,
      spellResist: generator,
      combatResourceChange: generator,
      combatDurabilityTarget: generator,
      durabilityLossOnHitOutcome: generator,
      durabilityLossOnUse: generator,
      bouncingProjectileTargetSelection: generator,
      monsterAiRandomAction: generator,
      monsterEquipmentChoice: generator,
      consumableEffect: generator,
      dungeonLayout: generator,
      monsterEquipment: generator,
      monsterGenerationTypeSelection: generator,
      floorPaletteSelection: generator,
      roomFillSelection: generator,
      bossSelection: generator,
      ...overrides,
    };
  }

  static allRandomPolicy(
    overrides?: Partial<RandomNumberGenerationPolicy>
  ): RandomNumberGenerationPolicy {
    return RandomNumberGenerationPolicyFactory.policyFromGenerator(
      new BasicRandomNumberGenerator(),
      overrides
    );
  }

  static allFixedPolicy(
    value: NormalizedPercentage,
    overrides?: Partial<RandomNumberGenerationPolicy>
  ): RandomNumberGenerationPolicy {
    return RandomNumberGenerationPolicyFactory.policyFromGenerator(
      new FixedNumberGenerator(value),
      overrides
    );
  }
}
