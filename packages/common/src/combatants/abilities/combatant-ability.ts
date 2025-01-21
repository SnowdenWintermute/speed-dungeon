import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";

export class CombatantAbility {
  constructor(
    public actionName: CombatActionName,
    public level = 0
  ) {}
}
