import { Battle } from "../../../battle";
import { CombatAction } from "../../combat-actions";
import { CombatActionTarget } from "../../targeting/combat-action-targets";
import calculateActionHitPointAndManaChanges from "./calculate-action-hit-point-and-mana-changes";
import calculateActionManaCost from "./calculate-action-mana-cost";

export abstract class ActionResultCalculator {
  static calculateActionHitPointAndManaChanges = calculateActionHitPointAndManaChanges;
  static calculateActionManaCost = calculateActionManaCost;
}

export interface ActionResultCalculationArguments {
  combatAction: CombatAction;
  userId: string;
  targets: CombatActionTarget;
  battleOption: null | Battle;
  allyIds: string[];
}
