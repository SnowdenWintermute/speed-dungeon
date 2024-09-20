import getAbilityAttributes from "./get-ability-attributes.js";

export enum CombatantAbilityName {
  Attack,
  AttackMeleeMainhand,
  AttackMeleeOffhand,
  AttackRangedMainhand,
  Fire,
  Ice,
  Healing,
}

export class CombatantAbility {
  constructor(
    public name: CombatantAbilityName = CombatantAbilityName.Attack,
    public level = 0
  ) {}

  static getAttributes = getAbilityAttributes;
  static createByName(abilityName: CombatantAbilityName) {
    return new CombatantAbility(abilityName, 1);
  }
}

export function formatAbilityName(abilityName: CombatantAbilityName) {
  switch (abilityName) {
    case CombatantAbilityName.Attack:
      return "Attack";
    case CombatantAbilityName.AttackMeleeMainhand:
      return "Attack Melee Main Hand";
    case CombatantAbilityName.AttackMeleeOffhand:
      return "Attack Melee Off Hand";
    case CombatantAbilityName.AttackRangedMainhand:
      return "Ranged Attack";
    case CombatantAbilityName.Fire:
      return "Fire";
    case CombatantAbilityName.Ice:
      return "Ice";
    case CombatantAbilityName.Healing:
      return "Healing";
  }
}
