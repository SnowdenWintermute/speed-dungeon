import { ActionCommandPayload, ActionCommandType } from "./index.js";
import { ActionCommandReceiver } from "./action-command-receiver.js";

export class ActionCommand {
  constructor(
    public gameName: string,
    public entityId: string,
    public payload: ActionCommandPayload,
    public receiver: ActionCommandReceiver
  ) {}

  execute(): Promise<Error | void | ActionCommandPayload[]> {
    switch (this.payload.type) {
      case ActionCommandType.PayAbilityCosts:
        return this.receiver.payAbilityCostsActionCommandHandler(
          this.gameName,
          this.entityId,
          this.payload
        );
      case ActionCommandType.MoveIntoCombatActionPosition:
        return this.receiver.moveIntoCombatActionPositionActionCommandHandler(
          this.gameName,
          this.entityId,
          this.payload
        );
      case ActionCommandType.PerformCombatAction:
        return this.receiver.performCombatActionActionCommandHandler(
          this.gameName,
          this.entityId,
          this.payload
        );
      case ActionCommandType.ReturnHome:
        return this.receiver.returnHomeActionCommandHandler(
          this.gameName,
          this.entityId,
          this.payload
        );
      case ActionCommandType.BattleResult:
        return this.receiver.battleResultActionCommandHandler(
          this.gameName,
          this.entityId,
          this.payload
        );
      case ActionCommandType.GameMessages:
        return this.receiver.gameMessageCommandHandler(this.payload);
      case ActionCommandType.RemovePlayerFromGame:
        return this.receiver.removePlayerFromGameCommandHandler(this.payload.username);
    }
  }
}
