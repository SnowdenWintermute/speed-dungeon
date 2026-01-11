import { ClientIntentMap, ClientIntentType } from "../../packets/client-intents.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { UserSession } from "../sessions/user-session.js";
import { MessageDispatchOutbox } from "../update-delivery/outbox.js";
import { LobbyServer } from "./index.js";

export type LobbyClientIntentHandler<K extends keyof ClientIntentMap> = (
  data: ClientIntentMap[K],
  user: UserSession
) => MessageDispatchOutbox<GameStateUpdate> | Promise<MessageDispatchOutbox<GameStateUpdate>>;

export type LobbyClientIntentHandlers = {
  [K in keyof ClientIntentMap]: LobbyClientIntentHandler<K>;
};

export function createLobbyClientIntentHandlers(
  lobbyServer: LobbyServer
): Partial<LobbyClientIntentHandlers> {
  return {
    // SESSION
    [ClientIntentType.Disconnection]: (_data, user) =>
      lobbyServer.userSessionLifecycleController.disconnectionHandler(user),
    //  GAME SETUP
    [ClientIntentType.RequestsGameList]: (_, user) =>
      lobbyServer.gameLifecycleController.requestGameListHandler(user),
    [ClientIntentType.CreateGame]: (data, user) =>
      lobbyServer.gameLifecycleController.createGameHandler(data, user),
    [ClientIntentType.JoinGame]: (data, user) =>
      lobbyServer.gameLifecycleController.joinGameHandler(data.gameName, user),
    [ClientIntentType.LeaveGame]: (_data, user) =>
      lobbyServer.gameLifecycleController.leaveGameHandler(user),
    [ClientIntentType.ToggleReadyToStartGame]: (_data, user) =>
      lobbyServer.gameLifecycleController.toggleReadyToStartGameHandler(user),

    // PARTY SETUP
    [ClientIntentType.CreateParty]: (data, user) =>
      lobbyServer.partySetupController.createPartyHandler(user, data.partyName),
    [ClientIntentType.JoinParty]: (data, user) =>
      lobbyServer.partySetupController.joinPartyHandler(user, data.partyName),
    [ClientIntentType.LeaveParty]: (_, user) =>
      lobbyServer.partySetupController.leavePartyHandler(user),
    [ClientIntentType.CreateCharacter]: (data, user) =>
      lobbyServer.characterLifecycleController.createCharacterHandler(user, data),
    [ClientIntentType.DeleteCharacter]: (data, user) =>
      lobbyServer.characterLifecycleController.deleteCharacterHandler(user, data),
    [ClientIntentType.SelectSavedCharacterForProgressGame]: (data, user) =>
      lobbyServer.characterLifecycleController.selectProgressionGameCharacterHandler(user, data),
    [ClientIntentType.SelectProgressionGameStartingFloor]: (data, user) =>
      lobbyServer.partySetupController.selectProgressionGameStartingFloorHandler(user, data),

    // SAVED CHARACTER MANAGMENT
    [ClientIntentType.GetSavedCharactersList]: (_, user) =>
      lobbyServer.savedCharactersController.fetchSavedCharactersHandler(user),
    [ClientIntentType.CreateSavedCharacter]: (data, user) =>
      lobbyServer.savedCharactersController.createSavedCharacterHandler(user, data),
    [ClientIntentType.DeleteSavedCharacter]: (data, user) =>
      lobbyServer.savedCharactersController.deleteSavedCharacterHandler(user, data),
  };
}
