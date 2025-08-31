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
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import {
  ActionHitOutcomePropertiesBaseTypes,
  CombatActionHitOutcomeProperties,
  CombatActionResource,
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
  CombatantBaseChildTransformNodeIdentifier,
  CombatantBaseChildTransformNodeName,
  SceneEntityType,
} from "../../../../scene-entities/index.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";

const targetingProperties =
  GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileCopyParent];

export const rangedAttackProjectileHitOutcomeProperties: CombatActionHitOutcomeProperties = {
  ...GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Ranged],
  resourceChangePropertiesGetters: {
    [CombatActionResource.HitPoints]: (user, actionLevel, primaryTarget) => {
      const hpChangeProperties = getAttackResourceChangeProperties(
        rangedAttackProjectileHitOutcomeProperties,
        user,
        actionLevel,
        primaryTarget,
        CombatAttribute.Dexterity,
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
  },
};

export const ATTACK_RANGED_MAIN_HAND_PROJECTILE_CONFIG: CombatActionComponentConfig = {
  description: "An arrow",
  origin: CombatActionOrigin.Attack,

  getOnUseMessage: null,
  targetingProperties,
  hitOutcomeProperties: rangedAttackProjectileHitOutcomeProperties,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
    costBases: {},
  },
  stepsConfig: new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.DetermineShouldExecuteOrReleaseTurnLock]: {},
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

          const entityPart: CombatantBaseChildTransformNodeIdentifier = {
            sceneEntityIdentifier: {
              type: SceneEntityType.CharacterModel,
              entityId: primaryTargetId,
            },
            transformNodeName: CombatantBaseChildTransformNodeName.HitboxCenter,
          };
          return entityPart;
        },
      },
      [ActionResolutionStepType.RollIncomingHitOutcomes]: {},
      [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
      [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
    },
    { userShouldMoveHomeOnComplete: false }
  ),

  shouldExecute: () => true,
  hierarchyProperties: {
    ...BASE_ACTION_HIERARCHY_PROPERTIES,
    getParent: () => ATTACK_RANGED_MAIN_HAND,
  },
};

export const ATTACK_RANGED_MAIN_HAND_PROJECTILE = new CombatActionComposite(
  CombatActionName.AttackRangedMainhandProjectile,
  ATTACK_RANGED_MAIN_HAND_PROJECTILE_CONFIG
);
