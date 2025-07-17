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
    const { combatant } = context.combatantContext;
    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];

    const messageDataGetter = action.getOnUseMessageData;

    let gameUpdateCommandOption: null | ActionUseCombatLogMessageUpdateCommand = null;

    if (messageDataGetter !== null) {
      const actionUseMessageData = messageDataGetter(context);
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
