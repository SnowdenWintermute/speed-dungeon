import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { COMBAT_ACTIONS } from "../../combat/index.js";
import {
  GameUpdateCommandType,
  ActionUseGameLogMessageUpdateCommand,
} from "../game-update-commands.js";

export class PostGameLogMessageActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext, stepType: ActionResolutionStepType) {
    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];

    const { getOnUseMessage, getOnUseMessageData } = action.gameLogMessageProperties;

    let gameUpdateCommandOption: null | ActionUseGameLogMessageUpdateCommand = null;

    if (getOnUseMessage !== null) {
      const actionUseMessageData = getOnUseMessageData(context);
      gameUpdateCommandOption = {
        type: GameUpdateCommandType.ActionUseGameLogMessage,
        step: stepType,
        actionName: action.name,
        completionOrderId: null,
        actionUseMessageData,
      };
    }

    super(stepType, context, gameUpdateCommandOption);
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  getBranchingActions = () => [];
}
