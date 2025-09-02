import {
  CombatActionCombatLogProperties,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { ATTACK_RANGED_MAIN_HAND } from "./attack-ranged-main-hand.js";
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
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import { ACTION_STEPS_CONFIG_TEMPLATE_GETTERS } from "../generic-action-templates/step-config-templates/index.js";

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
  combatLogMessageProperties: new CombatActionCombatLogProperties({
    origin: CombatActionOrigin.Attack,
  }),
  targetingProperties,
  hitOutcomeProperties: rangedAttackProjectileHitOutcomeProperties,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
    costBases: {},
  },
  stepsConfig: ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.PROJECTILE_ENTITY(),

  hierarchyProperties: {
    ...BASE_ACTION_HIERARCHY_PROPERTIES,
    getParent: () => ATTACK_RANGED_MAIN_HAND,
  },
};

export const ATTACK_RANGED_MAIN_HAND_PROJECTILE = new CombatActionComposite(
  CombatActionName.AttackRangedMainhandProjectile,
  ATTACK_RANGED_MAIN_HAND_PROJECTILE_CONFIG
);
