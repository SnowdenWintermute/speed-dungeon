import { GameName } from "../index.js";
import {
  ActionCommandPayload,
  BattleResultActionCommandPayload,
  CombatActionReplayTreePayload,
  GameMessagesPayload,
} from "./index.js";

export interface ActionCommandReceiver {
  combatActionReplayTreeHandler: (payload: CombatActionReplayTreePayload) => Promise<Error | void>;
  battleResultActionCommandHandler: (
    gameName: GameName,
    payload: BattleResultActionCommandPayload
  ) => Promise<Error | ActionCommandPayload[] | void>;
  gameMessageCommandHandler: (
    payload: GameMessagesPayload,
    partyChannelToExcludeOption?: string
  ) => Promise<Error | void>;
  removePlayerFromGameCommandHandler: (username: string) => Promise<Error | void>;
}
