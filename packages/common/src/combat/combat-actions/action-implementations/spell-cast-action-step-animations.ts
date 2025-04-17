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

// @TODO @REFACTOR - high potential for streamlining how this is done in all actions
export function getSpellCastActionStepAnimations(context: ActionResolutionStepContext) {
  const { animationLengths } = context.manager.sequentialActionManagerRegistry;
  const speciesLengths =
    animationLengths[context.combatantContext.combatant.combatantProperties.combatantSpecies];

  const animations: CombatActionCombatantAnimations = {
    [CombatActionAnimationPhase.Initial]: {
      name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveForwardLoop },
      timing: { type: AnimationTimingType.Looping },
    },
    [CombatActionAnimationPhase.Chambering]: {
      name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.CastSpellChambering },
      timing: {
        type: AnimationTimingType.Timed,
        duration:
          speciesLengths[
            SKELETAL_ANIMATION_NAME_STRINGS[SkeletalAnimationName.CastSpellChambering]
          ] || 0,
      },
    },
    [CombatActionAnimationPhase.Delivery]: {
      name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.CastSpellDelivery },
      timing: {
        type: AnimationTimingType.Timed,
        duration:
          speciesLengths[
            SKELETAL_ANIMATION_NAME_STRINGS[SkeletalAnimationName.CastSpellDelivery]
          ] || 0,
      },
    },
    [CombatActionAnimationPhase.RecoverySuccess]: {
      name: {
        type: AnimationType.Skeletal,
        name: SkeletalAnimationName.CastSpellRecovery,
      },
      timing: {
        type: AnimationTimingType.Timed,
        duration:
          speciesLengths[
            SKELETAL_ANIMATION_NAME_STRINGS[SkeletalAnimationName.CastSpellRecovery]
          ] || 0,
      },
    },
    [CombatActionAnimationPhase.RecoveryInterrupted]: {
      name: {
        type: AnimationType.Skeletal,
        name: SkeletalAnimationName.CastSpellRecovery,
      },
      timing: {
        type: AnimationTimingType.Timed,
        duration:
          speciesLengths[
            SKELETAL_ANIMATION_NAME_STRINGS[SkeletalAnimationName.CastSpellRecovery]
          ] || 0,
      },
    },
    [CombatActionAnimationPhase.Final]: {
      name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveBack },
      timing: { type: AnimationTimingType.Looping },
    },
  };

  return animations;
}
