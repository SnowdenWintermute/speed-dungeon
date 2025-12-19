import {
  ClientIntent,
  ClientIntentType,
  CombatantClass,
  GameMode,
  IntentHandlers,
  SpeedDungeonGame,
} from "../index.js";
import { GameStateUpdate } from "../packets/game-state-updates";

// either a LocalLobbyUpdateGateway which directly calls client's GameUpdateReceiver handlers for updates
// or a WebsocketLobbyUpdateGateway which emits socket.io events with the updates which the client's
// GameUpdateReceiver is listening for
export interface LobbyUpdateGateway {
  submit(update: GameStateUpdate): void;
}

// give the set up game to a GameSimulator either a locally owned GameSimulator
// on the client or send it over websockets to a GameServer which owns a GameSimulator
export interface GameSimulatorHandoffStrategy {
  handoff(game: SpeedDungeonGame): void;
}

export class LobbyPlayer {
  constructor(
    public username: string,
    /** snowauth user id */
    public userId: null | number,
    public currentGameName: null | string = null,
    public currentPartyName: null | string = null
  ) {}
}

export type Username = string;
export type GameName = string;

// client app will use this to display information in the UI
// Lobby (either on a server or locally on the client) uses this to
// compute and send updates about the authoritative lobby state
export class LobbyState {
  // games either being set up or already handed off to GameSimulators
  // so players can see list of joinable games and games in progress
  // and so the game setup logic can operate on the game state objects
  private games: Record<GameName, SpeedDungeonGame> = {};
  // for updating clients with the list of players not currently in games
  private players: Record<Username, LobbyPlayer> = {};

  addPlayer(player: LobbyPlayer) {}
  removePlayer(username: Username) {}
  getPlayerOption(username: Username) {
    return this.players[username];
  }

  addGame(game: SpeedDungeonGame) {}
  removeGame(gameName: GameName) {}
  getGameOption(gameName: GameName) {
    return this.games[gameName];
  }
}

export abstract class LobbyClientIntentReceiver {
  private lobby: Lobby | null = null;
  constructor() {}

  initialize(lobby: Lobby) {
    this.lobby = lobby;
  }

  // either set up the socket.io event listener for ClientIntent
  // or some way the client app can "listen" to local events
  abstract listen(): void;

  forwardIntent(clientIntent: ClientIntent) {
    const expectedLobby = this.lobby;
    if (expectedLobby === null) {
      throw new Error("Lobby was not initialized");
    }
    expectedLobby.handleIntent(clientIntent);
  }
}

// lives either inside a LobbyServer or locally on a ClientApp
export class Lobby {
  private readonly state = new LobbyState();

  constructor(
    private readonly updateGateway: LobbyUpdateGateway,
    // listens for client intents and delegates them to handlers
    private readonly clientIntentReceiver: LobbyClientIntentReceiver,
    private gameSimulatorHandoffStrategy: GameSimulatorHandoffStrategy
  ) {
    this.clientIntentReceiver.initialize(this);
  }

  // joinLobbyHandler()
  // leaveLobbyHandler()
  //
  // requestGameListHandler()
  //
  // createNewGameHandler()
  joinGameHandler(data: { gameName: string }) {
    //
  }
  // leaveGameHandler()
  //
  // createPartyHandler()
  // leavePartyHandler()
  //
  // createCharacterHandler()
  // deleteCharacterHandler()
  //
  // selectSavedCharacterHandler()
  // selectStartingFloorHandler()
  //
  // toggleReadyToStartGameHandler()
  //

  private intentHandlers: Partial<IntentHandlers> = {
    [ClientIntentType.RequestToJoinGame]: function (intent: { gameName: string }): void {
      throw new Error("Function not implemented.");
    },
    [ClientIntentType.RequestsGameList]: function (intent: never): void {
      throw new Error("Function not implemented.");
    },
    [ClientIntentType.CreateGame]: function (intent: {
      gameName: string;
      mode: GameMode;
      isRanked?: boolean;
    }): void {
      throw new Error("Function not implemented.");
    },
    [ClientIntentType.JoinGame]: (data): void => this.joinGameHandler(data),
    [ClientIntentType.LeaveGame]: function (intent: never): void {
      throw new Error("Function not implemented.");
    },
    [ClientIntentType.CreateParty]: function (intent: { partyName: string }): void {
      throw new Error("Function not implemented.");
    },
    [ClientIntentType.JoinParty]: function (intent: { partyName: string }): void {
      throw new Error("Function not implemented.");
    },
    [ClientIntentType.LeaveParty]: function (intent: never): void {
      throw new Error("Function not implemented.");
    },
    [ClientIntentType.ToggleReadyToStartGame]: function (intent: never): void {
      throw new Error("Function not implemented.");
    },
    [ClientIntentType.CreateCharacter]: function (intent: {
      name: string;
      combatantClass: CombatantClass;
    }): void {
      throw new Error("Function not implemented.");
    },
    [ClientIntentType.DeleteCharacter]: function (intent: { characterId: string }): void {
      throw new Error("Function not implemented.");
    },
    [ClientIntentType.GetSavedCharactersList]: function (intent: never): void {
      throw new Error("Function not implemented.");
    },
    [ClientIntentType.GetSavedCharacterById]: function (intent: { entityId: string }): void {
      throw new Error("Function not implemented.");
    },
    [ClientIntentType.CreateSavedCharacter]: function (intent: {
      name: string;
      combatantClass: CombatantClass;
      slotNumber: number;
    }): void {
      throw new Error("Function not implemented.");
    },
    [ClientIntentType.DeleteSavedCharacter]: function (intent: { entityId: string }): void {
      throw new Error("Function not implemented.");
    },
    [ClientIntentType.SelectSavedCharacterForProgressGame]: function (intent: {
      entityId: string;
    }): void {
      throw new Error("Function not implemented.");
    },
    [ClientIntentType.SelectProgressionGameStartingFloor]: function (intent: {
      floor: number;
    }): void {
      throw new Error("Function not implemented.");
    },
  };

  handleIntent(clientIntent: ClientIntent) {
    const handlerOption = this.intentHandlers[clientIntent.type];
    if (handlerOption === undefined) {
      throw new Error("Lobby is not configured to handle this type of ClientIntent");
    }
    // a workaround is to use "as never" for some reason
    return handlerOption(clientIntent.data as never);
  }
}
