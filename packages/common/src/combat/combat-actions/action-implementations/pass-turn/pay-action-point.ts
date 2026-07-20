import cloneDeep from "lodash.clonedeep";
import { passTurnConfig } from "./index.js";
import { CombatActionGameLogProperties } from "../../combat-action-combat-log-properties.js";
import {
  COST_PROPERTIES_TEMPLATE_GETTERS,
  createCostPropertiesConfig,
} from "../generic-action-templates/cost-properties-templates/index.js";
import { CombatActionOrigin } from "../../combat-action-origin.js";
import { ActionResolutionStepsConfig } from "../../combat-action-steps-config.js";
import { CombatActionName } from "../../combat-action-names.js";
import { CombatActionComponentConfig } from "../../index.js";
import { CombatActionLeaf } from "../../combat-action-leaf.js";
import { ActionResolutionStepType } from "../../../../action-processing/action-steps/index.js";
import { ActionPayableResource } from "../../action-calculation-utils/action-costs.js";
import { ActionRank } from "../../../../aliases.js";

const clonedConfig = cloneDeep(passTurnConfig);

const costProperties = createCostPropertiesConfig(COST_PROPERTIES_TEMPLATE_GETTERS.BASIC_ACTION, {
  requiresCombatTurnInThisContext: () => false,
  getEndsTurnOnUse: () => false,
  costsByRank: {
    [1 as ActionRank]: { [ActionPayableResource.ActionPoints]: 1 },
  },
});

const config: CombatActionComponentConfig = {
  ...clonedConfig,
  gameLogMessageProperties: new CombatActionGameLogProperties({
    origin: CombatActionOrigin.SpellCast,
    getOnUseMessage: (data) => {
      return "";
    },
  }),
  costProperties,
  description: "Pay an action point",
  stepsConfig: new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.PreInitialPositioningDetermineShouldExecuteOrReleaseTurnLock]: {},
      [ActionResolutionStepType.PayResourceCosts]: {},
    },
    {
      [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
    },
    { getFinalSteps: (self) => self.finalSteps }
  ),
};

export const PAY_ACTION_POINT = new CombatActionLeaf(CombatActionName.PayActionPoint, config);
