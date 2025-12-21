import { ClientIntentMap, ClientIntentType } from "../packets/client-intents.js";
import { Lobby } from "./index.js";
import { UserSession } from "./user-session.js";

export type LobbyClientIntentHandler<K extends keyof ClientIntentMap> = (
  data: ClientIntentMap[K],
  user: UserSession
) => void;

export type LobbyClientIntentHandlers = {
  [K in keyof ClientIntentMap]: LobbyClientIntentHandler<K>;
};

export function createLobbyClientIntentHandlers(lobby: Lobby): Partial<LobbyClientIntentHandlers> {
  return {
    [ClientIntentType.CreateGame]: (data, user) => lobby.createGameHandler(data, user),
  };
}
