import {
  ActionResolutionStepType,
  AnimationTimingType,
} from "../../../../action-processing/index.js";
import { AnimationType, SkeletalAnimationName } from "../../../../app-consts.js";
import { HoldableSlotType } from "../../../../items/equipment/slots.js";
import { getMeleeAttackDestination } from "../../combat-action-destination-getters.js";
import { ActionResolutionStepsConfig } from "../../combat-action-steps-config.js";
import { ActionExecutionPhase } from "../action-execution-phase.js";
import { getHomeDestination } from "../common-destination-getters.js";
import { getMeleeAttackAnimationFromType } from "../get-entity-animation.js";

export function getMeleeAttackBaseStepsConfig(holdableSlotType: HoldableSlotType) {
  return new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.DetermineActionAnimations]: {},
      [ActionResolutionStepType.InitialPositioning]: {
        getDestination: getMeleeAttackDestination,
        getAnimation: () => {
          return {
            name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveForwardLoop },
            timing: { type: AnimationTimingType.Looping },
          };
        },
      },
      [ActionResolutionStepType.ChamberingMotion]: {
        getAnimation: (user, animationLengths, meleeAttackAnimationType) => {
          if (meleeAttackAnimationType === undefined)
            throw new Error("Expected meleeAttackAnimationType was undefined");
          return getMeleeAttackAnimationFromType(
            user,
            animationLengths,
            meleeAttackAnimationType,
            ActionExecutionPhase.Chambering,
            holdableSlotType
          );
        },
      },
      [ActionResolutionStepType.DeliveryMotion]: {
        getAnimation: (user, animationLengths, meleeAttackAnimationType) => {
          if (meleeAttackAnimationType === undefined)
            throw new Error("Expected meleeAttackAnimationType was undefined");
          return getMeleeAttackAnimationFromType(
            user,
            animationLengths,
            meleeAttackAnimationType,
            ActionExecutionPhase.Delivery,
            holdableSlotType
          );
        },
      },
      [ActionResolutionStepType.PayResourceCosts]: {},
      [ActionResolutionStepType.EvalOnUseTriggers]: {},
      [ActionResolutionStepType.RollIncomingHitOutcomes]: {},
      [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
      [ActionResolutionStepType.RecoveryMotion]: {
        getAnimation: (user, animationLengths, meleeAttackAnimationType) => {
          if (meleeAttackAnimationType === undefined)
            throw new Error("Expected meleeAttackAnimationType was undefined");
          return getMeleeAttackAnimationFromType(
            user,
            animationLengths,
            meleeAttackAnimationType,
            ActionExecutionPhase.Recovery,
            holdableSlotType
          );
        },
      },
      [ActionResolutionStepType.FinalPositioning]: {
        isConditionalStep: true,
        getAnimation: () => {
          return {
            name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveBack },
            timing: { type: AnimationTimingType.Looping },
          };
        },
        getDestination: getHomeDestination,
      },
    },
    true
  );
}
