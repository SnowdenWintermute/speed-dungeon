import { getAbilityAttributes } from "./get-ability-attributes";
export * from "./ability-attributes";
export * from "./get-ability-attributes";

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
    case CombatantAbilityName.AttackMeleeMainhand:
    case CombatantAbilityName.AttackMeleeOffhand:
    case CombatantAbilityName.AttackRangedMainhand:
      return "Attack";
    case CombatantAbilityName.Fire:
      return "Fire";
    case CombatantAbilityName.Ice:
      return "Ice";
    case CombatantAbilityName.Healing:
      return "Healing";
  }
}
