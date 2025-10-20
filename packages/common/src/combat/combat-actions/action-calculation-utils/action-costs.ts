import { CombatantProperties } from "../../../combatants/combatant-properties.js";
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
