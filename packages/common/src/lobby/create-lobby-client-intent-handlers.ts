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
    //  GAME SETUP
    // RequestsGameList,
    // CreateGame,
    [ClientIntentType.CreateGame]: (data, user) =>
      lobby.gameLifecycleManager.createGameHandler(data, user),
    // JoinGame,
    [ClientIntentType.JoinGame]: (data, user) =>
      lobby.gameLifecycleManager.joinGameHandler(data.gameName, user),
    // LeaveGame,
    // ToggleReadyToStartGame,
    //
    //
    // PARTY SETUP
    // CreateParty,
    [ClientIntentType.CreateParty]: (data, user) =>
      lobby.partySetupManager.createPartyHandler(user, data.partyName),
    // JoinParty,
    [ClientIntentType.JoinParty]: (data, user) =>
      lobby.partySetupManager.joinPartyHandler(user, data.partyName),
    // LeaveParty,
    // CreateCharacter,
    // DeleteCharacter,
    // SelectSavedCharacterForProgressGame,
    // SelectProgressionGameStartingFloor,
    //
    // SAVED CHARACTER MANAGMENT
    // GetSavedCharactersList,
    // GetSavedCharacterById,
    // CreateSavedCharacter,
    // DeleteSavedCharacter,
  };
}
