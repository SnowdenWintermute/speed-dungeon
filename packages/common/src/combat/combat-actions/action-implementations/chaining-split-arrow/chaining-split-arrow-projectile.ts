import {
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionUsabilityContext,
} from "../../index.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { AutoTargetingScheme } from "../../../targeting/auto-targeting/index.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { CHAINING_SPLIT_ARROW_PARENT } from "./index.js";
import { ERROR_MESSAGES } from "../../../../errors/index.js";
import {
  CombatActionTarget,
  CombatActionTargetType,
} from "../../../targeting/combat-action-targets.js";
import { CombatantContext } from "../../../../combatant-context/index.js";
import { chooseRandomFromArray } from "../../../../utils/index.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { ActionTracker } from "../../../../action-processing/action-tracker.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import { DAMAGING_ACTIONS_COMMON_CONFIG } from "../damaging-actions-common-config.js";
import { COMBAT_ACTIONS } from "../index.js";
import { ActionEntityName } from "../../../../action-entities/index.js";
import {
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

const targetingProperties = cloneDeep(
  GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileSingle]
);
targetingProperties.autoTargetSelectionMethod = { scheme: AutoTargetingScheme.RandomCombatant };

const MAX_BOUNCES = 2;

const config: CombatActionComponentConfig = {
  ...DAMAGING_ACTIONS_COMMON_CONFIG,
  description: "An arrow that bounces to up to two additional targets after the first",
  targetingProperties,
  hitOutcomeProperties: rangedAttackProjectileHitOutcomeProperties,
  costProperties: BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
  usabilityContext: CombatActionUsabilityContext.InCombat,
  intent: CombatActionIntent.Malicious,

  stepsConfig: new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.OnActivationSpawnEntity]: {},
      [ActionResolutionStepType.OnActivationActionEntityMotion]: {
        getDestination: (context) => {
          const { combatantContext, tracker } = context;
          const { actionExecutionIntent } = tracker;
          const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
          const targetingCalculator = new TargetingCalculator(combatantContext, null);
          action.getAutoTarget(
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
      },
      [ActionResolutionStepType.RollIncomingHitOutcomes]: {},
      [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
    },
    false
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
  getRequiredRange: (_user, _self) => CombatActionRequiredRange.Ranged,
  getConcurrentSubActions() {
    return [];
  },
  getAutoTarget(combatantContext, previousTrackerOption, self) {
    // const previousTrackerInSequenceOption = trackerOption?.getPreviousTrackerInSequenceOption();
    if (!previousTrackerOption)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.MISSING_EXPECTED_ACTION_IN_CHAIN);

    const filteredPossibleTargetIds = getBouncableTargets(combatantContext, previousTrackerOption);
    if (filteredPossibleTargetIds instanceof Error) return filteredPossibleTargetIds;
    const { possibleTargetIds, previousTargetId } = filteredPossibleTargetIds;

    if (possibleTargetIds.length === 0)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGET_PROVIDED);

    const randomTargetIdResult = chooseRandomFromArray(possibleTargetIds);
    if (randomTargetIdResult instanceof Error) return randomTargetIdResult;

    const target: CombatActionTarget = {
      type: CombatActionTargetType.Single,
      targetId: randomTargetIdResult,
    };
    return target;
  },
  getSpawnableEntity: (context) => {
    const { combatantContext, tracker } = context;
    const previousTrackerOption = tracker.getPreviousTrackerInSequenceOption();
    let position = combatantContext.combatant.combatantProperties.position.clone();
    if (
      previousTrackerOption &&
      previousTrackerOption.spawnedEntityOption &&
      previousTrackerOption.spawnedEntityOption.type === SpawnableEntityType.ActionEntity
    ) {
      position =
        previousTrackerOption.spawnedEntityOption.actionEntity.actionEntityProperties.position.clone();
    }
    return {
      type: SpawnableEntityType.ActionEntity,
      actionEntity: {
        entityProperties: { id: context.idGenerator.generate(), name: "" },
        actionEntityProperties: {
          position,
          name: ActionEntityName.Arrow,
        },
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
