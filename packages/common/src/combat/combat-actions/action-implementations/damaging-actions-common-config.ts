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
    console.log(
      "action point cost: ",
      actionPointCost,
      "for action",
      COMBAT_ACTION_NAME_STRINGS[self.name],
      "curr points:",
      combatantContext.combatant.combatantProperties.actionPoints
    );
    if (actionPoints < Math.abs(actionPointCost)) return false;

    const targetsOption = combatant.combatantProperties.combatActionTarget;
    if (!targetsOption) return false;

    const targetingCalculator = new TargetingCalculator(
      new CombatantContext(game, party, combatant),
      null
    );

    const targetIdsResult = targetingCalculator.getCombatActionTargetIds(self, targetsOption);
    if (targetIdsResult instanceof Error) {
      console.trace(targetIdsResult);
      return false;
    }

    if (targetIdsResult.length === 0) return false;

    // if previous was countered, don't continue the queued action sequence
    if (previousTrackerOption) {
      const wasCountered = previousTrackerOption.wasCountered();

      if (wasCountered) return false;
    }

    return !SpeedDungeonGame.allCombatantsInGroupAreDead(game, targetIdsResult);
  },
};
