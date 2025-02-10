import { CombatActionComponent } from "../index.js";
import { CombatantContext } from "../../../combatant-context/index.js";
import { CombatActionExecutionIntent } from "../combat-action-execution-intent.js";
import { CombatantProperties } from "../../../combatants/index.js";
import {
  CombatActionAnimationCategory,
  CombatActionCombatantAnimations,
} from "../combat-action-animations.js";
import { AnimationName } from "../../../app-consts.js";
import { CombatActionRequiredRange } from "../combat-action-range.js";

export const RANGED_ACTIONS_COMMON_CONFIG = {
  getRequiredRange: () => CombatActionRequiredRange.Ranged,
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
  getCombatantUseAnimations: (combatantContext: CombatantContext) => {
    const animations: CombatActionCombatantAnimations = {
      [CombatActionAnimationCategory.StartUse]: AnimationName.RangedAttack,
      [CombatActionAnimationCategory.SuccessRecovery]: AnimationName.RangedAttack,
      [CombatActionAnimationCategory.InterruptedRecovery]: AnimationName.RangedAttack,
    };
    return animations;
  },
};
