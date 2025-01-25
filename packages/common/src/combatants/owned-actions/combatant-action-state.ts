import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";

export class CombatantActionState {
  constructor(
    public actionName: CombatActionName,
    public level = 0
  ) {}
}
