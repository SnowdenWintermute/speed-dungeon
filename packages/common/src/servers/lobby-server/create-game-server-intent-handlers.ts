import {
  ServerToServerMessage,
  ServerToServerMessageMap,
  ServerToServerMessageType,
} from "../../packets/server-to-server.js";
import { GameServerSession } from "../sessions/game-server-session-registry.js";
import { MessageDispatchOutbox } from "../update-delivery/outbox.js";
import { LobbyServer } from "./index.js";

export type LobbyGameServerIntentHandler<K extends keyof ServerToServerMessageMap> = (
  data: ServerToServerMessageMap[K],
  session: GameServerSession
) =>
  | MessageDispatchOutbox<ServerToServerMessage>
  | Promise<MessageDispatchOutbox<ServerToServerMessage>>;

export type LobbyGameServerIntentHandlers = {
  [K in keyof ServerToServerMessageMap]: LobbyGameServerIntentHandler<K>;
};

export function createLobbyGameServerIntentHandlers(
  lobbyServer: LobbyServer
): LobbyGameServerIntentHandlers {
  return {
    [ServerToServerMessageType.GameHandoff]: function (data, session) {
      throw new Error("Function not implemented.");
    },
    [ServerToServerMessageType.GameServerReady]: function (data, session) {
      throw new Error("Function not implemented.");
    },
  };
}
