export enum CombatActionName {
  Attack,
  AttackMeleeMainhand,
  AttackMeleeOffhand,
  AttackRangedMainhand,
  ChainingSplitArrowParent,
  ChainingSplitArrowProjectile,
  // Fire,
  // Ice,
  // Healing,
  // Destruction,
  UseGreenAutoinjector,
  UseBlueAutoinjector,
}

export const COMBAT_ACTION_NAME_STRINGS: Record<CombatActionName, string> = {
  [CombatActionName.Attack]: "Attack",
  [CombatActionName.AttackMeleeMainhand]: "Attack Melee Mainhand",
  [CombatActionName.AttackMeleeOffhand]: "Attack Melee Offhand",
  [CombatActionName.AttackRangedMainhand]: "Attack Ranged Mainhand",
  [CombatActionName.UseGreenAutoinjector]: "Green Autoinjector",
  [CombatActionName.UseBlueAutoinjector]: "Blue Autoinjector",
  [CombatActionName.ChainingSplitArrowParent]: "Chaining Split Arrow",
  [CombatActionName.ChainingSplitArrowProjectile]: "Chaining Split Arrow Projectile",
};
