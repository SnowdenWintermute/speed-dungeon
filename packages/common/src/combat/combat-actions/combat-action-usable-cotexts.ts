export enum CombatActionUsabilityContext {
  All,
  InCombat,
  OutOfCombat,
}

export const COMBAT_ACTION_USABLITY_CONTEXT_STRINGS: Record<CombatActionUsabilityContext, string> =
  {
    [CombatActionUsabilityContext.All]: "any time",
    [CombatActionUsabilityContext.InCombat]: "in combat",
    [CombatActionUsabilityContext.OutOfCombat]: "out of combat",
  };
