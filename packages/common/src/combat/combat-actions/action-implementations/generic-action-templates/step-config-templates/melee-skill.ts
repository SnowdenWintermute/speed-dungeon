import cloneDeep from "lodash.clonedeep";
import {
  ActionResolutionStepType,
  AnimationTimingType,
} from "../../../../../action-processing/index.js";
import { AnimationType, SkeletalAnimationName } from "../../../../../app-consts.js";
import { getMeleeAttackDestination } from "../../../combat-action-destination-getters.js";
import { RANGED_SKILL_STEPS_CONFIG } from "./ranged-skill.js";

const config = cloneDeep(RANGED_SKILL_STEPS_CONFIG);

config.steps[ActionResolutionStepType.InitialPositioning] = {
  getDestination: getMeleeAttackDestination,
  getAnimation: () => {
    return {
      name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveForwardLoop },
      timing: { type: AnimationTimingType.Looping },
      smoothTransition: true,
    };
  },
};

export const MELEE_SKILL_STEPS_CONFIG = config;
