import cloneDeep from "lodash.clonedeep";
import { MELEE_ATTACK_STEPS_CONFIG } from "./melee-attack.js";
import { ActionResolutionStepType } from "../../../../../action-processing/index.js";
import { getMeleeAttackAnimationFromType } from "../../get-entity-animation.js";
import { ActionExecutionPhase } from "../../action-execution-phase.js";
import { HoldableSlotType } from "../../../../../items/equipment/slots.js";

const expectedMeleeAttackAnimationType = "Expected meleeAttackAnimationType was undefined";

const config = cloneDeep(MELEE_ATTACK_STEPS_CONFIG);

config.steps[ActionResolutionStepType.ChamberingMotion] = {
  ...config.steps[ActionResolutionStepType.ChamberingMotion],
  getAnimation: (user, animationLengths, meleeAttackAnimationType) => {
    if (meleeAttackAnimationType === undefined) throw new Error(expectedMeleeAttackAnimationType);
    return getMeleeAttackAnimationFromType(
      user,
      animationLengths,
      meleeAttackAnimationType,
      ActionExecutionPhase.Chambering,
      HoldableSlotType.MainHand,
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
      HoldableSlotType.MainHand,
      false
    );
  },
};
config.steps[ActionResolutionStepType.RecoveryMotion] = {
  ...config.steps[ActionResolutionStepType.RecoveryMotion],
  getAnimation: (user, animationLengths, meleeAttackAnimationType) => {
    if (meleeAttackAnimationType === undefined) throw new Error(expectedMeleeAttackAnimationType);
    return getMeleeAttackAnimationFromType(
      user,
      animationLengths,
      meleeAttackAnimationType,
      ActionExecutionPhase.Recovery,
      HoldableSlotType.MainHand,
      false
    );
  },
};

config.steps[ActionResolutionStepType.FinalPositioning] = {
  ...config.steps[ActionResolutionStepType.FinalPositioning],
  isConditionalStep: true,
};

export const MAIN_HAND_MELEE_ATTACK_STEPS_CONFIG = config;
