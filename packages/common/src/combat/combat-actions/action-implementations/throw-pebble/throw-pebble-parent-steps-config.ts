import cloneDeep from "lodash.clonedeep";
import { ActionStepConfigUtils } from "../generic-action-templates/step-config-templates/utils.js";
import { ActionResolutionStepType } from "../../../../action-processing/action-steps/index.js";
import { getSpeciesTimedAnimation } from "../get-species-timed-animation.js";
import { SkeletalAnimationName } from "../../../../app-consts.js";
import { PROJECTILE_SPELL_STEPS_CONFIG } from "../generic-action-templates/step-config-templates/projectile-spell.js";
import { ProjectileFactory } from "../generic-action-templates/projectile-factory.js";

const config = cloneDeep(PROJECTILE_SPELL_STEPS_CONFIG);
ActionStepConfigUtils.removeMoveForwardSteps(config);

config.steps[ActionResolutionStepType.PostPrepSpawnEntity] = {
  getSpawnableEntities: (context) => {
    const projectileFactory = new ProjectileFactory(context, {});

    const spawnableEntity = projectileFactory.createPebbleInHand();

    return [spawnableEntity];
  },
};

config.steps[ActionResolutionStepType.ChamberingMotion] = {
  ...config.steps[ActionResolutionStepType.ChamberingMotion],
  getAnimation: (user, animationLengths) =>
    getSpeciesTimedAnimation(
      user,
      animationLengths,
      SkeletalAnimationName.ThrowObjectChambering,
      false
    ),
};

config.steps[ActionResolutionStepType.DeliveryMotion] = {
  ...config.steps[ActionResolutionStepType.DeliveryMotion],
  getAnimation: (user, animationLengths) =>
    getSpeciesTimedAnimation(
      user,
      animationLengths,
      SkeletalAnimationName.ThrowObjectDelivery,
      false
    ),
};

config.finalSteps[ActionResolutionStepType.RecoveryMotion] = {
  ...config.finalSteps[ActionResolutionStepType.RecoveryMotion],
  getAnimation: (user, animationLengths) =>
    getSpeciesTimedAnimation(
      user,
      animationLengths,
      SkeletalAnimationName.ThrowObjectRecovery,
      false
    ),
};

export const THROW_PEBBLE_PARENT_STEPS_CONFIG = config;
