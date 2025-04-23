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
  QuickActions,
}

export const ACTION_PAYABLE_RESOURCE_STRINGS: Record<ActionPayableResource, string> = {
  [ActionPayableResource.HitPoints]: "Hit Points",
  [ActionPayableResource.Mana]: "Mana",
  [ActionPayableResource.Shards]: "Shards",
  [ActionPayableResource.QuickActions]: "Quick Actions",
};

export type ActionResourceCostBases = Partial<Record<ActionPayableResource, CombatActionCostBase>>;

export type ActionResourceCosts = Partial<Record<ActionPayableResource, number>>;

export function getStandardActionCost(user: CombatantProperties, self: CombatActionComponent) {
  console.log("getStandardActionCost");
  const actionInstanceOption = user.ownedActions[self.name];
  if (!actionInstanceOption) throw new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NOT_OWNED);

  let toReturn: Partial<Record<ActionPayableResource, number>> | null = {};

  for (const [payableResourceType, costBase] of iterateNumericEnumKeyedRecord(self.costBases)) {
    let cost = costBase.base;

    if (costBase.additives) {
      if (costBase.additives.actionLevel)
        cost += costBase.additives.actionLevel * actionInstanceOption.level;
      if (costBase.additives.userCombatantLevel)
        cost += costBase.additives.userCombatantLevel * user.level;
    }
    if (costBase.multipliers) {
      if (costBase.multipliers.actionLevel)
        cost *= costBase.multipliers.actionLevel * actionInstanceOption.level;
      if (costBase.multipliers.userCombatantLevel)
        cost *= costBase.multipliers.userCombatantLevel * user.level;
    }

    cost = Math.floor(cost);
    cost *= -1;

    toReturn[payableResourceType] = cost;
  }

  console.log("toReturn:", toReturn);

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
      case ActionPayableResource.QuickActions:
    }
  }

  return unmet;
}
