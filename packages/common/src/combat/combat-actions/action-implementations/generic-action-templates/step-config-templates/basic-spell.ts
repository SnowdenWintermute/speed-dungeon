import cloneDeep from "lodash.clonedeep";
import { ActionResolutionStepType } from "../../../../../action-processing/index.js";
import { SkeletalAnimationName } from "../../../../../app-consts.js";
import { ActionResolutionStepsConfig } from "../../../combat-action-steps-config.js";
import { getSpeciesTimedAnimation } from "../../get-species-timed-animation.js";
import { RANGED_SKILL_STEPS_CONFIG } from "./ranged-skill.js";

const config = cloneDeep(RANGED_SKILL_STEPS_CONFIG);
config.steps[ActionResolutionStepType.ChamberingMotion] = {
  ...config.steps[ActionResolutionStepType.ChamberingMotion],
  getAnimation: (user, animationLengths) =>
    getSpeciesTimedAnimation(
      user,
      animationLengths,
      SkeletalAnimationName.CastSpellChambering,
      false
    ),
};
config.steps[ActionResolutionStepType.RollIncomingHitOutcomes] = {};
config.steps[ActionResolutionStepType.EvalOnHitOutcomeTriggers] = {};
config.steps[ActionResolutionStepType.DeliveryMotion] = {
  ...config.steps[ActionResolutionStepType.DeliveryMotion],
  getAnimation: (user, animationLengths) =>
    getSpeciesTimedAnimation(
      user,
      animationLengths,
      SkeletalAnimationName.CastSpellDelivery,
      false
    ),
};
config.steps[ActionResolutionStepType.RecoveryMotion] = {
  ...config.steps[ActionResolutionStepType.RecoveryMotion],
  getAnimation: (user, animationLengths) =>
    getSpeciesTimedAnimation(
      user,
      animationLengths,
      SkeletalAnimationName.CastSpellRecovery,
      false
    ),
};

export const BASIC_SPELL_STEPS_CONFIG = new ActionResolutionStepsConfig(
  config.steps,
  config.options
);
