import {
  CombatActionCombatLogProperties,
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import { BURNING_TICK_STEPS_CONFIG } from "./burning-tick-steps-config.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import { AdventuringParty } from "../../../../adventuring-party/index.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import { BURNING_TICK_HIT_OUTCOME_PROPERTIES } from "./burning-tick-hit-outcome-properties.js";
import { COST_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/cost-properties-templates/index.js";

const config: CombatActionComponentConfig = {
  description: "Inflict magical fire damage on enemies",

  combatLogMessageProperties: new CombatActionCombatLogProperties({
    origin: CombatActionOrigin.TriggeredCondition,
    getOnUseMessage: (data) => {
      return `${data.nameOfTarget} is burning`;
    },
    getOnUseMessageDataOverride(context) {
      const { actionExecutionIntent } = context.tracker;
      const { combatantContext } = context;
      const targetingCalculator = new TargetingCalculator(combatantContext, null);
      const primaryTargetId =
        targetingCalculator.getPrimaryTargetCombatantId(actionExecutionIntent);
      const { party } = combatantContext;
      const targetCombatantResult = AdventuringParty.getCombatant(party, primaryTargetId);
      if (targetCombatantResult instanceof Error) throw targetCombatantResult;

      return { nameOfTarget: targetCombatantResult.entityProperties.name };
    },
  }),
  targetingProperties: GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileSingle],
  hitOutcomeProperties: BURNING_TICK_HIT_OUTCOME_PROPERTIES,
  costProperties: COST_PROPERTIES_TEMPLATE_GETTERS.BASIC_ACTION(),
  stepsConfig: BURNING_TICK_STEPS_CONFIG,
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const BURNING_TICK = new CombatActionLeaf(CombatActionName.BurningTick, config);
