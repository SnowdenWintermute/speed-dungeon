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
