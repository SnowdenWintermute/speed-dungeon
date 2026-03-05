import { ActionCommandPayload, ActionCommandType } from "./index.js";
import { ActionCommandReceiver } from "./action-command-receiver.js";
import { GameName } from "../aliases.js";
import { Serializable, SerializedOf } from "../serialization/index.js";
import { instanceToPlain, plainToInstance } from "class-transformer";

export class ActionCommand implements Serializable {
  constructor(
    public gameName: GameName,
    public payload: ActionCommandPayload,
    public receiver: ActionCommandReceiver
  ) {}

  toSerialized() {
    return instanceToPlain(this);
  }

  static fromSerialized(serialized: SerializedOf<ActionCommand>) {
    return plainToInstance(ActionCommand, serialized);
  }

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
    }
  }
}
