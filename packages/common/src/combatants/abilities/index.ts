import getAbilityAttributes from "./get-ability-attributes";

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
