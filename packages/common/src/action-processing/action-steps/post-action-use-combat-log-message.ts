import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { COMBAT_ACTIONS } from "../../combat/index.js";
import {
  GameUpdateCommandType,
  ActionUseCombatLogMessageUpdateCommand,
} from "../game-update-commands.js";

const stepType = ActionResolutionStepType.PostActionUseCombatLogMessage;
export class PostActionUseCombatLogMessageActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext) {
    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];

    const { getOnUseMessage, getOnUseMessageData } = action.combatLogMessageProperties;

    let gameUpdateCommandOption: null | ActionUseCombatLogMessageUpdateCommand = null;

    if (getOnUseMessage !== null) {
      const actionUseMessageData = getOnUseMessageData(context);
      gameUpdateCommandOption = {
        type: GameUpdateCommandType.ActionUseCombatLogMessage,
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
