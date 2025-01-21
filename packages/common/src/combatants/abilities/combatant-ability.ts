import { AbilityName } from "./ability-names.js";

export class CombatantAbility {
  constructor(
    public name: AbilityName = AbilityName.Attack,
    public level = 0
  ) {}

  static createByName(abilityName: AbilityName) {
    return new CombatantAbility(abilityName, 1);
  }
}
