import {
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
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
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import {
  CombatantBaseChildTransformNodeName,
  SceneEntityChildTransformNodeIdentifier,
  SceneEntityChildTransformNodeType,
} from "../../../../action-entities/index.js";

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
  origin: CombatActionOrigin.Attack,
  targetingProperties,
  hitOutcomeProperties: rangedAttackProjectileHitOutcomeProperties,
  costProperties: BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
  stepsConfig: new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.OnActivationActionEntityMotion]: {
        getDestination: getPrimaryTargetPositionAsDestination,
        shouldDespawnOnComplete: () => true,

        getNewParent: () => null,
        getEntityToLockOnTo: () => null,
        getCosmeticDestinationY: (context) => {
          const { combatantContext, tracker } = context;
          const { actionExecutionIntent } = tracker;

          const targetingCalculator = new TargetingCalculator(combatantContext, null);
          const primaryTargetId =
            targetingCalculator.getPrimaryTargetCombatantId(actionExecutionIntent);
          const entityPart: SceneEntityChildTransformNodeIdentifier = {
            type: SceneEntityChildTransformNodeType.CombatantBase,
            entityId: primaryTargetId,
            transformNodeName: CombatantBaseChildTransformNodeName.HitboxCenter,
          };
          return entityPart;
        },
      },
      [ActionResolutionStepType.RollIncomingHitOutcomes]: {},
      [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
    },
    { userShouldMoveHomeOnComplete: false }
  ),

  shouldExecute: () => true,
  getChildren: (context) => [],
  getParent: () => ATTACK_RANGED_MAIN_HAND,
  getRequiredRange: (_user, _self) => CombatActionRequiredRange.Ranged,
  getConcurrentSubActions() {
    return [];
  },
};

export const ATTACK_RANGED_MAIN_HAND_PROJECTILE = new CombatActionComposite(
  CombatActionName.AttackRangedMainhandProjectile,
  config
);
