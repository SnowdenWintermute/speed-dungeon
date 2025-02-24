import { CombatantContext } from "../../../combatant-context/index.js";
import {
  CombatActionAnimationPhase,
  CombatActionCombatantAnimations,
} from "../combat-action-animations.js";
import { AnimationName } from "../../../app-consts.js";
import { CombatActionRequiredRange } from "../combat-action-range.js";
import { AnimationTimingType } from "../../../action-processing/game-update-commands.js";
import { COMMON_DESTINATION_GETTERS } from "./common-destination-getters.js";
import {
  ActionMotionPhase,
  ActionResolutionStepContext,
} from "../../../action-processing/index.js";
import { CombatantProperties } from "../../../combatants/index.js";
import { CombatActionExecutionIntent } from "../combat-action-execution-intent.js";

export const RANGED_ACTIONS_COMMON_CONFIG = {
  getRequiredRange: () => CombatActionRequiredRange.Ranged,
  getIsParryable: (user: CombatantProperties) => true,
  getCombatantUseAnimations: (combatantContext: CombatantContext) => {
    const animations: CombatActionCombatantAnimations = {
      [CombatActionAnimationPhase.Initial]: {
        name: AnimationName.MoveForward,
        timing: { type: AnimationTimingType.Looping },
      },
      [CombatActionAnimationPhase.Chambering]: {
        name: AnimationName.DrawArrow,
        timing: { type: AnimationTimingType.Timed, duration: 700 },
        // timing: { type: AnimationTimingType.Timed, duration: 3000 },
      },
      [CombatActionAnimationPhase.Delivery]: {
        name: AnimationName.KnockPullReleaseArrow,
        timing: { type: AnimationTimingType.Timed, duration: 1200 },
        // timing: { type: AnimationTimingType.Timed, duration: 3200 },
      },
      [CombatActionAnimationPhase.RecoverySuccess]: {
        name: AnimationName.FiredArrowRecovery,
        timing: { type: AnimationTimingType.Timed, duration: 700 },
        // timing: { type: AnimationTimingType.Timed, duration: 3000 },
      },
      [CombatActionAnimationPhase.RecoveryInterrupted]: {
        name: AnimationName.FiredArrowRecovery,
        timing: { type: AnimationTimingType.Timed, duration: 700 },
      },
      [CombatActionAnimationPhase.Final]: {
        name: AnimationName.MoveBack,
        timing: { type: AnimationTimingType.Looping },
      },
    };
    return animations;
  },
  motionPhasePositionGetters: {
    ...COMMON_DESTINATION_GETTERS,
    [ActionMotionPhase.Initial]: (context: ActionResolutionStepContext) => {
      const { combatantContext } = context;
      const user = combatantContext.combatant.combatantProperties;
      const direction = CombatantProperties.getForward(user);
      return user.homeLocation.add(direction.scale(0.5));
    },
  },
};
