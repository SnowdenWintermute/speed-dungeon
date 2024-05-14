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
  constructor(name: CombatantAbilityNames, level: number) {}
}
