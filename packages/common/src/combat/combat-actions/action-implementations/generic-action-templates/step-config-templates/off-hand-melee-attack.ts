import cloneDeep from "lodash.clonedeep";
import { MELEE_ATTACK_STEPS_CONFIG } from "./melee-attack.js";
import { ActionResolutionStepType } from "../../../../../action-processing/index.js";
import { getMeleeAttackAnimationFromType } from "../../get-entity-animation.js";
import { ActionExecutionPhase } from "../../action-execution-phase.js";
import { HoldableSlotType } from "../../../../../items/equipment/slots.js";

const expectedMeleeAttackAnimationType = "Expected meleeAttackAnimationType was undefined";

const config = cloneDeep(MELEE_ATTACK_STEPS_CONFIG);
// don't show a movement animation here since this usually follows the main hand attack
delete config.steps[ActionResolutionStepType.InitialPositioning]?.getAnimation;

config.steps[ActionResolutionStepType.ChamberingMotion] = {
  ...config.steps[ActionResolutionStepType.ChamberingMotion],
  getAnimation: (user, animationLengths, meleeAttackAnimationType) => {
    if (meleeAttackAnimationType === undefined) throw new Error(expectedMeleeAttackAnimationType);
    return getMeleeAttackAnimationFromType(
      user,
      animationLengths,
      meleeAttackAnimationType,
      ActionExecutionPhase.Chambering,
      HoldableSlotType.OffHand,
      false
    );
  },
};

config.steps[ActionResolutionStepType.DeliveryMotion] = {
  ...config.steps[ActionResolutionStepType.DeliveryMotion],
  getAnimation: (user, animationLengths, meleeAttackAnimationType) => {
    if (meleeAttackAnimationType === undefined) throw new Error(expectedMeleeAttackAnimationType);
    return getMeleeAttackAnimationFromType(
      user,
      animationLengths,
      meleeAttackAnimationType,
      ActionExecutionPhase.Delivery,
      HoldableSlotType.OffHand,
      false
    );
  },
};

config.finalSteps[ActionResolutionStepType.RecoveryMotion] = {
  ...config.finalSteps[ActionResolutionStepType.RecoveryMotion],
  getAnimation: (user, animationLengths, meleeAttackAnimationType) => {
    if (meleeAttackAnimationType === undefined) throw new Error(expectedMeleeAttackAnimationType);
    return getMeleeAttackAnimationFromType(
      user,
      animationLengths,
      meleeAttackAnimationType,
      ActionExecutionPhase.Recovery,
      HoldableSlotType.OffHand,
      false
    );
  },
};

export const OFF_HAND_MELEE_ATTACK_STEPS_CONFIG = config;
