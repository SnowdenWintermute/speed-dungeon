import { Battle } from "../../battle/index.js";
import { CombatActionComponent } from "../combat-actions/index.js";
import { CombatActionTarget } from "../targeting/combat-action-targets.js";

export interface ActionResultCalculationArguments {
  combatAction: CombatActionComponent;
  userId: string;
  targets: CombatActionTarget;
  battleOption: null | Battle;
  allyIds: string[];
}
