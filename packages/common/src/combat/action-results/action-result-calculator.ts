import { Battle } from "../../battle";
import { CombatAction } from "../combat-actions";
import { CombatActionTarget } from "../targeting/combat-action-targets";
import calculateActionManaCost from "./calculate-action-mana-cost";
import calculateActionResult from "./calculate-action-result";
import getCombatActionTargetIds from "./get-action-target-ids";

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
