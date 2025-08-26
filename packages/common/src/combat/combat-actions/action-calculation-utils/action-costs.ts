import { CombatActionComponent } from "..";
import { CombatantProperties } from "../../../combatants/index.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { iterateNumericEnumKeyedRecord } from "../../../utils/index.js";

export interface CombatActionCostBase {
  base: number;
  multipliers?: CombatActionCostModifiers;
  additives?: CombatActionCostModifiers;
}
export interface CombatActionCostModifiers {
  actionLevel?: number;
  userCombatantLevel?: number;
}

export enum ActionPayableResource {
  HitPoints,
  Mana,
  Shards,
  ActionPoints,
}

export const ACTION_PAYABLE_RESOURCE_STRINGS: Record<ActionPayableResource, string> = {
  [ActionPayableResource.HitPoints]: "Hit Points",
  [ActionPayableResource.Mana]: "Mana",
  [ActionPayableResource.Shards]: "Shards",
  [ActionPayableResource.ActionPoints]: "Action Points",
};

export type ActionResourceCostBases = Partial<Record<ActionPayableResource, CombatActionCostBase>>;

export type ActionResourceCosts = Partial<Record<ActionPayableResource, number>>;

export function getStandardActionCost(
  user: CombatantProperties,
  inCombat: boolean,
  actionLevel: number,
  self: CombatActionComponent
) {
  // we may need to check costs of actions they don't technically own,
  // such as "attack melee offhand" which is a triggered child action but
  // not actually an action they can "own" or ask to use independantly

  let toReturn: Partial<Record<ActionPayableResource, number>> | null = {};
  const { costBases } = self.costProperties;

  for (const [payableResourceType, costBase] of iterateNumericEnumKeyedRecord(costBases)) {
    if (payableResourceType === ActionPayableResource.ActionPoints && !inCombat) continue;
    let cost = costBase.base;

    if (costBase.multipliers) {
      if (costBase.multipliers.actionLevel) cost *= costBase.multipliers.actionLevel * actionLevel;
      if (costBase.multipliers.userCombatantLevel)
        cost *= costBase.multipliers.userCombatantLevel * user.level;
    }

    if (costBase.additives) {
      if (costBase.additives.actionLevel) cost += costBase.additives.actionLevel * actionLevel;
      if (costBase.additives.userCombatantLevel)
        cost += costBase.additives.userCombatantLevel * user.level;
    }

    cost = Math.floor(cost);
    cost *= -1;

    toReturn[payableResourceType] = cost;
  }

  if (Object.keys(toReturn).length === 0) toReturn = null;

  return toReturn;
}

export function getUnmetCostResourceTypes(
  combatantProperties: CombatantProperties,
  costs: Partial<Record<ActionPayableResource, number>>
) {
  const unmet: ActionPayableResource[] = [];

  for (const [resourceType, cost] of iterateNumericEnumKeyedRecord(costs)) {
    const absoluteCost = Math.abs(cost); // costs are in negative values

    switch (resourceType) {
      case ActionPayableResource.HitPoints:
        if (absoluteCost > combatantProperties.hitPoints) unmet.push(resourceType);
        break;
      case ActionPayableResource.Mana:
        if (absoluteCost > combatantProperties.mana) unmet.push(resourceType);
        break;
      case ActionPayableResource.Shards:
        if (absoluteCost > combatantProperties.inventory.shards) unmet.push(resourceType);
        break;
      case ActionPayableResource.ActionPoints:
        if (absoluteCost > combatantProperties.actionPoints) unmet.push(resourceType);
        break;
    }
  }

  return unmet;
}
