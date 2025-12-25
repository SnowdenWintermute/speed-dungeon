import { ClientIntentMap, ClientIntentType } from "../packets/client-intents.js";
import { Lobby } from "./index.js";
import { UserSession } from "./user-session.js";

export type ClientIntentHandler<K extends keyof ClientIntentMap> = (
  data: ClientIntentMap[K],
  user: UserSession
) => void;

export type LobbyClientIntentHandlers = {
  [K in keyof ClientIntentMap]: ClientIntentHandler<K>;
};

export function createLobbyClientIntentHandlers(lobby: Lobby): Partial<LobbyClientIntentHandlers> {
  return {
    //  GAME SETUP
    [ClientIntentType.RequestsGameList]: (_, user) =>
      lobby.gameLifecycleController.requestGameListHandler(user),
    [ClientIntentType.CreateGame]: (data, user) =>
      lobby.gameLifecycleController.createGameHandler(data, user),
    [ClientIntentType.JoinGame]: (data, user) =>
      lobby.gameLifecycleController.joinGameHandler(data.gameName, user),
    [ClientIntentType.LeaveGame]: (_data, user) =>
      lobby.gameLifecycleController.leaveGameHandler(user),
    // ToggleReadyToStartGame,

    // PARTY SETUP
    [ClientIntentType.CreateParty]: (data, user) =>
      lobby.partySetupController.createPartyHandler(user, data.partyName),
    [ClientIntentType.JoinParty]: (data, user) =>
      lobby.partySetupController.joinPartyHandler(user, data.partyName),
    [ClientIntentType.LeaveParty]: (_, user) => lobby.partySetupController.leavePartyHandler(user),
    [ClientIntentType.CreateCharacter]: (data, user) =>
      lobby.characterLifecycleController.createCharacterHandler(user, data),
    [ClientIntentType.DeleteCharacter]: (data, user) =>
      lobby.characterLifecycleController.deleteCharacterHandler(user, data),
    [ClientIntentType.SelectSavedCharacterForProgressGame]: (data, user) =>
      lobby.characterLifecycleController.selectProgressionGameCharacterHandler(user, data),
    [ClientIntentType.SelectProgressionGameStartingFloor]: (data, user) =>
      lobby.partySetupController.selectProgressionGameStartingFloorHandler(user, data),

    // SAVED CHARACTER MANAGMENT
    [ClientIntentType.GetSavedCharactersList]: (_, user) =>
      lobby.savedCharactersController.fetchSavedCharactersHandler(user),
    [ClientIntentType.CreateSavedCharacter]: (data, user) =>
      lobby.savedCharactersController.createSavedCharacterHandler(user, data),
    [ClientIntentType.DeleteSavedCharacter]: (data, user) =>
      lobby.savedCharactersController.deleteSavedCharacterHandler(user, data),
  };
}
