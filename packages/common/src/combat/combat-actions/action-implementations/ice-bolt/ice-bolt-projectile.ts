import {
  CombatActionCombatLogProperties,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { ICE_BOLT_PARENT } from "./index.js";
import { DAMAGING_ACTIONS_COMMON_CONFIG } from "../damaging-actions-common-config.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import { iceBoltProjectileHitOutcomeProperties } from "./ice-bolt-hit-outcome-properties.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import cloneDeep from "lodash.clonedeep";
import { ICE_BOLT_PROJECTILE_STEPS_CONFIG } from "./ice-bolt-projectile-steps-config.js";

const targetingProperties = cloneDeep(
  GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileCopyParent]
);

targetingProperties.shouldExecute = DAMAGING_ACTIONS_COMMON_CONFIG.shouldExecute;

const config: CombatActionComponentConfig = {
  description: "An icy projectile",
  targetingProperties,
  hitOutcomeProperties: iceBoltProjectileHitOutcomeProperties,
  costProperties: BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Spell],
  combatLogMessageProperties: new CombatActionCombatLogProperties({
    origin: CombatActionOrigin.SpellCast,
  }),
  hierarchyProperties: {
    ...BASE_ACTION_HIERARCHY_PROPERTIES,
    getParent: () => ICE_BOLT_PARENT,
  },

  stepsConfig: ICE_BOLT_PROJECTILE_STEPS_CONFIG,
};

export const ICE_BOLT_PROJECTILE = new CombatActionComposite(
  CombatActionName.IceBoltProjectile,
  config
);
