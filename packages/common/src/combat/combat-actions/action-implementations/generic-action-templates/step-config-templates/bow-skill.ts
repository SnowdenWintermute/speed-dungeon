// import {
//   ActionResolutionStepType,
//   AnimationTimingType,
// } from "../../../../../action-processing/index.js";
// import { AnimationType, SkeletalAnimationName } from "../../../../../app-consts.js";
// import { ActionResolutionStepsConfig } from "../../../combat-action-steps-config.js";
// import {
//   getRotateTowardPrimaryTargetDestination,
//   getStepForwardDestination,
// } from "../../common-destination-getters.js";
// import { getSpeciesTimedAnimation } from "../../get-species-timed-animation.js";
// import { PROJECTILE_SHOOTING_ACTION_ANIMATION_NAMES } from "../../projectile-shooting-action-animation-names.js";

// const animationNames = PROJECTILE_SHOOTING_ACTION_ANIMATION_NAMES[projectileActionType];

// export const BOW_SKILL_STEPS_CONFIG = new ActionResolutionStepsConfig(
//   {
//     [ActionResolutionStepType.DetermineShouldExecuteOrReleaseTurnLock]: {},
//     [ActionResolutionStepType.InitialPositioning]: {
//       getDestination: getStepForwardDestination,
//       getAnimation: () => {
//         return {
//           name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveForwardLoop },
//           timing: { type: AnimationTimingType.Looping },
//           smoothTransition: true,
//         };
//       },
//     },
//     [ActionResolutionStepType.ChamberingMotion]: {
//       getDestination: getRotateTowardPrimaryTargetDestination,
//       getAnimation: (user, animationLengths) =>
//         getSpeciesTimedAnimation(
//           user,
//           animationLengths,
//           animationNames[SkeletalAnimationName.BowChambering],
//           false
//         ),
//     },
//     [ActionResolutionStepType.DeliveryMotion]: {
//       getAnimation: (user, animationLengths) =>
//         getSpeciesTimedAnimation(
//           user,
//           animationLengths,
//           animationNames[SkeletalAnimationName.BowDelivery],
//           false
//         ),
//     },
//     [ActionResolutionStepType.PayResourceCosts]: {},
//     [ActionResolutionStepType.PostActionUseCombatLogMessage]: {},
//     [ActionResolutionStepType.EvalOnUseTriggers]: {},
//     [ActionResolutionStepType.StartConcurrentSubActions]: {},
//     [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
//     [ActionResolutionStepType.RecoveryMotion]: {
//       getAnimation: (user, animationLengths) =>
//         getSpeciesTimedAnimation(
//           user,
//           animationLengths,
//           animationNames[SkeletalAnimationName.BowRecovery],
//           false
//         ),

//       getAuxiliaryEntityMotions: (context) => {
//         const { party } = context.combatantContext;
//         const targetingCalculator = new TargetingCalculator(context.combatantContext, null);
//         const primaryTarget = targetingCalculator.getPrimaryTargetCombatant(
//           party,
//           context.tracker.actionExecutionIntent
//         );
//         if (primaryTarget instanceof Error) throw primaryTarget;

//         const actionEntity = context.tracker.spawnedEntityOption;
//         if (!actionEntity) return [];
//         // if (!actionEntity) throw new Error("expected action entity was missing");
//         const actionEntityId = getSpawnableEntityId(actionEntity);

//         const startPointingToward: SceneEntityChildTransformNodeIdentifierWithDuration = {
//           identifier: {
//             sceneEntityIdentifier: {
//               type: SceneEntityType.CharacterModel,
//               entityId: primaryTarget.entityProperties.id,
//             },
//             transformNodeName: CombatantBaseChildTransformNodeName.HitboxCenter,
//           },
//           duration: 400,
//         };

//         const toReturn: EntityMotionUpdate[] = [];
//         toReturn.push({
//           entityId: actionEntityId,
//           entityType: SpawnableEntityType.ActionEntity,
//           // startPointingToward,
//           setParent: null,
//         });

//         return toReturn;
//       },
//     },

//     [ActionResolutionStepType.FinalPositioning]: {
//       getDestination: getHomeDestination,
//       getAnimation: () => {
//         return {
//           name: { type: AnimationType.Skeletal, name: SkeletalAnimationName.MoveBack },
//           timing: { type: AnimationTimingType.Looping },
//           smoothTransition: true,
//         };
//       },
//     },
//   },
//   { userShouldMoveHomeOnComplete: true }
// );
