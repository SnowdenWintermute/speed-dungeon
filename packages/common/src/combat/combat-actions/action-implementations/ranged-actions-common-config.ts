import { CombatantContext } from "../../../combatant-context/index.js";
import {
  CombatActionAnimationPhase,
  CombatActionCombatantAnimations,
} from "../combat-action-animations.js";
import { AnimationName } from "../../../app-consts.js";
import { CombatActionRequiredRange } from "../combat-action-range.js";
import { AnimationTimingType } from "../../../action-processing/game-update-commands.js";

export const RANGED_ACTIONS_COMMON_CONFIG = {
  getRequiredRange: () => CombatActionRequiredRange.Ranged,
  getCombatantUseAnimations: (combatantContext: CombatantContext) => {
    const animations: CombatActionCombatantAnimations = {
      [CombatActionAnimationPhase.Initial]: {
        name: AnimationName.MoveForward,
        timing: { type: AnimationTimingType.Looping },
      },
      [CombatActionAnimationPhase.Chambering]: {
        name: AnimationName.DrawArrow,
        timing: { type: AnimationTimingType.Timed, duration: 700 },
      },
      [CombatActionAnimationPhase.Delivery]: {
        name: AnimationName.KnockPullReleaseArrow,
        timing: { type: AnimationTimingType.Timed, duration: 1200 },
      },
      [CombatActionAnimationPhase.RecoverySuccess]: {
        name: AnimationName.FiredArrowRecovery,
        timing: { type: AnimationTimingType.Timed, duration: 700 },
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
};
