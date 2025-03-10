import { CombatantContext } from "../../../combatant-context/index.js";
import {
  CombatActionAnimationPhase,
  CombatActionCombatantAnimations,
} from "../combat-action-animations.js";
import { CombatActionRequiredRange } from "../combat-action-range.js";
import { AnimationTimingType } from "../../../action-processing/game-update-commands.js";
import { COMMON_DESTINATION_GETTERS } from "./common-destination-getters.js";
import {
  ActionMotionPhase,
  ActionResolutionStepContext,
} from "../../../action-processing/index.js";
import { CombatantProperties } from "../../../combatants/index.js";
import {
  getStandardActionArmorPenetration,
  getStandardActionCritChance,
  getStandardActionCritMultiplier,
} from "../action-calculation-utils/standard-action-calculations.js";
import { CombatAttribute } from "../../../combatants/attributes/index.js";
import { CombatActionComponent } from "../index.js";
import { ActionAccuracy, ActionAccuracyType } from "../combat-action-accuracy.js";
import { AnimationType, SkeletalAnimationName } from "../../../app-consts.js";

export const RANGED_ACTIONS_COMMON_CONFIG = {
  getRequiredRange: () => CombatActionRequiredRange.Ranged,
  getIsParryable: (user: CombatantProperties) => true,
  getCanTriggerCounterattack: (user: CombatantProperties) => false,
  getIsBlockable: (user: CombatantProperties) => true,
  getUnmodifiedAccuracy: function (user: CombatantProperties): ActionAccuracy {
    const userCombatAttributes = CombatantProperties.getTotalAttributes(user);
    return {
      type: ActionAccuracyType.Percentage,
      value: userCombatAttributes[CombatAttribute.Accuracy],
    };
  },
  getCritChance: function (user: CombatantProperties): number {
    return getStandardActionCritChance(user, CombatAttribute.Dexterity);
  },
  getCritMultiplier: function (user: CombatantProperties): number {
    return getStandardActionCritMultiplier(user, CombatAttribute.Focus);
  },
  getArmorPenetration: function (user: CombatantProperties, self: CombatActionComponent): number {
    return getStandardActionArmorPenetration(user, CombatAttribute.Dexterity);
  },
  getActionStepAnimations: (combatantContext: CombatantContext) => {
    const animations: CombatActionCombatantAnimations = {
      [CombatActionAnimationPhase.Initial]: {
        name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveForward },
        timing: { type: AnimationTimingType.Looping },
      },
      [CombatActionAnimationPhase.Chambering]: {
        name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.DrawArrow },
        timing: { type: AnimationTimingType.Timed, duration: 700 },
        // timing: { type: AnimationTimingType.Timed, duration: 3000 },
      },
      [CombatActionAnimationPhase.Delivery]: {
        name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.KnockPullReleaseArrow },
        timing: { type: AnimationTimingType.Timed, duration: 1200 },
        // timing: { type: AnimationTimingType.Timed, duration: 3200 },
      },
      [CombatActionAnimationPhase.RecoverySuccess]: {
        name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.FiredArrowRecovery },
        timing: { type: AnimationTimingType.Timed, duration: 700 },
        // timing: { type: AnimationTimingType.Timed, duration: 3000 },
      },
      [CombatActionAnimationPhase.RecoveryInterrupted]: {
        name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.FiredArrowRecovery },
        timing: { type: AnimationTimingType.Timed, duration: 700 },
      },
      [CombatActionAnimationPhase.Final]: {
        name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveBack },
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
