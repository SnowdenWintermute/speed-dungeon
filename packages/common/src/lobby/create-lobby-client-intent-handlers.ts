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
      lobby.gameLifecycleController.createGameHandler(data, user),
    // JoinGame,
    [ClientIntentType.JoinGame]: (data, user) =>
      lobby.gameLifecycleController.joinGameHandler(data.gameName, user),
    // LeaveGame,
    [ClientIntentType.LeaveGame]: (_data, user) =>
      lobby.gameLifecycleController.leaveGameHandler(user),
    // ToggleReadyToStartGame,
    //
    //
    // PARTY SETUP
    // CreateParty,
    [ClientIntentType.CreateParty]: (data, user) =>
      lobby.partySetupController.createPartyHandler(user, data.partyName),
    // JoinParty,
    [ClientIntentType.JoinParty]: (data, user) =>
      lobby.partySetupController.joinPartyHandler(user, data.partyName),
    // LeaveParty,
    [ClientIntentType.LeaveParty]: (_data, user) =>
      lobby.partySetupController.leavePartyHandler(user),
    // CreateCharacter,
    [ClientIntentType.CreateCharacter]: (data, user) =>
      lobby.characterLifecycleController.createCharacterHandler(user, data),
    // DeleteCharacter,
    [ClientIntentType.DeleteCharacter]: (data, user) =>
      lobby.characterLifecycleController.deleteCharacterHandler(user, data),
    // SelectSavedCharacterForProgressGame,
    [ClientIntentType.SelectSavedCharacterForProgressGame]: (data, user) =>
      lobby.characterLifecycleController.selectProgressionGameCharacterHandler(user, data),
    // SelectProgressionGameStartingFloor,
    //
    // SAVED CHARACTER MANAGMENT
    // GetSavedCharactersList,
    // GetSavedCharacterById,
    // CreateSavedCharacter,
    [ClientIntentType.CreateSavedCharacter]: (data, user) =>
      lobby.savedCharactersController.createSavedCharacterHandler(user, data),
    // DeleteSavedCharacter,
  };
}
