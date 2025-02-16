export enum CombatActionName {
  Attack,
  AttackMeleeMainhand,
  AttackMeleeOffhand,
  AttackRangedMainhand,
  AttackRangedMainhandProjectile,
  ChainingSplitArrowParent,
  ChainingSplitArrowProjectile,
  // Explosion,
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
  [CombatActionName.AttackRangedMainhandProjectile]: "Attack Ranged Mainhand Projectile",
  [CombatActionName.ChainingSplitArrowParent]: "Chaining Split Arrow",
  [CombatActionName.ChainingSplitArrowProjectile]: "Chaining Split Arrow Projectile",
  // [CombatActionName.Explosion]: "Explosion",
  [CombatActionName.UseGreenAutoinjector]: "Green Autoinjector",
  [CombatActionName.UseBlueAutoinjector]: "Blue Autoinjector",
};
