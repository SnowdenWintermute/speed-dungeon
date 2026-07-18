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

export type ActionResourceCosts = Partial<Record<ActionPayableResource, number>>;

export type ActionCostsByRank = Partial<Record<number, ActionResourceCosts>>;
