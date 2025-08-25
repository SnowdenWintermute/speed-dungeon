import { ActionTracker } from "../../../action-processing/index.js";
import { CombatantContext } from "../../../combatant-context/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { TargetingCalculator } from "../../targeting/targeting-calculator.js";
import {
  ActionPayableResource,
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionComponent,
} from "../index.js";

export const DAMAGING_ACTIONS_COMMON_CONFIG = {
  shouldExecute: (
    combatantContext: CombatantContext,
    previousTrackerOption: undefined | ActionTracker,
    self: CombatActionComponent
  ) => {
    const { game, party, combatant } = combatantContext;

    const isInCombat = party.battleId !== null;
    const actionPointCost =
      self.costProperties.getResourceCosts(
        combatantContext.combatant.combatantProperties,
        isInCombat,
        1 // @TODO - actually select the action level
      )?.[ActionPayableResource.ActionPoints] ?? 0;
    const { actionPoints } = combatantContext.combatant.combatantProperties;
    if (actionPoints < Math.abs(actionPointCost)) {
      console.log("not enough AP to execute action");
      return false;
    }

    const targetsOption = combatant.combatantProperties.combatActionTarget;
    if (!targetsOption) {
      console.log("no target found when attempting to execute action");
      return false;
    }

    const targetingCalculator = new TargetingCalculator(
      new CombatantContext(game, party, combatant),
      null
    );

    const targetIdsResult = targetingCalculator.getCombatActionTargetIds(self, targetsOption);
    if (targetIdsResult instanceof Error) {
      console.trace(targetIdsResult);
      return false;
    }

    if (targetIdsResult.length === 0) {
      console.log("no target ids found when attempting to execute action");
      return false;
    }

    // if previous was countered, don't continue the queued action sequence
    if (previousTrackerOption) {
      const wasCountered = previousTrackerOption.wasCountered();

      if (wasCountered) {
        console.log("action was countered");
        return false;
      }
    }

    console.log(
      "all combatants in target group are dead: ",
      SpeedDungeonGame.allCombatantsInGroupAreDead(game, targetIdsResult)
    );

    return !SpeedDungeonGame.allCombatantsInGroupAreDead(game, targetIdsResult);
  },
};
