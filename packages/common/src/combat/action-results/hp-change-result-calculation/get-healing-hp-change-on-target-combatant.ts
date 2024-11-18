import {
  CombatAttribute,
  CombatantProperties,
  CombatantTraitType,
} from "../../../combatants/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";

export const UNDEAD_DAMAGE_FROM_HEALING_MULTIPLIER = -1;

export default function getHealingHpChangeOnTargetCombatant(
  game: SpeedDungeonGame,
  targetId: string,
  baseHpChange: number
): Error | number {
  let hpChange = baseHpChange;

  const targetCombatantResult = SpeedDungeonGame.getCombatantById(game, targetId);
  if (targetCombatantResult instanceof Error) return targetCombatantResult;
  const { combatantProperties: targetCombatantProperties } = targetCombatantResult;
  const targetCombatAttributes = CombatantProperties.getTotalAttributes(targetCombatantProperties);
  const targetResilience = targetCombatAttributes[CombatAttribute.Resilience] || 0;
  const resilienceMultiplier = targetResilience / 100 + 1.0;
  let isUndead = false;
  for (const trait of targetCombatantProperties.traits) {
    if (trait.type === CombatantTraitType.Undead) {
      isUndead = true;
      break;
    }
  }

  if (isUndead) {
    hpChange *= UNDEAD_DAMAGE_FROM_HEALING_MULTIPLIER;
  } else {
    hpChange *= resilienceMultiplier;
  }

  return hpChange;
}
