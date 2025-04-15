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

export type ActionResourceCostBases = Partial<Record<ActionPayableResource, CombatActionCost>>;

export type ActionResourceCosts = Partial<Record<ActionPayableResource, number>>;
