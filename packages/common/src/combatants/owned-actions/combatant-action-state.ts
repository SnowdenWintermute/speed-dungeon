import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { MaxAndCurrent } from "../../primatives/max-and-current.js";

export class CombatantActionState {
  constructor(
    public actionName: CombatActionName,
    public level = 1,
    public cooldown: MaxAndCurrent = new MaxAndCurrent(1, 1)
  ) {}
}
