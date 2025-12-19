import {
  ClientIntent,
  ERROR_MESSAGES,
  GAME_CHANNEL_PREFIX,
  GameMode,
  MAX_GAME_NAME_LENGTH,
  RANDOM_GAME_NAMES_FIRST,
  RANDOM_GAME_NAMES_LAST,
  SpeedDungeonGame,
} from "../index.js";
import { GameStateUpdate } from "../packets/game-state-updates";
import { createLobbyClientIntentHandlers } from "./create-lobby-client-intent-handlers.js";
import { LobbyClientIntentReceiver } from "./lobby-intent-receiver.js";
import { LobbyUser } from "./lobby-user.js";

export * from "./random-game-names.js";

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
  private users: Record<Username, LobbyUser> = {};

  addUser(user: LobbyUser) {}
  removeUser(username: Username) {}
  getUserOption(username: Username) {
    return this.users[username];
  }

  addGame(game: SpeedDungeonGame) {}
  removeGame(gameName: GameName) {}
  getGameOption(gameName: GameName) {
    return this.games[gameName];
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

  private generateRandomGameName() {
    const firstName =
      RANDOM_GAME_NAMES_FIRST[Math.floor(Math.random() * RANDOM_GAME_NAMES_FIRST.length)];
    const lastName =
      RANDOM_GAME_NAMES_LAST[Math.floor(Math.random() * RANDOM_GAME_NAMES_LAST.length)];
    return `${firstName} ${lastName}`;
  }

  createGameHandler(
    data: { gameName: string; mode: GameMode; isRanked?: boolean },
    user: LobbyUser
  ) {
    const { mode, isRanked } = data;
    let { gameName } = data;

    if (user.currentGameName !== null) {
      throw new Error(ERROR_MESSAGES.LOBBY.ALREADY_IN_GAME);
    }

    const userIsGuest = user.userId === null;
    if (isRanked && userIsGuest) {
      throw new Error(ERROR_MESSAGES.AUTH.REQUIRED);
    }

    if (gameName.length > MAX_GAME_NAME_LENGTH) {
      throw new Error(`Game names may be no longer than ${MAX_GAME_NAME_LENGTH} characters`);
    }

    const gameNamePrefix = gameName.slice(0, GAME_CHANNEL_PREFIX.length - 1);
    if (gameNamePrefix === GAME_CHANNEL_PREFIX) {
      throw new Error(`Game name must not start with "${GAME_CHANNEL_PREFIX}"`);
    }

    if (gameName === "") {
      // @TODO - make it check if this exists and try again a safe number of times before failing
      gameName = this.generateRandomGameName();
    }

    const gameByThisNameExists = this.state.getGameOption(gameName) !== undefined;
    if (gameByThisNameExists) {
      throw new Error(ERROR_MESSAGES.LOBBY.GAME_EXISTS);
    }

    if (mode === GameMode.Progression) {
      // await createProgressionGameHandler(gameServer, session, socket, gameName);
    } else {
      // const game = new SpeedDungeonGame(
      //   idGenerator.generate(),
      //   gameName,
      //   GameMode.Race,
      //   session.username,
      //   isRanked
      // );
      // gameServer.games.insert(gameName, game);
      // joinGameHandler(gameName, session, socket);
    }
  }

  private intentHandlers = createLobbyClientIntentHandlers(this);

  handleIntent(clientIntent: ClientIntent, fromUser: LobbyUser) {
    const handlerOption = this.intentHandlers[clientIntent.type];
    if (handlerOption === undefined) {
      throw new Error("Lobby is not configured to handle this type of ClientIntent");
    }
    // a workaround is to use "as never" for some reason
    return handlerOption(clientIntent.data as never, fromUser);
  }
}
