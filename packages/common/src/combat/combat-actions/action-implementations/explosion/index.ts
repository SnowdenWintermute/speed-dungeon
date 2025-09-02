import {
  CombatActionCombatLogProperties,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionOrigin,
  TargetCategories,
} from "../../index.js";
import { BASE_EXPLOSION_RADIUS } from "../../../../app-consts.js";
import { DAMAGING_ACTIONS_COMMON_CONFIG } from "../damaging-actions-common-config.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";
import cloneDeep from "lodash.clonedeep";
import { AutoTargetingScheme } from "../../../targeting/index.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import { EXPLOSION_HIT_OUTCOME_PROPERTIES } from "./explosion-hit-outcome-properties.js";
import { EXPLOSION_STEPS_CONFIG } from "./explosion-steps-config.js";

const targetingProperties = {
  ...cloneDeep(GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileSingle]),
  prohibitedHitCombatantStates: [ProhibitedTargetCombatantStates.Dead],
};
targetingProperties.autoTargetSelectionMethod = {
  scheme: AutoTargetingScheme.WithinRadiusOfEntity,
  radius: BASE_EXPLOSION_RADIUS,
  validTargetCategories: TargetCategories.Any,
};

targetingProperties.shouldExecute = DAMAGING_ACTIONS_COMMON_CONFIG.shouldExecute;

const config: CombatActionComponentConfig = {
  description: "Deals kinetic fire damage in an area around the target",
  targetingProperties,
  combatLogMessageProperties: new CombatActionCombatLogProperties({
    origin: CombatActionOrigin.TriggeredCondition,
    getOnUseMessage: (data) => {
      return `${data.nameOfActionUser} explodes!`;
    },
  }),

  hitOutcomeProperties: EXPLOSION_HIT_OUTCOME_PROPERTIES,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
    costBases: {},
    getEndsTurnOnUse: () => false,
    requiresCombatTurnInThisContext: () => false,
  },
  stepsConfig: EXPLOSION_STEPS_CONFIG,
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const EXPLOSION = new CombatActionComposite(CombatActionName.Explosion, config);
