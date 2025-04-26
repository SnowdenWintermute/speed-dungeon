import {
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionUsabilityContext,
} from "../../index.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { ERROR_MESSAGES } from "../../../../errors/index.js";
import { ATTACK_RANGED_MAIN_HAND } from "./attack-ranged-main-hand.js";
import { RANGED_ACTIONS_COMMON_CONFIG } from "../ranged-actions-common-config.js";
import {
  ActionMotionPhase,
  ActionResolutionStepType,
} from "../../../../action-processing/index.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import { getAttackResourceChangeProperties } from "./get-attack-hp-change-properties.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { HoldableSlotType } from "../../../../items/equipment/slots.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import {
  ActionHitOutcomePropertiesGenericTypes,
  CombatActionHitOutcomeProperties,
  GENERIC_HIT_OUTCOME_PROPERTIES,
} from "../../combat-action-hit-outcome-properties.js";

const targetingProperties =
  GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileCopyParent];

export const rangedAttackProjectileHitOutcomeProperties: CombatActionHitOutcomeProperties = {
  ...GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesGenericTypes.Ranged],
  getHpChangeProperties: (user, primaryTarget) => {
    const hpChangeProperties = getAttackResourceChangeProperties(
      rangedAttackProjectileHitOutcomeProperties,
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
};

const config: CombatActionComponentConfig = {
  ...RANGED_ACTIONS_COMMON_CONFIG,
  description: "An arrow",
  targetingProperties,
  hitOutcomeProperties: rangedAttackProjectileHitOutcomeProperties,
  usabilityContext: CombatActionUsabilityContext.InCombat,
  intent: CombatActionIntent.Malicious,
  incursDurabilityLoss: {},
  costBases: {},
  userShouldMoveHomeOnComplete: false,
  getResourceCosts: () => null,
  requiresCombatTurn: () => true,
  shouldExecute: () => true,
  getActionStepAnimations: (context) => null,
  getChildren: (context) => [],
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
      ActionResolutionStepType.OnActivationActionEntityMotion,
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

      return { position: target.combatantProperties.homeLocation.clone() };
    },
  },
};

export const ATTACK_RANGED_MAIN_HAND_PROJECTILE = new CombatActionComposite(
  CombatActionName.AttackRangedMainhandProjectile,
  config
);
