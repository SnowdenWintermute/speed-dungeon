import { GameName } from "../../aliases.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { UserSession } from "../sessions/user-session.js";
import { MessageDispatchOutbox } from "../update-delivery/outbox.js";

export interface GameLifecycleController {
  joinGameHandler(
    gameName: GameName,
    session: UserSession
  ): Promise<MessageDispatchOutbox<GameStateUpdate>>;
  leaveGameHandler(session: UserSession): Promise<MessageDispatchOutbox<GameStateUpdate>>;
}
