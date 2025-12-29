import { ActionResolutionStepType } from "../../../../../action-processing/action-steps/index.js";
import { AnimationTimingType } from "../../../../../action-processing/game-update-commands.js";
import { AnimationType, SkeletalAnimationName } from "../../../../../app-consts.js";
import { Combatant } from "../../../../../combatants/index.js";
import { ActionResolutionStepsConfig } from "../../../combat-action-steps-config.js";
import {
  getHomeDestination,
  getRotateTowardPrimaryTargetDestination,
  getStepForwardDestination,
} from "../../common-destination-getters.js";

export const RANGED_SKILL_STEPS_CONFIG = new ActionResolutionStepsConfig(
  {
    [ActionResolutionStepType.PreInitialPositioningDetermineShouldExecuteOrReleaseTurnLock]: {},
    [ActionResolutionStepType.PreInitialPositioningCheckEnvironmentalHazardTriggers]: {},
    [ActionResolutionStepType.InitialPositioning]: {
      getDestination: getStepForwardDestination,
      getAnimation: (actionUser) => {
        const isRestrained = actionUser.movementIsRestrained();
        if (isRestrained) {
          return null;
        }
        return {
          name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveForwardLoop },
          timing: { type: AnimationTimingType.Looping },
          smoothTransition: true,
        };
      },
    },
    [ActionResolutionStepType.PostInitialPositioningDetermineShouldExecuteOrReleaseTurnLock]: {},
    [ActionResolutionStepType.ChamberingMotion]: {
      getDestination: getRotateTowardPrimaryTargetDestination,
    },
    [ActionResolutionStepType.PayResourceCosts]: {},
    [ActionResolutionStepType.PostActionUseGameLogMessage]: {},
    [ActionResolutionStepType.EvalOnUseTriggers]: {},
    [ActionResolutionStepType.StartConcurrentSubActions]: {},
  },
  {
    [ActionResolutionStepType.PreFinalPositioningCheckEnvironmentalHazardTriggers]: {},
    [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
    [ActionResolutionStepType.RecoveryMotion]: {},
    [ActionResolutionStepType.FinalPositioning]: {
      getDestination: getHomeDestination,
      getAnimation: (user) => {
        if (user instanceof Combatant) {
          const userAlreadyInHomePosition = user
            .getHomePosition()
            .equals(user.getCombatantProperties().transformProperties.position);

          if (user.combatantProperties.isDead() || userAlreadyInHomePosition) {
            return null;
          }
        }

        return {
          name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveBack },
          timing: { type: AnimationTimingType.Looping },
          smoothTransition: true,
        };
      },
    },
  },
  {
    getFinalSteps: (self) => {
      return self.finalSteps;
    },
  }
);
