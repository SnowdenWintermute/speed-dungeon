import {
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { AutoTargetingScheme } from "../../../targeting/auto-targeting/index.js";
import { CHAINING_SPLIT_ARROW_PARENT } from "./index.js";
import { ERROR_MESSAGES } from "../../../../errors/index.js";
import {
  CombatActionTarget,
  CombatActionTargetType,
} from "../../../targeting/combat-action-targets.js";
import { CombatantContext } from "../../../../combatant-context/index.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { ActionTracker } from "../../../../action-processing/action-tracker.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import { DAMAGING_ACTIONS_COMMON_CONFIG } from "../damaging-actions-common-config.js";
import { COMBAT_ACTIONS } from "../index.js";
import { ActionEntityName, ActionEntityProperties } from "../../../../action-entities/index.js";
import {
  CombatActionTargetingPropertiesConfig,
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import cloneDeep from "lodash.clonedeep";
import { rangedAttackProjectileHitOutcomeProperties } from "../attack/attack-ranged-main-hand-projectile.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";
import { ActionResolutionStepsConfig } from "../../combat-action-steps-config.js";
import {
  CombatantBaseChildTransformNodeName,
  CombatantHoldableChildTransformNodeName,
  SceneEntityChildTransformNodeIdentifier,
  SceneEntityChildTransformNodeIdentifierWithDuration,
  SceneEntityType,
} from "../../../../scene-entities/index.js";
import { HoldableSlotType } from "../../../../items/equipment/slots.js";
import { BasicRandomNumberGenerator } from "../../../../utility-classes/randomizers.js";
import { ArrayUtils } from "../../../../utils/array-utils.js";

const targetingProperties: CombatActionTargetingPropertiesConfig = {
  ...cloneDeep(GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileSingle]),
  autoTargetSelectionMethod: { scheme: AutoTargetingScheme.RandomCombatant },

  getAutoTarget(combatantContext, previousTrackerOption, self) {
    // const previousTrackerInSequenceOption = trackerOption?.getPreviousTrackerInSequenceOption();
    if (!previousTrackerOption)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.MISSING_EXPECTED_ACTION_IN_CHAIN);

    const filteredPossibleTargetIds = getBouncableTargets(combatantContext, previousTrackerOption);
    if (filteredPossibleTargetIds instanceof Error) return filteredPossibleTargetIds;
    const { possibleTargetIds, previousTargetId } = filteredPossibleTargetIds;

    if (possibleTargetIds.length === 0)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGET_PROVIDED);

    const randomTargetIdResult = ArrayUtils.chooseRandom(
      possibleTargetIds,
      new BasicRandomNumberGenerator()
    );
    if (randomTargetIdResult instanceof Error) return randomTargetIdResult;

    const target: CombatActionTarget = {
      type: CombatActionTargetType.Single,
      targetId: randomTargetIdResult,
    };
    return target;
  },
};

const MAX_BOUNCES = 2;

const config: CombatActionComponentConfig = {
  ...DAMAGING_ACTIONS_COMMON_CONFIG,
  description: "An arrow that bounces to up to two additional targets after the first",
  origin: CombatActionOrigin.Attack,
  targetingProperties,

  getOnUseMessage: null,
  hitOutcomeProperties: rangedAttackProjectileHitOutcomeProperties,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
    costBases: {},
    requiresCombatTurnInThisContext: () => false,
  },

  stepsConfig: new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.DetermineShouldExecuteOrReleaseTurnLock]: {},
      [ActionResolutionStepType.OnActivationSpawnEntity]: {},
      [ActionResolutionStepType.OnActivationActionEntityMotion]: {
        getCosmeticDestinationY: (context) => {
          const { tracker } = context;
          const targetingCalculator = new TargetingCalculator(context.combatantContext, null);

          const primaryTargetId = targetingCalculator.getPrimaryTargetCombatantId(
            tracker.actionExecutionIntent
          );

          const toReturn: SceneEntityChildTransformNodeIdentifier = {
            sceneEntityIdentifier: {
              type: SceneEntityType.CharacterModel,
              entityId: primaryTargetId,
            },
            transformNodeName: CombatantBaseChildTransformNodeName.HitboxCenter,
          };

          return toReturn;
        },
        getDestination: (context) => {
          const { combatantContext, tracker } = context;
          const { actionExecutionIntent } = tracker;
          const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
          const targetingCalculator = new TargetingCalculator(combatantContext, null);

          action.targetingProperties.getAutoTarget(
            combatantContext,
            context.tracker.getPreviousTrackerInSequenceOption()
          );

          const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
            combatantContext.party,
            actionExecutionIntent
          );
          if (primaryTargetResult instanceof Error) return primaryTargetResult;
          const target = primaryTargetResult;

          return { position: target.combatantProperties.homeLocation.clone() };
        },
        getNewParent: () => null,
        shouldDespawnOnComplete: () => true,
      },
      [ActionResolutionStepType.RollIncomingHitOutcomes]: {},
      [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
      [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
    },
    { userShouldMoveHomeOnComplete: false }
  ),

  getChildren: (context) => {
    let cursor = context.tracker.getPreviousTrackerInSequenceOption();
    let numBouncesSoFar = 0;
    while (cursor) {
      if (cursor.actionExecutionIntent.actionName === CombatActionName.ChainingSplitArrowProjectile)
        numBouncesSoFar += 1;
      cursor = cursor.getPreviousTrackerInSequenceOption();
    }

    const previousTrackerInSequenceOption = context.tracker.getPreviousTrackerInSequenceOption();
    if (!previousTrackerInSequenceOption) return [];

    const filteredPossibleTargetIdsResult = getBouncableTargets(
      context.combatantContext,
      context.tracker
    );
    if (filteredPossibleTargetIdsResult instanceof Error) return [];

    if (numBouncesSoFar < MAX_BOUNCES && filteredPossibleTargetIdsResult.possibleTargetIds.length)
      return [COMBAT_ACTIONS[CombatActionName.ChainingSplitArrowProjectile]];

    return [];
  },
  getParent: () => CHAINING_SPLIT_ARROW_PARENT,
  getConcurrentSubActions() {
    return [];
  },
  getSpawnableEntity: (context) => {
    const { combatantContext, tracker } = context;
    const previousTrackerOption = tracker.getPreviousTrackerInSequenceOption();
    let position = combatantContext.combatant.combatantProperties.position.clone();

    let parentOption: undefined | SceneEntityChildTransformNodeIdentifier;

    const targetingCalculator = new TargetingCalculator(combatantContext, null);
    const primaryTargetId = targetingCalculator.getPrimaryTargetCombatantId(
      tracker.actionExecutionIntent
    );

    const targetModelHitboxIdentifier: SceneEntityChildTransformNodeIdentifier = {
      sceneEntityIdentifier: {
        type: SceneEntityType.CharacterModel,
        entityId: primaryTargetId,
      },
      transformNodeName: CombatantBaseChildTransformNodeName.HitboxCenter,
    };

    const initialPointToward: SceneEntityChildTransformNodeIdentifier = targetModelHitboxIdentifier;

    const initialLockRotationToFace: SceneEntityChildTransformNodeIdentifierWithDuration = {
      identifier: targetModelHitboxIdentifier,
      duration: 1,
    };

    let initialCosmeticYPosition: undefined | SceneEntityChildTransformNodeIdentifier;

    if (
      previousTrackerOption &&
      previousTrackerOption.actionExecutionIntent.actionName ===
        CombatActionName.ChainingSplitArrowProjectile &&
      previousTrackerOption.spawnedEntityOption &&
      previousTrackerOption.spawnedEntityOption.type === SpawnableEntityType.ActionEntity
    ) {
      // was spawned by previous arrow action in chain
      //
      const targetingCalculator = new TargetingCalculator(
        previousTrackerOption.parentActionManager.combatantContext,
        null
      );
      const previousActionTargetId = targetingCalculator.getPrimaryTargetCombatantId(
        previousTrackerOption.actionExecutionIntent
      );

      position =
        previousTrackerOption.spawnedEntityOption.actionEntity.actionEntityProperties.position.clone();

      initialCosmeticYPosition = {
        sceneEntityIdentifier: {
          type: SceneEntityType.CharacterModel,
          entityId: previousActionTargetId,
        },
        transformNodeName: CombatantBaseChildTransformNodeName.HitboxCenter,
      };
    } else {
      // was spawned by initial parent action
      parentOption = {
        sceneEntityIdentifier: {
          type: SceneEntityType.CharacterEquipmentModel,
          characterModelId: combatantContext.combatant.entityProperties.id,
          slot: HoldableSlotType.MainHand,
        },
        transformNodeName: CombatantHoldableChildTransformNodeName.NockBone,
      };
    }

    const actionEntityProperties: ActionEntityProperties = {
      position,
      name: ActionEntityName.Arrow,
      initialPointToward,
      initialLockRotationToFace,
    };

    if (parentOption) actionEntityProperties.parentOption = parentOption;

    if (initialCosmeticYPosition)
      actionEntityProperties.initialCosmeticYPosition = initialCosmeticYPosition;

    return {
      type: SpawnableEntityType.ActionEntity,
      actionEntity: {
        entityProperties: { id: context.idGenerator.generate(), name: "" },
        actionEntityProperties,
      },
    };
  },
};

export const CHAINING_SPLIT_ARROW_PROJECTILE = new CombatActionComposite(
  CombatActionName.ChainingSplitArrowProjectile,
  config
);

function getBouncableTargets(
  combatantContext: CombatantContext,
  previousTrackerInSequenceOption: ActionTracker
) {
  const previousTargetInChain = previousTrackerInSequenceOption.actionExecutionIntent.targets;
  const previousTargetIdResult = (() => {
    if (previousTargetInChain.type !== CombatActionTargetType.Single)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INVALID_ACTION_IN_CHAIN);
    else return previousTargetInChain.targetId;
  })();
  if (previousTargetIdResult instanceof Error) return previousTargetIdResult;

  const opponents = combatantContext.getOpponents();
  return {
    possibleTargetIds: opponents
      .filter((combatant) => combatant.combatantProperties.hitPoints > 0)
      .map((combatant) => combatant.entityProperties.id)
      .filter((id) => id !== previousTargetIdResult),
    previousTargetId: previousTargetIdResult,
  };
}
