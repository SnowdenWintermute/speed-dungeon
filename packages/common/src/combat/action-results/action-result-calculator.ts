import { Battle } from "../../battle/index.js";
import { CombatAction } from "../combat-actions/index.js";
import { CombatActionTarget } from "../targeting/combat-action-targets.js";
import calculateActionManaCost from "./calculate-action-mana-cost.js";
import calculateActionResult from "./calculate-action-result.js";
import getCombatActionTargetIds from "./get-action-target-ids.js";

export abstract class ActionResultCalculator {
  static calculateActionResult = calculateActionResult;
  static getCombatActionTargetIds = getCombatActionTargetIds;
  static calculateActionManaCost = calculateActionManaCost;
}

export interface ActionResultCalculationArguments {
  combatAction: CombatAction;
  userId: string;
  targets: CombatActionTarget;
  battleOption: null | Battle;
  allyIds: string[];
}
