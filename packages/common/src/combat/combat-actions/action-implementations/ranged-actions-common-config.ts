import { CombatActionComponent } from "../index.js";
import { CombatantContext } from "../../../combatant-context/index.js";
import { CombatActionExecutionIntent } from "../combat-action-execution-intent.js";
import { CombatantProperties } from "../../../combatants/index.js";

export const RANGED_ACTIONS_COMMON_CONFIG = {
  getPositionToStartUse: function (
    combatantContext: CombatantContext,
    actionExecutionIntent: CombatActionExecutionIntent,
    self: CombatActionComponent
  ) {
    const user = combatantContext.combatant.combatantProperties;
    const direction = CombatantProperties.getForward(user);
    return user.homeLocation.add(direction.scale(0.5));
  },
  getDestinationDuringUse: (
    combatantContext: CombatantContext,
    actionExecutionIntent: CombatActionExecutionIntent,
    self: CombatActionComponent
  ) => {
    return combatantContext.combatant.combatantProperties.position.clone();
  },
};
