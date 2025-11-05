import {
  CombatActionGameLogProperties,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionOrigin,
  FriendOrFoe,
} from "../../index.js";
import { AutoTargetingScheme } from "../../../targeting/auto-targeting/index.js";
import { CHAINING_SPLIT_ARROW_PARENT } from "./index.js";
import { ERROR_MESSAGES } from "../../../../errors/index.js";
import {
  CombatActionTarget,
  CombatActionTargetType,
} from "../../../targeting/combat-action-targets.js";
import { ActionTracker } from "../../../../action-processing/action-tracker.js";
import { CombatActionTargetingPropertiesConfig } from "../../combat-action-targeting-properties.js";
import { BasicRandomNumberGenerator } from "../../../../utility-classes/randomizers.js";
import { ArrayUtils } from "../../../../utils/array-utils.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import { CHAINING_SPLIT_ARROW_PROJECTILE_STEPS_CONFIG } from "./chaining-split-arrow-projectile-steps-config.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import { COST_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/cost-properties-templates/index.js";
import {
  createTargetingPropertiesConfig,
  TARGETING_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/targeting-properties-config-templates/index.js";
import { ActionUserContext } from "../../../../action-user-context/index.js";
import {
  ACTION_EXECUTION_PRECONDITIONS,
  ActionExecutionPreconditions,
} from "../generic-action-templates/targeting-properties-config-templates/action-execution-preconditions.js";
import { ActionResolutionStepContext } from "../../../../action-processing/index.js";
import { Combatant } from "../../../../combatants/index.js";

const targetingPropertiesOverrides: Partial<CombatActionTargetingPropertiesConfig> = {
  autoTargetSelectionMethod: { scheme: AutoTargetingScheme.RandomCombatant },
  getAutoTarget(combatantContext, previousTrackerOption, self) {
    // const previousTrackerInSequenceOption = trackerOption?.getPreviousTrackerInSequenceOption();
    if (!previousTrackerOption)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.MISSING_EXPECTED_ACTION_IN_CHAIN);

    const filteredPossibleTargetIds = getBouncableTargets(combatantContext, previousTrackerOption);
    if (filteredPossibleTargetIds instanceof Error) return filteredPossibleTargetIds;
    const { possibleTargetIds } = filteredPossibleTargetIds;

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

// a projectile can't be alive so don't check if it is
targetingPropertiesOverrides.executionPreconditions = [
  ACTION_EXECUTION_PRECONDITIONS[ActionExecutionPreconditions.TargetsAreAlive],
];

const targetingProperties = createTargetingPropertiesConfig(
  TARGETING_PROPERTIES_TEMPLATE_GETTERS.SINGLE_HOSTILE,
  targetingPropertiesOverrides
);

const MAX_BOUNCES = 2;

const hitOutcomeProperties = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.PROJECTILE,
  {}
);

const config: CombatActionComponentConfig = {
  description: "An arrow that bounces to up to two additional targets after the first",
  targetingProperties,
  gameLogMessageProperties: new CombatActionGameLogProperties({
    origin: CombatActionOrigin.Attack,
  }),
  hitOutcomeProperties,
  costProperties: COST_PROPERTIES_TEMPLATE_GETTERS.FREE_ACTION(),
  stepsConfig: CHAINING_SPLIT_ARROW_PROJECTILE_STEPS_CONFIG,
  hierarchyProperties: {
    ...BASE_ACTION_HIERARCHY_PROPERTIES,

    getChildren: (context) => {
      const { actionUserContext, tracker } = context;
      const { actionUser } = actionUserContext;

      // ex: if its parent was incinerated by firewall
      if (actionUser.wasRemovedBeforeHitOutcomes()) return [];

      const bounceCount = getPreviousBouncesCount(context);

      const filteredPossibleTargetIdsResult = getBouncableTargets(actionUserContext, tracker);
      if (filteredPossibleTargetIdsResult instanceof Error) return [];
      if (filteredPossibleTargetIdsResult.possibleTargetIds.length === 0) return [];

      const noValidTargetsRemain = !filteredPossibleTargetIdsResult.possibleTargetIds.length;
      const bounceLimitReached = bounceCount >= MAX_BOUNCES;

      const randomTargetIdResult = ArrayUtils.chooseRandom(
        filteredPossibleTargetIdsResult.possibleTargetIds,
        new BasicRandomNumberGenerator()
      );
      if (randomTargetIdResult instanceof Error) throw randomTargetIdResult;
      const targetId = randomTargetIdResult;

      if (bounceLimitReached || noValidTargetsRemain) return [];

      const { actionExecutionIntent } = tracker;
      const { rank } = actionExecutionIntent;

      return [
        new CombatActionExecutionIntent(CombatActionName.ChainingSplitArrowProjectile, rank, {
          type: CombatActionTargetType.Single,
          targetId,
        }),
      ];
    },
    getParent: () => CHAINING_SPLIT_ARROW_PARENT,
  },
};

export const CHAINING_SPLIT_ARROW_PROJECTILE = new CombatActionComposite(
  CombatActionName.ChainingSplitArrowProjectile,
  config
);

function getBouncableTargets(
  actionUserContext: ActionUserContext,
  previousTrackerInSequenceOption: ActionTracker
) {
  const previousTargetInChain = previousTrackerInSequenceOption.actionExecutionIntent.targets;
  const previousTargetIdResult = (() => {
    if (previousTargetInChain.type !== CombatActionTargetType.Single)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INVALID_ACTION_IN_CHAIN);
    else return previousTargetInChain.targetId;
  })();
  if (previousTargetIdResult instanceof Error) return previousTargetIdResult;

  const { actionUser, party } = actionUserContext;
  const entityIdsByDisposition = party.combatantManager.getCombatantIdsByDisposition(
    actionUser.getIdOfEntityToCreditWithThreat()
  );

  const opponentIds = entityIdsByDisposition[FriendOrFoe.Hostile];
  if (opponentIds.length === 0) {
    return {
      possibleTargetIds: [],
      previousTargetId: previousTargetIdResult,
    };
  }
  const opponents = party.combatantManager.getExpectedCombatants(opponentIds);

  const isValidTarget = (combatant: Combatant) =>
    !combatant.combatantProperties.isDead() &&
    combatant.entityProperties.id !== previousTargetIdResult;

  const possibleTargetIds = opponents
    .filter(isValidTarget)
    .map((combatant) => combatant.entityProperties.id);

  return {
    possibleTargetIds,
    previousTargetId: previousTargetIdResult,
  };
}

function getPreviousBouncesCount(context: ActionResolutionStepContext) {
  let cursor = context.tracker.getPreviousTrackerInSequenceOption();
  let bounceCount = 0;
  while (cursor) {
    const lookingAtProjectileActionTracker =
      cursor.actionExecutionIntent.actionName === CombatActionName.ChainingSplitArrowProjectile;
    if (lookingAtProjectileActionTracker) bounceCount += 1;
    cursor = cursor.getPreviousTrackerInSequenceOption();
  }

  return bounceCount;
}
