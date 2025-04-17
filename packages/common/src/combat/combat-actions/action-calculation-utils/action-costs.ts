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
}

export const ACTION_PAYABLE_RESOURCE_STRINGS: Record<ActionPayableResource, string> = {
  [ActionPayableResource.HitPoints]: "Hit Points",
  [ActionPayableResource.Mana]: "Mana",
  [ActionPayableResource.Shards]: "Shards",
  [ActionPayableResource.QuickActions]: "Quick Actions",
};

export type ActionResourceCostBases = Partial<Record<ActionPayableResource, CombatActionCost>>;

export type ActionResourceCosts = Partial<Record<ActionPayableResource, number>>;
