import { CombatantProperties } from "../../../combatants/index.js";
import { ConsumableType } from "../../../items/consumables/index.js";
import { EntityId } from "../../../primatives/index.js";
import { COMBAT_ACTIONS } from "../action-implementations/index.js";
import { CombatActionComponent } from "../index.js";

export interface CombatActionCost {
  base: number;
  multipliers?: CombatActionCostMultipliers;
}
export interface CombatActionCostMultipliers {
  actionLevel?: number;
  userCombatantLevel?: number;
}

export interface ActionResourceCostBases {
  hp?: CombatActionCost;
  mp?: CombatActionCost;
  shards?: CombatActionCost;
  quickActions?: CombatActionCost;
  consumableType?: ConsumableType;
}

export interface ActionResourceCosts {
  hp?: number;
  mp?: number;
  shards?: number;
  quickActions?: number;
  consumableId?: EntityId;
}

export function getStandardActionResourceCosts(
  user: CombatantProperties,
  action: CombatActionComponent
): null | ActionResourceCosts {
  return null;
  //@TODO -

  // const { manaCost, abilityLevelManaCostMultiplier, combatantLevelManaCostMultiplier } =
  //   abilityAttributes;
  // const abilityLevelAdjustedManaCost = ability.level * (manaCost * abilityLevelManaCostMultiplier);
  // const combatantLevelManaCostAdjustment =
  //   combatantProperties.level * combatantLevelManaCostMultiplier;
  // return abilityLevelAdjustedManaCost + combatantLevelManaCostAdjustment;
}
