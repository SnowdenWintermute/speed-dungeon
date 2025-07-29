import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import {
  ActionResolutionStepsConfig,
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
} from "../../index.js";
import { passTurnConfig } from "./index.js";

const config: CombatActionComponentConfig = {
  ...passTurnConfig,
  description: "For combatant conditions ending their turn on tick",
  getOnUseMessage: (data) => {
    return `${data.nameOfActionUser} ticks`;
  },
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

export const CONDITION_PASS_TURN = new CombatActionLeaf(CombatActionName.ConditionPassTurn, config);
