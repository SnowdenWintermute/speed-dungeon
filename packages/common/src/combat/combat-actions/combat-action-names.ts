export enum CombatActionName {
  Attack,
  AttackMeleeMainhand,
  AttackMeleeOffhand,
  AttackRangedMainhand,
  Fire,
  Ice,
  Healing,
  Destruction,
  UseGreenAutoinjector,
  UseBlueAutoinjector,
}

export const COMBAT_ACTION_NAME_STRINGS: Record<CombatActionName, string> = {
  [CombatActionName.Attack]: "Attack",
  [CombatActionName.AttackMeleeMainhand]: "Attack Melee Mainhand",
  [CombatActionName.AttackMeleeOffhand]: "Attack Melee Offhand",
  [CombatActionName.AttackRangedMainhand]: "Attack Ranged Mainhand",
  [CombatActionName.Fire]: "Fire",
  [CombatActionName.Ice]: "Ice",
  [CombatActionName.Healing]: "Healing",
  [CombatActionName.Destruction]: "Destruction",
  [CombatActionName.UseGreenAutoinjector]: "Use Green Autoinjector",
  [CombatActionName.UseBlueAutoinjector]: "Use Blue Autoinjector",
};
