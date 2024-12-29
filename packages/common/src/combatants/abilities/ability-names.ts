export enum AbilityName {
  Attack,
  AttackMeleeMainhand,
  AttackMeleeOffhand,
  AttackRangedMainhand,
  Fire,
  Ice,
  Healing,
  Destruction,
}

export class CombatantAbility {
  constructor(
    public name: AbilityName = AbilityName.Attack,
    public level = 0
  ) {}

  static createByName(abilityName: AbilityName) {
    return new CombatantAbility(abilityName, 1);
  }
}

export const ABILITY_NAME_STRINGS: Record<AbilityName, string> = {
  [AbilityName.Attack]: "Attack",
  [AbilityName.AttackMeleeMainhand]: "Attack Melee Mainhand",
  [AbilityName.AttackMeleeOffhand]: "Attack Melee Offhand",
  [AbilityName.AttackRangedMainhand]: "Attack Ranged Mainhand",
  [AbilityName.Fire]: "Fire",
  [AbilityName.Ice]: "Ice",
  [AbilityName.Healing]: "Healing",
  [AbilityName.Destruction]: "Destruction",
};
