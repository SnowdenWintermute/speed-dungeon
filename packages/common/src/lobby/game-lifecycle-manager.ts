import {
  ActionValidity,
  AdventuringParty,
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
import { PartySetupManager } from "./party-setup-manager.js";
import { SessionAuthorizationManager } from "./session-authorization-manager.js";
import { UserSessionRegistry } from "./user-session-registry.js";
import { UserSession } from "./user-session.js";

export class GameLifecycleManager {
  constructor(
    private readonly lobbyState: LobbyState,
    private readonly updateGateway: GameStateUpdateGateway,
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly sessionAuthManager: SessionAuthorizationManager,
    private readonly partySetupManager: PartySetupManager,
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

  async createGameHandler(
    data: { gameName: string; mode: GameMode; isRanked?: boolean },
    session: UserSession
  ) {
    const { mode, isRanked } = data;
    let { gameName } = data;

    const userCanJoinNewGame = session.canJoinNewGame(isRanked);
    if (!userCanJoinNewGame.isValid) {
      throw new Error(userCanJoinNewGame.reason);
    }

    const gameNameValidity = this.getGameNameValidity(gameName);
    if (!gameNameValidity.isValid) {
      throw new Error(gameNameValidity.reason);
    }

    if (gameName === "") {
      // get a random game name and make it check if this exists
      // and try again a safe number of times before failing
      const maxAttempts = 10;
      for (let attemptIndex = 0; attemptIndex < maxAttempts; attemptIndex += 1) {
        gameName = this.generateRandomGameName();
        const noGameExistsByThisName = this.lobbyState.getGameOption(gameName) === undefined;
        if (noGameExistsByThisName) {
          break;
        }
      }
    }

    const gameByThisNameExists = this.lobbyState.getGameOption(gameName) !== undefined;
    if (gameByThisNameExists) {
      throw new Error(ERROR_MESSAGES.LOBBY.GAME_EXISTS);
    }

    let game: SpeedDungeonGame;

    if (mode === GameMode.Progression) {
      game = await this.createProgressionGameHandler(gameName, session);
    } else {
      game = new SpeedDungeonGame(
        this.idGenerator.generate(),
        gameName,
        GameMode.Race,
        session.username,
        isRanked
      );
    }

    this.lobbyState.addGame(game);
    this.joinGameHandler(gameName, session);
  }

  async createProgressionGameHandler(gameName: string, session: UserSession) {
    // we don't want them loading the same saved character into multiple active games,
    // so we'll prohibit simultaneous progression games per user
    const userSessions = this.userSessionRegistry.getExpectedUserSessions(session.username);

    for (const otherSession of userSessions) {
      if (otherSession.isInGame()) {
        throw new Error(ERROR_MESSAGES.LOBBY.USER_IN_GAME);
      }
    }

    await this.sessionAuthManager.requireAuthorizedSession(session.connectionId);

    const game = new SpeedDungeonGame(
      this.idGenerator.generate(),
      gameName,
      GameMode.Progression,
      session.username
    );

    // unlike race games, progression games have only a single, automatically generated
    // adventuring party
    const defaultPartyName = PartySetupManager.getProgressionGamePartyName(game.name);

    game.adventuringParties[defaultPartyName] = AdventuringParty.createInitialized(
      this.idGenerator.generate(),
      defaultPartyName
    );

    return game;
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
      await this.sessionAuthManager.requireAuthorizedSession(session.connectionId);
    }

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

    // handle automatic party joining and character selection
    if (game.mode === GameMode.Progression) {
      this.partySetupManager.joinProgressionGamePartyWithDefaultCharacterHandler(session, game);
    }
  }
}
