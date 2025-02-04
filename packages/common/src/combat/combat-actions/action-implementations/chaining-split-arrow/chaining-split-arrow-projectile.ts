import {
  CombatActionComponent,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionUsabilityContext,
  TargetCategories,
  TargetingScheme,
} from "../../index.js";
import { CombatantProperties } from "../../../../combatants/index.js";
import { CombatantCondition } from "../../../../combatants/combatant-conditions/index.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";
import { ActionAccuracy } from "../../combat-action-accuracy.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { AutoTargetingScheme } from "../../../targeting/auto-targeting/index.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { MobileVfxActionResolutionStep } from "../../../../action-processing/action-steps/mobile-vfx.js";
import { CHAINING_SPLIT_ARROW_PARENT } from "./index.js";
import { COMBAT_ACTIONS } from "../index.js";
import { ERROR_MESSAGES } from "../../../../errors/index.js";
import {
  CombatActionTarget,
  CombatActionTargetType,
} from "../../../targeting/combat-action-targets.js";
import { CombatantContext } from "../../../../combatant-context/index.js";
import { ActionExecutionTracker } from "../../../../action-processing/action-execution-tracker.js";
import { chooseRandomFromArray } from "../../../../utils/index.js";
import { AdventuringParty } from "../../../../adventuring-party/index.js";
import { SequentialActionExecutionManager } from "../../../../action-processing/sequential-action-execution-manager.js";

const MAX_BOUNCES = 2;

const config: CombatActionComponentConfig = {
  description: "An arrow that bounces to up to two additional targets after the first",
  targetingSchemes: [TargetingScheme.Single],
  validTargetCategories: TargetCategories.Opponent,
  autoTargetSelectionMethod: { scheme: AutoTargetingScheme.RandomCombatant },
  usabilityContext: CombatActionUsabilityContext.InCombat,
  intent: CombatActionIntent.Malicious,
  prohibitedTargetCombatantStates: [
    ProhibitedTargetCombatantStates.Dead,
    ProhibitedTargetCombatantStates.UntargetableByPhysical,
  ],
  baseHpChangeValuesLevelMultiplier: 1,
  accuracyModifier: 1,
  appliesConditions: [],
  incursDurabilityLoss: {},
  costBases: {},
  getResourceCosts: () => null,
  getExecutionTime: () => 700,
  requiresCombatTurn: () => true,
  shouldExecute: () => true,
  getAnimationsAndEffects: function (): void {
    // rely on concurrent subactions for this
    throw new Error("Function not implemented.");
  },
  getHpChangeProperties: () => null,
  getAppliedConditions: function (): CombatantCondition[] | null {
    // @TODO - determine based on equipment
    throw new Error("Function not implemented.");
  },
  getChildren: (combatantContext, tracker) => {
    let cursor = tracker.getPreviousTrackerInSequenceOption();
    let numBouncesSoFar = 0;
    while (cursor) {
      if (cursor.actionExecutionIntent.actionName === CombatActionName.ChainingSplitArrowProjectile)
        numBouncesSoFar += 1;
      cursor = cursor.getPreviousTrackerInSequenceOption();
    }

    const previousTrackerInSequenceOption = tracker.getPreviousTrackerInSequenceOption();
    if (!previousTrackerInSequenceOption) return [];

    const filteredPossibleTargetIdsResult = getBouncableTargets(
      combatantContext,
      previousTrackerInSequenceOption
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
  getUnmodifiedAccuracy: function (user: CombatantProperties): ActionAccuracy {
    throw new Error("Function not implemented.");
  },
  getCritChance: function (user: CombatantProperties): number {
    throw new Error("Function not implemented.");
  },
  getCritMultiplier: function (user: CombatantProperties): number {
    throw new Error("Function not implemented.");
  },
  getArmorPenetration: function (user: CombatantProperties, self: CombatActionComponent): number {
    throw new Error("Function not implemented.");
  },
  getAutoTarget(combatantContext, trackerOption, self) {
    const previousTrackerInSequenceOption = trackerOption?.getPreviousTrackerInSequenceOption();
    if (!previousTrackerInSequenceOption)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.MISSING_EXPECTED_ACTION_IN_CHAIN);

    const filteredPossibleTargetIds = getBouncableTargets(
      combatantContext,
      previousTrackerInSequenceOption
    );
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
  getFirstResolutionStep(
    combatantContext: CombatantContext,
    actionExecutionIntent: CombatActionExecutionIntent,
    previousTrackerOption: null | ActionExecutionTracker,
    manager: SequentialActionExecutionManager,
    self
  ) {
    if (!previousTrackerOption)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.MISSING_EXPECTED_ACTION_IN_CHAIN);
    const targetResult = self.getAutoTarget(combatantContext, previousTrackerOption);
    if (targetResult instanceof Error) return targetResult;
    if (targetResult === null)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INVALID_TARGETS_SELECTED);

    const filteredPossibleTargetIds = getBouncableTargets(combatantContext, previousTrackerOption);
    if (filteredPossibleTargetIds instanceof Error) return filteredPossibleTargetIds;
    const { possibleTargetIds, previousTargetId } = filteredPossibleTargetIds;

    const previousTargetResult = AdventuringParty.getCombatant(
      combatantContext.party,
      previousTargetId
    );
    if (previousTargetResult instanceof Error) return previousTargetResult;

    const { targets } = actionExecutionIntent;
    if (targets.type !== CombatActionTargetType.Single) return new Error("unexpected target type");
    const targetId = targets.targetId;

    const targetCombatantResult = AdventuringParty.getCombatant(combatantContext.party, targetId);
    if (targetCombatantResult instanceof Error) return targetCombatantResult;

    const step = new MobileVfxActionResolutionStep(
      {
        combatantContext,
        actionExecutionIntent,
        previousStepOption: null,
        manager,
      },
      previousTargetResult.combatantProperties.position.clone(),
      targetCombatantResult.combatantProperties.position.clone(),
      1000,
      "Arrow"
    );
    return step;
  },
};

export const CHAINING_SPLIT_ARROW_PROJECTILE = new CombatActionComposite(
  CombatActionName.ChainingSplitArrowProjectile,
  config
);

function getBouncableTargets(
  combatantContext: CombatantContext,
  previousTrackerInSequenceOption: ActionExecutionTracker
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
      .map((combatant) => combatant.entityProperties.id)
      .filter((id) => id !== previousTargetIdResult),
    previousTargetId: previousTargetIdResult,
  };
}
