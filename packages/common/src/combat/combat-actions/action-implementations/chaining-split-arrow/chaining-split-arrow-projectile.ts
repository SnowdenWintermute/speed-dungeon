import {
  CombatActionCombatLogProperties,
  CombatActionComponentConfig,
  CombatActionComposite,
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
import { COMBAT_ACTIONS } from "../index.js";
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
import { AdventuringParty } from "../../../../adventuring-party/index.js";
import {
  ACTION_EXECUTION_PRECONDITIONS,
  ActionExecutionPreconditions,
} from "../generic-action-templates/targeting-properties-config-templates/action-execution-preconditions.js";

const targetingPropertiesOverrides: Partial<CombatActionTargetingPropertiesConfig> = {
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
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.BOW_ATTACK,
  {}
);

const config: CombatActionComponentConfig = {
  description: "An arrow that bounces to up to two additional targets after the first",
  targetingProperties,
  combatLogMessageProperties: new CombatActionCombatLogProperties({
    origin: CombatActionOrigin.Attack,
  }),
  hitOutcomeProperties,
  costProperties: COST_PROPERTIES_TEMPLATE_GETTERS.FREE_ACTION(),
  stepsConfig: CHAINING_SPLIT_ARROW_PROJECTILE_STEPS_CONFIG,
  hierarchyProperties: {
    ...BASE_ACTION_HIERARCHY_PROPERTIES,

    getChildren: (context) => {
      let cursor = context.tracker.getPreviousTrackerInSequenceOption();
      let numBouncesSoFar = 0;
      while (cursor) {
        if (
          cursor.actionExecutionIntent.actionName === CombatActionName.ChainingSplitArrowProjectile
        )
          numBouncesSoFar += 1;
        cursor = cursor.getPreviousTrackerInSequenceOption();
      }

      const previousTrackerInSequenceOption = context.tracker.getPreviousTrackerInSequenceOption();
      if (!previousTrackerInSequenceOption) return [];

      const filteredPossibleTargetIdsResult = getBouncableTargets(
        context.actionUserContext,
        context.tracker
      );
      if (filteredPossibleTargetIdsResult instanceof Error) return [];

      if (numBouncesSoFar < MAX_BOUNCES && filteredPossibleTargetIdsResult.possibleTargetIds.length)
        return [COMBAT_ACTIONS[CombatActionName.ChainingSplitArrowProjectile]];

      return [];
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
  const entityIdsByDisposition = actionUser.getAllyAndOpponentIds(
    party,
    actionUserContext.getBattleOption()
  );

  const opponentIds = entityIdsByDisposition[FriendOrFoe.Hostile];
  const opponents = AdventuringParty.getCombatants(party, opponentIds);

  return {
    possibleTargetIds: opponents
      .filter((combatant) => combatant.combatantProperties.hitPoints > 0)
      .map((combatant) => combatant.entityProperties.id)
      .filter((id) => id !== previousTargetIdResult),
    previousTargetId: previousTargetIdResult,
  };
}
