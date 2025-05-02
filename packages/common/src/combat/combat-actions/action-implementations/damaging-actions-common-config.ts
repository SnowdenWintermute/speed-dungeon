import { CombatantContext } from "../../../combatant-context/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { TargetingCalculator } from "../../targeting/targeting-calculator.js";
import { COMBAT_ACTION_NAME_STRINGS, CombatActionComponent } from "../index.js";

export const DAMAGING_ACTIONS_COMMON_CONFIG = {
  shouldExecute: (context: CombatantContext, self: CombatActionComponent) => {
    const { game, party, combatant } = context;

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

    console.log(
      "checking if should execute",
      COMBAT_ACTION_NAME_STRINGS[self.name],
      targetIdsResult.length
    );

    if (targetIdsResult.length === 0) return false;

    return !SpeedDungeonGame.allCombatantsInGroupAreDead(game, targetIdsResult);
  },
};
