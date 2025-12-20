import {
  ActionValidity,
  ClientIntent,
  ConnectionId,
  ERROR_MESSAGES,
  GAME_CHANNEL_PREFIX,
  GameMode,
  GameName,
  IdGenerator,
  MAX_GAME_NAME_LENGTH,
  RANDOM_GAME_NAMES_FIRST,
  RANDOM_GAME_NAMES_LAST,
  SpeedDungeonGame,
  Username,
} from "../index.js";
import { GameStateUpdate } from "../packets/game-state-updates";
import { createLobbyClientIntentHandlers } from "./create-lobby-client-intent-handlers.js";
import { LobbyClientIntentReceiver } from "./lobby-intent-receiver.js";
import { LobbyState } from "./lobby-state.js";
import { LobbyUser } from "./lobby-user.js";

export * from "./random-game-names.js";

interface TransportEndpoint {
  readonly id: ConnectionId;
  send(update: GameStateUpdate): void;
  close?(): void;
}

// either a LocalLobbyUpdateGateway which directly calls client's GameUpdateReceiver handlers for updates
// or a WebsocketLobbyUpdateGateway which emits socket.io events with the updates which the client's
// GameUpdateReceiver is listening for
export class LobbyUpdateGateway {
  // socket.io socket objects or local client transport endpoints
  transportEndpoints: Record<ConnectionId, TransportEndpoint> = {};
  // when we want to get a connection from a user name
  // we can use their connectionIds to look up which LobbyUser (associated browser tab) is
  // in some game or channel
  connectionIdsByUsername: Record<Username, ConnectionId[]> = {};
  // when getting a message from some connection id, find out which user it is coming from
  connections: Record<ConnectionId, LobbyUser> = {};
  submit(update: GameStateUpdate): void {}
}

// give the set up game to a GameSimulator either a locally owned GameSimulator
// on the client or send it over websockets to a GameServer which owns a GameSimulator
export interface GameSimulatorHandoffStrategy {
  handoff(game: SpeedDungeonGame): void;
}

// lives either inside a LobbyServer or locally on a ClientApp
export class Lobby {
  private readonly lobbyState = new LobbyState();

  constructor(
    private readonly updateGateway: LobbyUpdateGateway,
    // listens for client intents and delegates them to handlers
    private readonly clientIntentReceiver: LobbyClientIntentReceiver,
    private gameSimulatorHandoffStrategy: GameSimulatorHandoffStrategy,
    private idGenerator: IdGenerator
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

  private getGameNameValidity(gameName: GameName): ActionValidity {
    if (gameName.length > MAX_GAME_NAME_LENGTH) {
      return new ActionValidity(
        false,
        `Game names may be no longer than ${MAX_GAME_NAME_LENGTH} characters`
      );
    }

    const gameNamePrefix = gameName.slice(0, GAME_CHANNEL_PREFIX.length - 1);
    if (gameNamePrefix === GAME_CHANNEL_PREFIX) {
      return new ActionValidity(
        false,
        `Game names may be no longer than ${MAX_GAME_NAME_LENGTH} characters`
      );
    }

    return new ActionValidity(true);
  }

  joinLobbyHandler(username: string, userId: number | null, connectionId: string) {
    console.info(
      `-- ${username} (user id: ${userId}, connection id: ${connectionId}) joined the lobby`
    );

    // add the user to the lobby state
    this.lobbyState.addUser(new LobbyUser(username, connectionId, userId));

    // manage the user's update subscription
    // if (this.socketIdsByUsername.has(username)) {
    //   const currentSockets = this.socketIdsByUsername.get(username)!;
    //   currentSockets.push(socket.id);
    // } else {
    // this.socketIdsByUsername.insert(username, [socket.id]);
    // }

    // this.joinSocketToChannel(socket.id, LOBBY_CHANNEL);
    // socket.emit(ServerToClientEvent.ClientUsername, username);

    // const loggedInUserResult = await getLoggedInUserFromSocket(socket);
    // if (!(loggedInUserResult instanceof Error)) {
    //   fetchSavedCharactersHandler(undefined, loggedInUserResult, socket);
    // }
  }

  createGameHandler(
    data: { gameName: string; mode: GameMode; isRanked?: boolean },
    user: LobbyUser
  ) {
    const { mode, isRanked } = data;
    let { gameName } = data;

    const userCanJoinNewGame = user.canJoinNewGame(isRanked);
    if (!userCanJoinNewGame.isValid) {
      throw new Error(userCanJoinNewGame.reason);
    }

    const gameNameValidity = this.getGameNameValidity(gameName);
    if (!gameNameValidity.isValid) {
      throw new Error(gameNameValidity.reason);
    }

    if (gameName === "") {
      // @TODO - make it check if this exists and try again a safe number of times before failing
      gameName = this.generateRandomGameName();
    }

    const gameByThisNameExists = this.lobbyState.getGameOption(gameName) !== undefined;
    if (gameByThisNameExists) {
      throw new Error(ERROR_MESSAGES.LOBBY.GAME_EXISTS);
    }

    if (mode === GameMode.Progression) {
      // await createProgressionGameHandler(gameServer, session, socket, gameName);
    } else {
      const game = new SpeedDungeonGame(
        this.idGenerator.generate(),
        gameName,
        GameMode.Race,
        user.username,
        isRanked
      );
      this.lobbyState.addGame(game);
      this.joinGameHandler(gameName, user);
    }
  }

  async joinGameHandler(gameName: string, user: LobbyUser) {
    const game = this.lobbyState.getExpectedGame(gameName);

    const userCanJoinNewGame = user.canJoinNewGame(game.isRanked);
    if (!userCanJoinNewGame.isValid) {
      throw new Error(userCanJoinNewGame.reason);
    }

    const gameAlreadyStarted = game.timeStarted !== null;
    if (gameAlreadyStarted) {
      throw new Error(ERROR_MESSAGES.LOBBY.GAME_ALREADY_STARTED);
    }

    if (game.mode === GameMode.Progression) {
      // joinProgressionGameHandler(gameServer, session, socket, game);
    } else {
      user.joinGame(game);

      // update the LobbyUpdateGateway's record of which update channels
      // the user should be a part of
      //
      // send updates via the LobbyUpdateGateway to interested users
      //

      // for (const channelName of session.channels) {
      //   gameServer.removeSocketFromChannel(socket.id, channelName);
      // }

      // gameServer.joinSocketToChannel(socket.id, game.name);

      // socket.emit(ServerToClientEvent.GameFullUpdate, game.getSerialized());

      // gameServer.io
      //   .of("/")
      //   .except(socket.id)
      //   .in(game.name)
      //   .emit(ServerToClientEvent.PlayerJoinedGame, session.username);
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
