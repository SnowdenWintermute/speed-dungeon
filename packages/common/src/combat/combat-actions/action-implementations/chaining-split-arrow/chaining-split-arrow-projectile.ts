import {
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionUsabilityContext,
  TargetCategories,
  TargetingScheme,
} from "../../index.js";
import { CombatantProperties } from "../../../../combatants/index.js";
import { CombatantCondition } from "../../../../combatants/combatant-conditions/index.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { AutoTargetingScheme } from "../../../targeting/auto-targeting/index.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { CHAINING_SPLIT_ARROW_PARENT } from "./index.js";
import { COMBAT_ACTIONS } from "../index.js";
import { ERROR_MESSAGES } from "../../../../errors/index.js";
import {
  CombatActionTarget,
  CombatActionTargetType,
} from "../../../targeting/combat-action-targets.js";
import { CombatantContext } from "../../../../combatant-context/index.js";
import { chooseRandomFromArray } from "../../../../utils/index.js";
import { NON_COMBATANT_INITIATED_ACTIONS_COMMON_CONFIG } from "../non-combatant-initiated-actions-common-config.js";
import {
  ActionMotionPhase,
  ActionResolutionStepType,
} from "../../../../action-processing/index.js";
import { ActionTracker } from "../../../../action-processing/action-tracker.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import { MobileVfxName, VfxType } from "../../../../vfx/index.js";
import { getAttackHpChangeProperties } from "../attack/get-attack-hp-change-properties.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { HoldableSlotType } from "../../../../items/equipment/slots.js";
import { RANGED_ACTIONS_COMMON_CONFIG } from "../ranged-actions-common-config.js";

const MAX_BOUNCES = 2;

const config: CombatActionComponentConfig = {
  ...RANGED_ACTIONS_COMMON_CONFIG,
  ...NON_COMBATANT_INITIATED_ACTIONS_COMMON_CONFIG,
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
  userShouldMoveHomeOnComplete: false,
  getResourceCosts: () => null,
  getExecutionTime: () => 700,
  requiresCombatTurn: () => true,
  shouldExecute: () => true,
  getCombatantUseAnimations: (combatantContext: CombatantContext) => null,
  getHpChangeProperties: (user, primaryTarget, self) => {
    const hpChangeProperties = getAttackHpChangeProperties(
      self,
      user,
      primaryTarget,
      CombatAttribute.Dexterity,
      HoldableSlotType.MainHand
    );
    if (hpChangeProperties instanceof Error) return hpChangeProperties;

    return hpChangeProperties;
  },
  getAppliedConditions: function (): CombatantCondition[] | null {
    // @TODO - determine based on equipment
    throw new Error("Function not implemented.");
  },
  getChildren: (combatantContext, tracker) => {
    console.log("GETTING CHILDREN: ", tracker.hitOutcomes);

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
  getIsParryable: () => true,
  getCanTriggerCounterattack: (user: CombatantProperties) => false,
  getIsBlockable: (user: CombatantProperties) => true,
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
  getResolutionSteps() {
    return [
      ActionResolutionStepType.OnActivationSpawnEntity,
      ActionResolutionStepType.OnActivationVfxMotion,
      ActionResolutionStepType.RollIncomingHitOutcomes,
      ActionResolutionStepType.EvalOnHitOutcomeTriggers,
    ];
  },
  getSpawnableEntity: (context) => {
    const { combatantContext, tracker } = context;
    const previousTrackerOption = tracker.getPreviousTrackerInSequenceOption();
    let position = combatantContext.combatant.combatantProperties.position.clone();
    if (
      previousTrackerOption &&
      previousTrackerOption.spawnedEntityOption &&
      previousTrackerOption.spawnedEntityOption.type === SpawnableEntityType.Vfx
    ) {
      position = previousTrackerOption.spawnedEntityOption.vfx.vfxProperties.position.clone();
    }
    return {
      type: SpawnableEntityType.Vfx,
      vfx: {
        entityProperties: { id: context.idGenerator.generate(), name: "" },
        vfxProperties: {
          vfxType: VfxType.Mobile,
          position,
          name: MobileVfxName.Arrow,
        },
      },
    };
  },
  motionPhasePositionGetters: {
    [ActionMotionPhase.Delivery]: (context) => {
      const { combatantContext, tracker } = context;
      const { actionExecutionIntent } = tracker;
      const action = COMBAT_ACTIONS[actionExecutionIntent.actionName];
      const targetingCalculator = new TargetingCalculator(combatantContext, null);
      action.getAutoTarget(combatantContext, context.tracker.getPreviousTrackerInSequenceOption());
      const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
        combatantContext.party,
        actionExecutionIntent
      );
      if (primaryTargetResult instanceof Error) return primaryTargetResult;
      const target = primaryTargetResult;

      return target.homeLocation.clone();
    },
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
      .map((combatant) => combatant.entityProperties.id)
      .filter((id) => id !== previousTargetIdResult),
    previousTargetId: previousTargetIdResult,
  };
}
