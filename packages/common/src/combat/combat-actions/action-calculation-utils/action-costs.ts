import { CombatantProperties } from "../../../combatants/index.js";
import { ConsumableType } from "../../../items/consumables/index.js";
import { EntityId } from "../../../primatives/index.js";
import { CombatActionComponent } from "../index.js";

export interface CombatActionCost {
  base: number;
  multipliers?: CombatActionCostMultipliers;
}
export interface CombatActionCostMultipliers {
  actionLevel?: number;
  userCombatantLevel?: number;
}

export enum ActionPayableResource {
  HitPoints,
  Mana,
  Shards,
  QuickActions,
  ConsumableType,
}

export type ActionResourceCostBases = Partial<Record<ActionPayableResource, CombatActionCost>>;

export interface ActionResourceCosts {
  [ActionPayableResource.HitPoints]?: number;
  [ActionPayableResource.Mana]?: number;
  [ActionPayableResource.Shards]?: number;
  [ActionPayableResource.QuickActions]?: number;
  [ActionPayableResource.ConsumableType]?: ConsumableType;
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
