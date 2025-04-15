import {
  ActionResolutionStepContext,
  AnimationTimingType,
} from "../../../../action-processing/index.js";
import { AnimationType, SkeletalAnimationName } from "../../../../app-consts.js";
import {
  CombatActionAnimationPhase,
  CombatActionCombatantAnimations,
  getFallbackAnimationWithLength,
} from "../../combat-action-animations.js";

export const CONSUMABLE_COMMON_CONFIG = {
  getActionStepAnimations: (context: ActionResolutionStepContext) => {
    const chamberingAnimation = SkeletalAnimationName.UseConsumableChambering;
    const deliveryAnimation = SkeletalAnimationName.UseConsumableDelivery;
    const recoveryAnimation = SkeletalAnimationName.UseConsumableRecovery;

    const { animationLengths } = context.manager.sequentialActionManagerRegistry;
    const speciesLengths =
      animationLengths[context.combatantContext.combatant.combatantProperties.combatantSpecies];

    const animations: CombatActionCombatantAnimations = {
      [CombatActionAnimationPhase.Initial]: {
        name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveForwardLoop },
        timing: { type: AnimationTimingType.Looping },
      },
      [CombatActionAnimationPhase.Chambering]: getFallbackAnimationWithLength(
        chamberingAnimation,
        speciesLengths
      ),
      [CombatActionAnimationPhase.Delivery]: getFallbackAnimationWithLength(
        deliveryAnimation,
        speciesLengths
      ),
      [CombatActionAnimationPhase.RecoverySuccess]: getFallbackAnimationWithLength(
        recoveryAnimation,
        speciesLengths
      ),
      [CombatActionAnimationPhase.RecoveryInterrupted]: getFallbackAnimationWithLength(
        recoveryAnimation,
        speciesLengths
      ),
      [CombatActionAnimationPhase.Final]: {
        name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveBack },
        timing: { type: AnimationTimingType.Looping },
      },
    };
    return animations;
  },
};
