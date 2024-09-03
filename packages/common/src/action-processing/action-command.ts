import { ActionCommandPayload, ActionCommandType } from ".";
import { ActionCommandReceiver } from "./action-command-receiver";

export class ActionCommand {
  constructor(
    public gameName: string,
    public entityId: string,
    public payload: ActionCommandPayload,
    public receiver: ActionCommandReceiver
  ) {}

  execute(): Error | void {
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
      case ActionCommandType.ChangeEquipment:
        return this.receiver.changeEquipmentActionCommandHandler(
          this.gameName,
          this.entityId,
          this.payload
        );
      case ActionCommandType.BattleResult:
        return this.receiver.battleResultActionCommandHandler(this.gameName, this.payload);
    }
  }
}
