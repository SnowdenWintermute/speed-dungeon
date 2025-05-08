import { EntityReferencePoint } from "../../../action-entities/index.js";
import {
  ActionEntityPointTowardEntity,
  ActionResolutionStepType,
  AnimationTimingType,
} from "../../../action-processing/index.js";
import { AnimationType, SkeletalAnimationName } from "../../../app-consts.js";
import { SpawnableEntityType } from "../../../spawnables/index.js";
import { TargetingCalculator } from "../../targeting/targeting-calculator.js";
import { ActionResolutionStepsConfig } from "../combat-action-steps-config.js";
import { ActionExecutionPhase } from "./action-execution-phase.js";
import {
  getHomeDestination,
  getRotateTowardPrimaryTargetDestination,
  getStepForwardDestination,
} from "./common-destination-getters.js";
import { getSpeciesTimedAnimation } from "./get-species-timed-animation.js";
import {
  PROJECTILE_SHOOTING_ACTION_ANIMATION_NAMES,
  ProjectileShootingActionType,
} from "./projectile-shooting-action-animation-names.js";

export function getProjectileShootingActionBaseStepsConfig(
  projectileActionType: ProjectileShootingActionType
) {
  const animationNames = PROJECTILE_SHOOTING_ACTION_ANIMATION_NAMES[projectileActionType];

  return new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.DetermineMeleeActionAnimations]: {},

      [ActionResolutionStepType.InitialPositioning]: {
        getDestination: getStepForwardDestination,
        getAnimation: () => {
          return {
            name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveForwardLoop },
            timing: { type: AnimationTimingType.Looping },
          };
        },
      },
      [ActionResolutionStepType.ChamberingMotion]: {
        getDestination: getRotateTowardPrimaryTargetDestination,
        getAnimation: (user, animationLengths) =>
          getSpeciesTimedAnimation(
            user,
            animationLengths,
            animationNames[ActionExecutionPhase.Chambering]
          ),
      },
      [ActionResolutionStepType.DeliveryMotion]: {
        getAnimation: (user, animationLengths) =>
          getSpeciesTimedAnimation(
            user,
            animationLengths,
            animationNames[ActionExecutionPhase.Delivery]
          ),
      },
      [ActionResolutionStepType.PayResourceCosts]: {},
      [ActionResolutionStepType.EvalOnUseTriggers]: {},
      [ActionResolutionStepType.StartConcurrentSubActions]: {},

      [ActionResolutionStepType.RecoveryMotion]: {
        getAnimation: (user, animationLengths) =>
          getSpeciesTimedAnimation(
            user,
            animationLengths,
            animationNames[ActionExecutionPhase.Recovery]
          ),

        startPointingActionEntityTowardCombatant: (context) => {
          const { party } = context.combatantContext;
          const targetingCalculator = new TargetingCalculator(context.combatantContext, null);
          const primaryTarget = targetingCalculator.getPrimaryTargetCombatant(
            party,
            context.tracker.actionExecutionIntent
          );
          if (primaryTarget instanceof Error) throw primaryTarget;

          const actionEntity = context.tracker.spawnedEntityOption;
          if (!actionEntity) throw new Error("expected action entity was missing");
          const actionEntityId = (() => {
            switch (actionEntity.type) {
              case SpawnableEntityType.Combatant:
                return actionEntity.combatant.entityProperties.id;
              case SpawnableEntityType.ActionEntity:
                return actionEntity.actionEntity.entityProperties.id;
            }
          })();

          const toReturn: ActionEntityPointTowardEntity = {
            actionEntityId,
            targetId: primaryTarget.entityProperties.id,
            positionOnTarget: EntityReferencePoint.CombatantHitboxCenter,
            duration: 400,
          };
          return toReturn;
        },
      },

      [ActionResolutionStepType.FinalPositioning]: {
        getDestination: getHomeDestination,
        getAnimation: () => {
          return {
            name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveBack },
            timing: { type: AnimationTimingType.Looping },
          };
        },
      },
    },
    { userShouldMoveHomeOnComplete: true }
  );
}
