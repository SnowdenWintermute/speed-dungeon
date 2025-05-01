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
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { getAttackResourceChangeProperties } from "./get-attack-hp-change-properties.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { HoldableSlotType } from "../../../../items/equipment/slots.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import {
  ActionHitOutcomePropertiesBaseTypes,
  CombatActionHitOutcomeProperties,
  GENERIC_HIT_OUTCOME_PROPERTIES,
} from "../../combat-action-hit-outcome-properties.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";
import { ActionResolutionStepsConfig } from "../../combat-action-steps-config.js";
import { getPrimaryTargetPositionAsDestination } from "../common-destination-getters.js";

const targetingProperties =
  GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileCopyParent];

export const rangedAttackProjectileHitOutcomeProperties: CombatActionHitOutcomeProperties = {
  ...GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Ranged],
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
  description: "An arrow",
  targetingProperties,
  hitOutcomeProperties: rangedAttackProjectileHitOutcomeProperties,
  costProperties: BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
  stepsConfig: new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.OnActivationActionEntityMotion]: {
        getDestination: getPrimaryTargetPositionAsDestination,
      },
      [ActionResolutionStepType.RollIncomingHitOutcomes]: {},
      [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
    },
    { userShouldMoveHomeOnComplete: false }
  ),

  usabilityContext: CombatActionUsabilityContext.InCombat,
  intent: CombatActionIntent.Malicious,
  shouldExecute: () => true,
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
};

export const ATTACK_RANGED_MAIN_HAND_PROJECTILE = new CombatActionComposite(
  CombatActionName.AttackRangedMainhandProjectile,
  config
);
