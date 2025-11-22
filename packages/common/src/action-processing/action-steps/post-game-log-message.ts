import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { COMBAT_ACTIONS } from "../../combat/index.js";
import {
  ActionResolutionGameLogMessageUpdateCommand,
  ActionUseGameLogMessageUpdateCommand,
  GameUpdateCommandType,
} from "../game-update-commands.js";
import { HitOutcome } from "../../hit-outcome.js";

export class PostGameLogMessageActionResolutionStep extends ActionResolutionStep {
  constructor(
    context: ActionResolutionStepContext,
    stepType:
      | ActionResolutionStepType.PostActionUseGameLogMessage
      | ActionResolutionStepType.PostOnResolutionGameLogMessage
  ) {
    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];

    const { getOnUseMessage, getOnFailureMessage, getOnSuccessMessage, getOnUseMessageData } =
      action.gameLogMessageProperties;

    let gameUpdateCommandOption:
      | null
      | ActionUseGameLogMessageUpdateCommand
      | ActionResolutionGameLogMessageUpdateCommand = null;

    let gameUpdateType = GameUpdateCommandType.ActionUseGameLogMessage;

    let isSuccess: undefined | boolean;

    const messageGetterOption = (() => {
      switch (stepType) {
        case ActionResolutionStepType.PostActionUseGameLogMessage:
          return getOnUseMessage;
        case ActionResolutionStepType.PostOnResolutionGameLogMessage:
          gameUpdateType = GameUpdateCommandType.ActionResolutionGameLogMessage;
          if (context.tracker.hitOutcomes.outcomeFlags[HitOutcome.Hit]) {
            isSuccess = true;
            return getOnSuccessMessage;
          } else {
            return getOnFailureMessage;
          }
      }
    })();

    if (messageGetterOption !== null) {
      const actionUseMessageData = getOnUseMessageData(context);
      if (gameUpdateType === GameUpdateCommandType.ActionUseGameLogMessage) {
        gameUpdateCommandOption = {
          type: gameUpdateType,
          step: stepType,
          actionName: action.name,
          completionOrderId: null,
          actionUseMessageData,
        };
      } else if (gameUpdateType === GameUpdateCommandType.ActionResolutionGameLogMessage) {
        gameUpdateCommandOption = {
          type: gameUpdateType,
          step: stepType,
          actionName: action.name,
          completionOrderId: null,
          actionUseMessageData,
        };
        if (isSuccess !== undefined) {
          gameUpdateCommandOption.isSuccess = true;
        }
      }
    }

    super(stepType, context, gameUpdateCommandOption);
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  getBranchingActions = () => [];
}
