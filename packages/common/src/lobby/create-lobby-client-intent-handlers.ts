import { ClientIntentMap, ClientIntentType } from "../packets/client-intents.js";
import { Lobby } from "./index.js";
import { LobbyUser } from "./lobby-user.js";

export type LobbyClientIntentHandler<K extends keyof ClientIntentMap> = (
  data: ClientIntentMap[K],
  user: LobbyUser
) => void;

export type LobbyClientIntentHandlers = {
  [K in keyof ClientIntentMap]: LobbyClientIntentHandler<K>;
};

export function createLobbyClientIntentHandlers(lobby: Lobby): Partial<LobbyClientIntentHandlers> {
  return {
    [ClientIntentType.CreateGame]: (data, user) => lobby.createGameHandler(data, user),
  };
}
