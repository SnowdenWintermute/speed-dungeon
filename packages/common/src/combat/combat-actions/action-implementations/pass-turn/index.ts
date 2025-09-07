import {
  ActionResolutionStepsConfig,
  BASE_ACTION_HIERARCHY_PROPERTIES,
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
} from "../../index.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import {
  CombatActionCombatLogProperties,
  CombatActionOrigin,
} from "../../combat-action-combat-log-properties.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import { COST_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/cost-properties-templates/index.js";
import { TARGETING_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/targeting-properties-config-templates/index.js";

const hitOutcomeProperties = createHitOutcomeProperties(
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.BENEVOLENT_CONSUMABLE,
  { getThreatChangesOnHitOutcomes: () => null }
);

export const passTurnConfig: CombatActionComponentConfig = {
  description: "Skip your own turn",
  targetingProperties: TARGETING_PROPERTIES_TEMPLATE_GETTERS.SELF_IN_COMBAT(),
  combatLogMessageProperties: new CombatActionCombatLogProperties({
    origin: CombatActionOrigin.SpellCast,
    getOnUseMessage: (data) => {
      return `${data.nameOfActionUser} passes their turn`;
    },
  }),

  hitOutcomeProperties,
  costProperties: COST_PROPERTIES_TEMPLATE_GETTERS.BASIC_ACTION(),
  stepsConfig: new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.DetermineShouldExecuteOrReleaseTurnLock]: {},
      [ActionResolutionStepType.PayResourceCosts]: {},
      [ActionResolutionStepType.PostActionUseCombatLogMessage]: {},
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
