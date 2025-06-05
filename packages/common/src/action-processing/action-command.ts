import { ActionCommandPayload, ActionCommandType } from "./index.js";
import { ActionCommandReceiver } from "./action-command-receiver.js";

export class ActionCommand {
  constructor(
    public gameName: string,
    public payload: ActionCommandPayload,
    public receiver: ActionCommandReceiver
  ) {}

  execute(): Promise<Error | void | ActionCommandPayload[]> {
    switch (this.payload.type) {
      case ActionCommandType.CombatActionReplayTree:
        return this.receiver.combatActionReplayTreeHandler(this.payload);
      case ActionCommandType.BattleResult:
        return this.receiver.battleResultActionCommandHandler(this.gameName, this.payload);
      case ActionCommandType.GameMessages:
        return this.receiver.gameMessageCommandHandler(this.payload);
      case ActionCommandType.RemovePlayerFromGame:
        return this.receiver.removePlayerFromGameCommandHandler(this.payload.username);
      case ActionCommandType.EndCombatantTurnIfFirstInTurnOrder:
        return this.receiver.endCombatantTurn(this.payload.entityId);
    }
  }
}
