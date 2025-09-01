import cloneDeep from "lodash.clonedeep";
import { BASIC_SPELL_STEPS_CONFIG } from "./basic-spell.js";
import { ActionResolutionStepType } from "../../../../../action-processing/index.js";
import { getSpeciesTimedAnimation } from "../../get-species-timed-animation.js";
import { SkeletalAnimationName } from "../../../../../app-consts.js";
import { ActionStepConfigUtils } from "./utils.js";

const config = cloneDeep(BASIC_SPELL_STEPS_CONFIG);
ActionStepConfigUtils.removeMoveForwardSteps(config);

config.steps[ActionResolutionStepType.ChamberingMotion] = {
  ...config.steps[ActionResolutionStepType.ChamberingMotion],
  getAnimation: (user, animationLengths) =>
    getSpeciesTimedAnimation(
      user,
      animationLengths,
      SkeletalAnimationName.UseConsumableChambering,
      false
    ),
};
config.steps[ActionResolutionStepType.DeliveryMotion] = {
  ...config.steps[ActionResolutionStepType.DeliveryMotion],
  getAnimation: (user, animationLengths) =>
    getSpeciesTimedAnimation(
      user,
      animationLengths,
      SkeletalAnimationName.UseConsumableDelivery,
      false
    ),
};
config.steps[ActionResolutionStepType.RecoveryMotion] = {
  ...config.steps[ActionResolutionStepType.RecoveryMotion],
  getAnimation: (user, animationLengths) =>
    getSpeciesTimedAnimation(
      user,
      animationLengths,
      SkeletalAnimationName.UseConsumableRecovery,
      false
    ),
};

export const CONSUMABLE_USE_BASE_STEPS_CONFIG = config;
