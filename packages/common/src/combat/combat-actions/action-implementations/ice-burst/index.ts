import {
  BASE_ACTION_HIERARCHY_PROPERTIES,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  TargetCategories,
} from "../../index.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";
import { AutoTargetingScheme } from "../../../targeting/auto-targeting/index.js";
import { BASE_EXPLOSION_RADIUS } from "../../../../app-consts.js";
import cloneDeep from "lodash.clonedeep";
import {
  CombatActionTargetingPropertiesConfig,
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import {
  CombatActionCombatLogProperties,
  CombatActionOrigin,
} from "../../combat-action-combat-log-properties.js";
import { ICE_BURST_HIT_OUTCOME_PROPERTIES } from "./ice-burst-hit-outcome-properties.js";
import { ICE_BURST_STEPS_CONFIG } from "./ice-burst-steps-config.js";
import { COST_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/cost-properties-templates/index.js";

const targetingProperties: CombatActionTargetingPropertiesConfig = {
  ...cloneDeep(GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileSingle]),
  prohibitedTargetCombatantStates: [],
  prohibitedHitCombatantStates: [
    ProhibitedTargetCombatantStates.UntargetableByPhysical,
    ProhibitedTargetCombatantStates.UntargetableBySpells,
    ProhibitedTargetCombatantStates.Dead,
  ],
  autoTargetSelectionMethod: {
    scheme: AutoTargetingScheme.WithinRadiusOfEntity,
    radius: BASE_EXPLOSION_RADIUS,
    validTargetCategories: TargetCategories.Any,
    excludePrimaryTarget: true,
  },
};

const config: CombatActionComponentConfig = {
  description: "Deals kinetic ice damage in an area around the target",
  combatLogMessageProperties: new CombatActionCombatLogProperties({
    origin: CombatActionOrigin.TriggeredCondition,
    getOnUseMessage: (data) => `${data.nameOfActionUser} shatters!`,
  }),
  targetingProperties,
  hitOutcomeProperties: ICE_BURST_HIT_OUTCOME_PROPERTIES,
  costProperties: COST_PROPERTIES_TEMPLATE_GETTERS.FREE_ACTION(),
  stepsConfig: ICE_BURST_STEPS_CONFIG,
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const ICE_BURST = new CombatActionComposite(CombatActionName.IceBurst, config);
