import { GameId } from "../../aliases.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { UserSession } from "../sessions/user-session.js";
import { MessageDispatchOutbox } from "../update-delivery/outbox.js";

export interface GameLifecycleController {
  joinGameHandler(
    gameId: GameId,
    session: UserSession
  ): Promise<MessageDispatchOutbox<GameStateUpdate>>;
  leaveGameHandler(
    session: UserSession,
    ...args: any[]
  ): Promise<MessageDispatchOutbox<GameStateUpdate>>;
  cleanUpGame(game: SpeedDungeonGame): Promise<void>;
}
