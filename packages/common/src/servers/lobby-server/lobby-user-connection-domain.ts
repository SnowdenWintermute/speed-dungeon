import { ConnectionId } from "../../aliases.js";
import { ClientIntent } from "../../packets/client-intents.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { ConnectionDomain } from "../connection-domains/index.js";
import { UserSessionRegistry } from "../sessions/user-session-registry.js";
import { UserSession } from "../sessions/user-session.js";
import { MessageDispatchFactory } from "../update-delivery/message-dispatch-factory.js";
import { LobbyClientIntentHandlers } from "./create-lobby-client-intent-handlers";

export class LobbyUserConnectionDomain extends ConnectionDomain<
  GameStateUpdate,
  ClientIntent,
  LobbyClientIntentHandlers,
  UserSession
> {
  sessionRegistry = new UserSessionRegistry();
  messageDispatchFactory = new MessageDispatchFactory<GameStateUpdate>(this.sessionRegistry);

  messageHandlers = {};

  handleHandshake(connectionId: ConnectionId): void {
    throw new Error("Method not implemented.");
  }
}
