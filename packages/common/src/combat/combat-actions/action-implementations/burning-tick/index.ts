import {
  CombatActionCombatLogProperties,
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { BURNING_TICK_STEPS_CONFIG } from "./burning-tick-steps-config.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import { AdventuringParty } from "../../../../adventuring-party/index.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import { BURNING_TICK_HIT_OUTCOME_PROPERTIES } from "./burning-tick-hit-outcome-properties.js";
import { COST_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/cost-properties-templates/index.js";
import {
  createTargetingPropertiesConfig,
  TARGETING_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/targeting-properties-config-templates/index.js";
import {
  ACTION_EXECUTION_PRECONDITIONS,
  ActionExecutionPreconditions,
} from "../generic-action-templates/targeting-properties-config-templates/action-execution-preconditions.js";
import { throwIfError } from "../../../../utils/index.js";

const targetingProperties = createTargetingPropertiesConfig(
  TARGETING_PROPERTIES_TEMPLATE_GETTERS.SINGLE_HOSTILE,
  {
    executionPreconditions: [
      ACTION_EXECUTION_PRECONDITIONS[ActionExecutionPreconditions.TargetsAreAlive],
    ],
  }
);

const config: CombatActionComponentConfig = {
  description: "Inflict magical fire damage on enemies",

  combatLogMessageProperties: new CombatActionCombatLogProperties({
    origin: CombatActionOrigin.TriggeredCondition,
    getOnUseMessage: (data) => {
      return `${data.nameOfTarget} is burning`;
    },
    getOnUseMessageDataOverride(context) {
      const { actionExecutionIntent } = context.tracker;
      const { actionUserContext } = context;
      const targetingCalculator = new TargetingCalculator(actionUserContext, null);
      const primaryTargetId = throwIfError(
        targetingCalculator.getPrimaryTargetCombatantId(actionExecutionIntent)
      );
      const { party } = actionUserContext;
      const targetCombatantResult = AdventuringParty.getCombatant(party, primaryTargetId);
      if (targetCombatantResult instanceof Error) throw targetCombatantResult;

      return { nameOfTarget: targetCombatantResult.entityProperties.name };
    },
  }),
  targetingProperties,
  hitOutcomeProperties: BURNING_TICK_HIT_OUTCOME_PROPERTIES,
  costProperties: COST_PROPERTIES_TEMPLATE_GETTERS.BASIC_ACTION(),
  stepsConfig: BURNING_TICK_STEPS_CONFIG,
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const BURNING_TICK = new CombatActionLeaf(CombatActionName.BurningTick, config);
