import {
  BASE_ACTION_HIERARCHY_PROPERTIES,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  TargetCategories,
} from "../../index.js";
import {
  CombatActionCombatLogProperties,
  CombatActionOrigin,
} from "../../combat-action-combat-log-properties.js";
import { ICE_BURST_HIT_OUTCOME_PROPERTIES } from "./ice-burst-hit-outcome-properties.js";
import { ICE_BURST_STEPS_CONFIG } from "./ice-burst-steps-config.js";
import { COST_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/cost-properties-templates/index.js";
import {
  createTargetingPropertiesConfig,
  TARGETING_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/targeting-properties-config-templates/index.js";
import { AutoTargetingScheme } from "../../../targeting/index.js";
import { BASE_EXPLOSION_RADIUS } from "../../../../app-consts.js";

const targetingProperties = createTargetingPropertiesConfig(
  TARGETING_PROPERTIES_TEMPLATE_GETTERS.EXPLOSION,
  {
    autoTargetSelectionMethod: {
      scheme: AutoTargetingScheme.WithinRadiusOfEntity,
      radius: BASE_EXPLOSION_RADIUS,
      validTargetCategories: TargetCategories.Any,
      excludePrimaryTarget: true,
    },
  }
);

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
