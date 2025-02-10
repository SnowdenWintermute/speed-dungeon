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
import { ERROR_MESSAGES } from "../../../../errors/index.js";
import { CombatActionTargetType } from "../../../targeting/combat-action-targets.js";
import { CombatantContext } from "../../../../combatant-context/index.js";
import { AdventuringParty } from "../../../../adventuring-party/index.js";
import { ActionSequenceManager } from "../../../../action-processing/action-sequence-manager.js";
import { ActionStepTracker } from "../../../../action-processing/action-step-tracker.js";
import { ATTACK_RANGED_MAIN_HAND } from "./attack-ranged-main-hand.js";
import { RANGED_ACTIONS_COMMON_CONFIG } from "../ranged-actions-common-config.js";

const config: CombatActionComponentConfig = {
  ...RANGED_ACTIONS_COMMON_CONFIG,
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
  getHpChangeProperties: () => null,
  getAppliedConditions: function (): CombatantCondition[] | null {
    // @TODO - determine based on equipment
    throw new Error("Function not implemented.");
  },
  getChildren: (combatantContext, tracker) => [],
  getParent: () => ATTACK_RANGED_MAIN_HAND,
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
  getAutoTarget(combatantContext, previousTrackerOption, self) {
    if (!previousTrackerOption)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.MISSING_EXPECTED_ACTION_IN_CHAIN);

    return previousTrackerOption.actionExecutionIntent.targets;
  },
  getFirstResolutionStep(
    combatantContext: CombatantContext,
    actionExecutionIntent: CombatActionExecutionIntent,
    previousTrackerOption: null | ActionStepTracker,
    manager: ActionSequenceManager,
    self
  ) {
    if (!previousTrackerOption)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.MISSING_EXPECTED_ACTION_IN_CHAIN);
    const targetResult = self.getAutoTarget(combatantContext, previousTrackerOption);
    if (targetResult instanceof Error) return targetResult;
    if (targetResult === null)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INVALID_TARGETS_SELECTED);

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
      combatantContext.combatant.combatantProperties.position.clone(),
      targetCombatantResult.combatantProperties.position.clone(),
      1000,
      "Arrow"
    );
    return step;
  },
};

export const ATTACK_RANGED_MAIN_HAND_PROJECTILE = new CombatActionComposite(
  CombatActionName.AttackRangedMainhandProjectile,
  config
);
