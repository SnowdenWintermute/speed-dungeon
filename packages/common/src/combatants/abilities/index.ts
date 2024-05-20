import getAttributes from "./get-ability-attributes";

export enum CombatantAbilityNames {
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
    public name: CombatantAbilityNames = CombatantAbilityNames.Attack,
    public level = 0
  ) {}
  static getAttributes = getAttributes;
}
