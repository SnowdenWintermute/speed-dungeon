import { CombatActionGameLogProperties } from "../../combat-action-combat-log-properties.js";
import { HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import { COST_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/cost-properties-templates/index.js";
import {
  createTargetingPropertiesConfig,
  TARGETING_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/targeting-properties-config-templates/index.js";
import { CombatActionOrigin } from "../../combat-action-origin.js";
import { ActionResolutionStepsConfig } from "../../combat-action-steps-config.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../base-hierarchy-properties.js";
import { CombatActionLeaf } from "../../combat-action-leaf.js";
import { CombatActionName } from "../../combat-action-names.js";
import { CombatActionComponentConfig } from "../../index.js";
import { ActionResolutionStepType } from "../../../../action-processing/action-steps/index.js";

const targetingProperties = createTargetingPropertiesConfig(
  TARGETING_PROPERTIES_TEMPLATE_GETTERS.SELF_IN_COMBAT,
  { executionPreconditions: [] }
);

export const passTurnConfig: CombatActionComponentConfig = {
  description: "Skip your own turn",
  targetingProperties,
  gameLogMessageProperties: new CombatActionGameLogProperties({
    origin: CombatActionOrigin.SpellCast,
    getOnUseMessage: (data) => {
      return `${data.nameOfActionUser} passes their turn`;
    },
  }),

  hitOutcomeProperties: HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.THREATLESS_ACTION(),
  costProperties: COST_PROPERTIES_TEMPLATE_GETTERS.BASIC_ACTION(),
  stepsConfig: new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.PreInitialPositioningDetermineShouldExecuteOrReleaseTurnLock]: {},
      [ActionResolutionStepType.PayResourceCosts]: {},
      [ActionResolutionStepType.PostActionUseGameLogMessage]: {},
      [ActionResolutionStepType.EvalOnUseTriggers]: {},
    },
    {
      [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
    },
    { getFinalSteps: (self) => self.finalSteps }
  ),
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const PASS_TURN = new CombatActionLeaf(CombatActionName.PassTurn, passTurnConfig);
