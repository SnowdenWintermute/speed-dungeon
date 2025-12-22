import {
  ActionValidity,
  ERROR_MESSAGES,
  GAME_CHANNEL_PREFIX,
  GameMode,
  GameName,
  IdGenerator,
  LOBBY_CHANNEL,
  MAX_GAME_NAME_LENGTH,
  SpeedDungeonGame,
} from "../index.js";
import { GameStateUpdateType } from "../packets/game-state-updates.js";
import { GameStateUpdateGateway } from "./game-state-update-gateway.js";
import { RANDOM_GAME_NAMES_FIRST, RANDOM_GAME_NAMES_LAST } from "./index.js";
import { LobbyState } from "./lobby-state.js";
import { UserSessionRegistry } from "./user-session-registry.js";
import { UserSession } from "./user-session.js";

export class GameLifecycleManager {
  constructor(
    private readonly lobbyState: LobbyState,
    private readonly updateGateway: GameStateUpdateGateway,
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly idGenerator: IdGenerator
  ) {}

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
      return new ActionValidity(false, `Game names may be not begin with "${GAME_CHANNEL_PREFIX}"`);
    }

    return new ActionValidity(true);
  }

  createGameHandler(
    data: { gameName: string; mode: GameMode; isRanked?: boolean },
    user: UserSession
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

  async joinGameHandler(gameName: string, session: UserSession) {
    const game = this.lobbyState.getExpectedGame(gameName);

    const userCanJoinNewGame = session.canJoinNewGame(game.isRanked);
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
      session.joinGame(game);

      session.unsubscribeFromChannel(LOBBY_CHANNEL);
      session.subscribeToChannel(game.getChannelName());

      // update the lobby's user list for when players ask for the list of users in lobby
      this.lobbyState.removeUser(session.username);

      // tell the clients in the lobby that the user left the lobby channel
      this.updateGateway.submitToConnections(this.userSessionRegistry.in(LOBBY_CHANNEL), {
        type: GameStateUpdateType.UserLeftChannel,
        data: { username: session.username },
      });

      // give the client the game information of the game they joined
      this.updateGateway.submitToConnection(session.connectionId, {
        type: GameStateUpdateType.GameFullUpdate,
        data: { game: game.getSerialized() },
      });

      // tell clients already in the game that someone joined
      this.updateGateway.submitToConnections(
        this.userSessionRegistry.in(game.name, { excludedIds: [session.connectionId] }),
        {
          type: GameStateUpdateType.PlayerJoinedGame,
          data: { username: session.username },
        }
      );
    }
  }
}
