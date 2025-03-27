import {
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionUsabilityContext,
  TargetCategories,
  TargetingScheme,
} from "../../index.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { AutoTargetingScheme } from "../../../targeting/auto-targeting/index.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { ERROR_MESSAGES } from "../../../../errors/index.js";
import { CombatantContext } from "../../../../combatant-context/index.js";
import { ATTACK_RANGED_MAIN_HAND } from "./attack-ranged-main-hand.js";
import { RANGED_ACTIONS_COMMON_CONFIG } from "../ranged-actions-common-config.js";
import {
  ActionMotionPhase,
  ActionResolutionStepType,
} from "../../../../action-processing/index.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import { getAttackHpChangeProperties } from "./get-attack-hp-change-properties.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { HoldableSlotType } from "../../../../items/equipment/slots.js";
import { PrimedForExplosionCombatantCondition } from "../../../../combatants/combatant-conditions/primed-for-explosion.js";

const config: CombatActionComponentConfig = {
  ...RANGED_ACTIONS_COMMON_CONFIG,
  description: "An arrow",
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
  incursDurabilityLoss: {},
  costBases: {},
  userShouldMoveHomeOnComplete: false,
  getResourceCosts: () => null,
  getExecutionTime: () => 700,
  requiresCombatTurn: () => true,
  shouldExecute: () => true,
  getActionStepAnimations: (context) => null,
  getHpChangeProperties: (user, primaryTarget, self) => {
    const hpChangeProperties = getAttackHpChangeProperties(
      self,
      user,
      primaryTarget,
      CombatAttribute.Dexterity,
      HoldableSlotType.MainHand,
      // allow unusable weapons because it may be the case that the bow breaks
      // but the projectile has yet to caluclate it's hit, and it should still consider
      // the bow it was fired from
      // it should never add weapon properties from an initially broken weapon because the projectile would not
      // be allowed to be fired from a broken weapon
      { usableWeaponsOnly: false }
    );
    if (hpChangeProperties instanceof Error) return hpChangeProperties;

    return hpChangeProperties;
  },
  getAppliedConditions: (context) => {
    // const { idGenerator, combatantContext } = context;
    // const { combatant } = combatantContext;
    // // @TODO - determine based on equipment, ex: ice sword applies "cold" condition

    // const primedForExplosionCondition = new PrimedForExplosionCombatantCondition(
    //   idGenerator.generate(),
    //   combatant.combatantProperties.level
    // );
    return [];
    // return [primedForExplosionCondition];
  },
  getChildren: (combatantContext, tracker) => [],
  getParent: () => ATTACK_RANGED_MAIN_HAND,
  getRequiredRange: (_user, _self) => CombatActionRequiredRange.Ranged,
  getConcurrentSubActions() {
    return [];
  },
  getAutoTarget(combatantContext, previousTrackerOption, self) {
    if (!previousTrackerOption)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.MISSING_EXPECTED_ACTION_IN_CHAIN);

    return previousTrackerOption.actionExecutionIntent.targets;
  },
  getResolutionSteps() {
    return [
      ActionResolutionStepType.OnActivationVfxMotion,
      ActionResolutionStepType.RollIncomingHitOutcomes,
      ActionResolutionStepType.EvalOnHitOutcomeTriggers,
    ];
  },
  motionPhasePositionGetters: {
    [ActionMotionPhase.Delivery]: (context) => {
      const { combatantContext, tracker } = context;
      const { actionExecutionIntent } = tracker;

      const targetingCalculator = new TargetingCalculator(combatantContext, null);
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

export const ATTACK_RANGED_MAIN_HAND_PROJECTILE = new CombatActionComposite(
  CombatActionName.AttackRangedMainhandProjectile,
  config
);
