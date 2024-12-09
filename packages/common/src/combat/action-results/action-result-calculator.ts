import { Battle } from "../../battle/index.js";
import { CombatAction } from "../combat-actions/index.js";
import { CombatActionTarget } from "../targeting/combat-action-targets.js";
import calculateActionManaCost from "./calculate-action-mana-cost.js";
import calculateActionResult from "./index.js";

export abstract class ActionResultCalculator {
  static calculateActionResult = calculateActionResult;
  static calculateActionManaCost = calculateActionManaCost;
}

export interface ActionResultCalculationArguments {
  combatAction: CombatAction;
  userId: string;
  targets: CombatActionTarget;
  battleOption: null | Battle;
  allyIds: string[];
}
