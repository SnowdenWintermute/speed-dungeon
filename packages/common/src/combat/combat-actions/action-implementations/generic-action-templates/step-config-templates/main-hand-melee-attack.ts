import cloneDeep from "lodash.clonedeep";
import { MELEE_ATTACK_STEPS_CONFIG } from "./melee-attack.js";
import { ActionResolutionStepType } from "../../../../../action-processing/index.js";
import { getMeleeAttackAnimationFromType } from "../../get-entity-animation.js";
import { ActionExecutionPhase } from "../../action-execution-phase.js";
import { HoldableSlotType } from "../../../../../items/equipment/slots.js";
import { COMBAT_ACTIONS } from "../../index.js";
import { CombatActionName } from "../../../combat-action-names.js";

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

config.finalSteps[ActionResolutionStepType.RecoveryMotion] = {
  ...config.finalSteps[ActionResolutionStepType.RecoveryMotion],
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

config.finalSteps[ActionResolutionStepType.PreFinalPositioningCheckEnvironmentalHazardTriggers] = {
  ...config.finalSteps[
    ActionResolutionStepType.PreFinalPositioningCheckEnvironmentalHazardTriggers
  ],
};
config.finalSteps[ActionResolutionStepType.FinalPositioning] = {
  ...config.finalSteps[ActionResolutionStepType.FinalPositioning],
};

config.options.getFinalSteps = (self, context) => {
  const offhandAttack = COMBAT_ACTIONS[CombatActionName.AttackMeleeOffhand];
  const offhandShouldExecute = offhandAttack.shouldExecute(
    context.combatantContext,
    context.tracker
  );

  if (!offhandShouldExecute) {
    return config.finalSteps;
  }

  return {
    [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
    [ActionResolutionStepType.RecoveryMotion]:
      config.finalSteps[ActionResolutionStepType.RecoveryMotion],
  };
};

export const MAIN_HAND_MELEE_ATTACK_STEPS_CONFIG = config;
