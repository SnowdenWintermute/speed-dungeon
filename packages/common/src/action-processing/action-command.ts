import { ActionCommandPayload, ActionCommandType } from "./index.js";
import { ActionCommandManager } from "./action-command-manager.js";
import { ActionCommandReceiver } from "./action-command-receiver.js";

export class ActionCommand {
  constructor(
    public gameName: string,
    public actionCommandManager: ActionCommandManager,
    public entityId: string,
    public payload: ActionCommandPayload,
    public receiver: ActionCommandReceiver
  ) {}

  execute(): Error | void {
    switch (this.payload.type) {
      case ActionCommandType.PayAbilityCosts:
        return this.receiver.payAbilityCostsActionCommandHandler(
          this.actionCommandManager,
          this.gameName,
          this.entityId,
          this.payload
        );
      case ActionCommandType.MoveIntoCombatActionPosition:
        return this.receiver.moveIntoCombatActionPositionActionCommandHandler(
          this.actionCommandManager,
          this.gameName,
          this.entityId,
          this.payload
        );
      case ActionCommandType.PerformCombatAction:
        return this.receiver.performCombatActionActionCommandHandler(
          this.actionCommandManager,
          this.gameName,
          this.entityId,
          this.payload
        );
      case ActionCommandType.ReturnHome:
        return this.receiver.returnHomeActionCommandHandler(
          this.actionCommandManager,
          this.gameName,
          this.entityId,
          this.payload
        );
      case ActionCommandType.ChangeEquipment:
        return this.receiver.changeEquipmentActionCommandHandler(
          this.actionCommandManager,
          this.gameName,
          this.entityId,
          this.payload
        );
      case ActionCommandType.BattleResult:
        return this.receiver.battleResultActionCommandHandler(
          this.actionCommandManager,
          this.gameName,
          this.entityId,
          this.payload
        );
      case ActionCommandType.LadderUpdate:
        return this.receiver.ladderUpdateActionCommandHandler(
          this.actionCommandManager,
          this.payload
        );
    }
  }
}
