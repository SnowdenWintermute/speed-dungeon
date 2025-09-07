import cloneDeep from "lodash.clonedeep";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import {
  ActionResolutionStepsConfig,
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
} from "../../index.js";
import { passTurnConfig } from "./index.js";
import {
  CombatActionCombatLogProperties,
  CombatActionOrigin,
} from "../../combat-action-combat-log-properties.js";
import {
  COST_PROPERTIES_TEMPLATE_GETTERS,
  createCostPropertiesConfig,
} from "../generic-action-templates/cost-properties-templates/index.js";

const clonedConfig = cloneDeep(passTurnConfig);

const costProperties = createCostPropertiesConfig(COST_PROPERTIES_TEMPLATE_GETTERS.BASIC_ACTION, {
  requiresCombatTurnInThisContext: () => false,
  getEndsTurnOnUse: () => false,
});

const config: CombatActionComponentConfig = {
  ...clonedConfig,
  combatLogMessageProperties: new CombatActionCombatLogProperties({
    origin: CombatActionOrigin.SpellCast,
    getOnUseMessage: (data) => {
      return "";
    },
  }),
  costProperties,
  description: "Pay an action point",
  stepsConfig: new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.DetermineShouldExecuteOrReleaseTurnLock]: {},
      [ActionResolutionStepType.PayResourceCosts]: {},
      [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
    },
    {
      [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
    },
    { getFinalSteps: (self) => self.finalSteps }
  ),
};

export const PAY_ACTION_POINT = new CombatActionLeaf(CombatActionName.PayActionPoint, config);
