import cloneDeep from "lodash.clonedeep";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import {
  ActionPayableResource,
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

const clonedConfig = cloneDeep(passTurnConfig);

const config: CombatActionComponentConfig = {
  ...clonedConfig,
  combatLogMessageProperties: new CombatActionCombatLogProperties({
    origin: CombatActionOrigin.SpellCast,
    getOnUseMessage: (data) => {
      return "";
    },
  }),
  costProperties: {
    ...passTurnConfig.costProperties,
    requiresCombatTurnInThisContext: () => false,
    costBases: { [ActionPayableResource.ActionPoints]: { base: 1 } },
  },
  description: "Pay an action point",
  stepsConfig: new ActionResolutionStepsConfig(
    {
      [ActionResolutionStepType.DetermineShouldExecuteOrReleaseTurnLock]: {},
      [ActionResolutionStepType.PayResourceCosts]: {},
      [ActionResolutionStepType.PostActionUseCombatLogMessage]: {},
      [ActionResolutionStepType.EvalOnUseTriggers]: {},
      [ActionResolutionStepType.RollIncomingHitOutcomes]: {},
      [ActionResolutionStepType.EvalOnHitOutcomeTriggers]: {},
      [ActionResolutionStepType.EvaluatePlayerEndTurnAndInputLock]: {},
    },
    { userShouldMoveHomeOnComplete: false }
  ),
};

export const PAY_ACTION_POINT = new CombatActionLeaf(CombatActionName.PayActionPoint, config);
