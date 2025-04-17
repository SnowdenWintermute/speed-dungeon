import {
  ActionResolutionStepContext,
  AnimationTimingType,
} from "../../../action-processing/index.js";
import {
  AnimationType,
  SKELETAL_ANIMATION_NAME_STRINGS,
  SkeletalAnimationName,
} from "../../../app-consts.js";
import {
  CombatActionAnimationPhase,
  CombatActionCombatantAnimations,
} from "../combat-action-animations.js";

export function getBowShootActionStepAnimations(context: ActionResolutionStepContext) {
  const { animationLengths } = context.manager.sequentialActionManagerRegistry;
  const speciesLengths =
    animationLengths[context.combatantContext.combatant.combatantProperties.combatantSpecies];

  const animations: CombatActionCombatantAnimations = {
    [CombatActionAnimationPhase.Initial]: {
      name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveForwardLoop },
      timing: { type: AnimationTimingType.Looping },
    },
    [CombatActionAnimationPhase.Chambering]: {
      name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.BowChambering },
      timing: {
        type: AnimationTimingType.Timed,
        duration:
          speciesLengths[SKELETAL_ANIMATION_NAME_STRINGS[SkeletalAnimationName.BowChambering]] || 0,
      },
    },
    [CombatActionAnimationPhase.Delivery]: {
      name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.BowDelivery },
      timing: {
        type: AnimationTimingType.Timed,
        duration:
          speciesLengths[SKELETAL_ANIMATION_NAME_STRINGS[SkeletalAnimationName.BowDelivery]] || 0,
      },
    },
    [CombatActionAnimationPhase.RecoverySuccess]: {
      name: {
        type: AnimationType.Skeletal,
        name: SkeletalAnimationName.BowRecovery,
      },
      timing: {
        type: AnimationTimingType.Timed,
        duration:
          speciesLengths[SKELETAL_ANIMATION_NAME_STRINGS[SkeletalAnimationName.BowRecovery]] || 0,
      },
    },
    [CombatActionAnimationPhase.RecoveryInterrupted]: {
      name: {
        type: AnimationType.Skeletal,
        name: SkeletalAnimationName.BowRecovery,
      },
      timing: {
        type: AnimationTimingType.Timed,
        duration:
          speciesLengths[SKELETAL_ANIMATION_NAME_STRINGS[SkeletalAnimationName.BowRecovery]] || 0,
      },
    },
    [CombatActionAnimationPhase.Final]: {
      name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveBack },
      timing: { type: AnimationTimingType.Looping },
    },
  };

  return animations;
}
