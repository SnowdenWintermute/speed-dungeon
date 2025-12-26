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
} from "../../index.js";
import { GameStateUpdateType } from "../../packets/game-state-updates.js";
import { GameSimulatorHandoffStrategy } from "../game-simulator-handoff-strategy.js";
import { LobbyState } from "../lobby-state.js";
import { PartySetupController } from "./party-setup.js";
import { RANDOM_GAME_NAMES_FIRST, RANDOM_GAME_NAMES_LAST } from "./default-naming/games.js";
import { GameStateUpdateDispatchFactory } from "../update-delivery/game-state-update-dispatch-factory.js";
import { GameStateUpdateDispatchOutbox } from "../update-delivery/update-dispatch-outbox.js";
import { UserSessionRegistry } from "../sessions/user-session-registry.js";
import { SessionAuthorizationManager } from "../sessions/authorization-manager.js";
import { UserSession } from "../sessions/user-session.js";

export class GameLifecycleController {
  constructor(
    private readonly lobbyState: LobbyState,
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly sessionAuthManager: SessionAuthorizationManager,
    private readonly updateDispatchFactory: GameStateUpdateDispatchFactory,
    private readonly partySetupController: PartySetupController,
    private readonly idGenerator: IdGenerator,
    private readonly gameSimulatorHandoffStrategy: GameSimulatorHandoffStrategy
  ) {}

  private generateRandomGameName(): GameName {
    const firstName =
      RANDOM_GAME_NAMES_FIRST[Math.floor(Math.random() * RANDOM_GAME_NAMES_FIRST.length)];
    const lastName =
      RANDOM_GAME_NAMES_LAST[Math.floor(Math.random() * RANDOM_GAME_NAMES_LAST.length)];
    return `${firstName} ${lastName}` as GameName;
  }

  private getGameNameValidity(gameName: GameName): ActionValidity {
    if (gameName.length > MAX_GAME_NAME_LENGTH) {
      return new ActionValidity(
        false,
        `Game names may be no longer than ${MAX_GAME_NAME_LENGTH} characters`
      );
    }

    const gameNamePrefix = gameName.slice(0, GAME_CHANNEL_PREFIX.length);
    if (gameNamePrefix === GAME_CHANNEL_PREFIX) {
      return new ActionValidity(false, `Game names may be not begin with "${GAME_CHANNEL_PREFIX}"`);
    }

    return new ActionValidity(true);
  }

  requestGameListHandler(session: UserSession) {
    const gameList = this.lobbyState.getGamesList();

    const outbox = new GameStateUpdateDispatchOutbox(this.updateDispatchFactory);
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.GameList,
      data: { gameList },
    });

    return outbox;
  }

  async createGameHandler(
    data: { gameName: GameName; mode: GameMode; isRanked?: boolean },
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
    const joinGameUpdateHandlerOutbox = await this.joinGameHandler(gameName, session);
    return joinGameUpdateHandlerOutbox;
  }

  async createProgressionGameHandler(gameName: GameName, session: UserSession) {
    session.requireNotInGameOnAnotherSession(this.userSessionRegistry);

    await this.sessionAuthManager.requireAuthorizedSession(session.connectionId);

    const game = new SpeedDungeonGame(
      this.idGenerator.generate(),
      gameName,
      GameMode.Progression,
      session.username
    );

    // unlike race games, progression games have only a single, automatically generated
    // adventuring party
    const defaultPartyName = PartySetupController.getProgressionGamePartyName(game.name);

    game.adventuringParties[defaultPartyName] = AdventuringParty.createInitialized(
      this.idGenerator.generate(),
      defaultPartyName
    );

    return game;
  }

  async joinGameHandler(gameName: GameName, session: UserSession) {
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
      session.requireNotInGameOnAnotherSession(this.userSessionRegistry);
      await this.sessionAuthManager.requireAuthorizedSession(session.connectionId);
    }

    session.joinGame(game);
    session.unsubscribeFromChannel(LOBBY_CHANNEL);
    session.subscribeToChannel(game.getChannelName());

    // update the lobby's user list for when players ask for the list of users in lobby
    this.lobbyState.removeUser(session.username);

    const outbox = new GameStateUpdateDispatchOutbox(this.updateDispatchFactory);
    // tell the clients in the lobby that the user left the lobby channel
    outbox.pushToChannel(LOBBY_CHANNEL, {
      type: GameStateUpdateType.UserLeftChannel,
      data: { username: session.username },
    });

    // give the client the game information of the game they joined
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.GameFullUpdate,
      data: { game: game.getSerialized() },
    });

    // tell clients already in the game that someone joined
    outbox.pushToChannel(
      game.getChannelName(),
      {
        type: GameStateUpdateType.PlayerJoinedGame,
        data: { username: session.username },
      },
      { excludedIds: [session.connectionId] }
    );

    // handle automatic party joining and character selection
    if (game.mode === GameMode.Progression) {
      const otherOutbox =
        await this.partySetupController.joinProgressionGamePartyWithDefaultCharacterHandler(
          session,
          game
        );
      outbox.pushFromOther(otherOutbox);
    }

    return outbox;
  }

  leaveGameHandler(session: UserSession) {
    const game = session.getExpectedCurrentGame(this.lobbyState);
    const partyOption = session.getCurrentPartyOption(game);

    const outbox = new GameStateUpdateDispatchOutbox(this.updateDispatchFactory);

    if (partyOption !== null) {
      const otherOutbox = this.partySetupController.leavePartyHandler(session);
      outbox.pushFromOther(otherOutbox);
    }

    game.removePlayer(session.username);
    session.currentGameName = null;
    session.unsubscribeFromChannel(game.getChannelName());

    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.GameFullUpdate,
      data: { game: null },
    });

    session.subscribeToChannel(LOBBY_CHANNEL);

    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.ChannelFullUpdate,
      data: { channelName: LOBBY_CHANNEL, users: this.lobbyState.getUsersList() },
    });

    const noPlayersRemain = Object.keys(game.players).length === 0;
    if (noPlayersRemain) {
      this.lobbyState.removeGame(game.name);

      return outbox; // no one is left to notify about the player leaving so return early
    }

    game.setMaxStartingFloor();

    outbox.pushToChannel(game.getChannelName(), {
      type: GameStateUpdateType.PlayerLeftGame,
      data: { username: session.username },
    });

    return outbox;
  }

  async toggleReadyToStartGameHandler(session: UserSession) {
    const game = session.getExpectedCurrentGame(this.lobbyState);

    game.requireGameStartPrerequisites();

    const player = game.getExpectedPlayer(session.username);
    // this should implicitly check for empty parties since a player with a character
    // must be in a party, and a party can only exist while at least one player is in it
    player.requireHasCharacters();

    const allPlayersReadied = game.togglePlayerReadyToStartGameStatus(session.username);

    const outbox = new GameStateUpdateDispatchOutbox(this.updateDispatchFactory);
    outbox.pushToChannel(game.getChannelName(), {
      type: GameStateUpdateType.PlayerToggledReadyToStartGame,
      data: { username: session.username },
    });

    const notAllPlayersAreReady = !allPlayersReadied;
    if (notAllPlayersAreReady) {
      return outbox;
    }

    game.setAsStarted();

    const connectionInstructions = this.gameSimulatorHandoffStrategy.handoff(game);

    outbox.pushToChannel(game.getChannelName(), {
      type: GameStateUpdateType.GameSimulatorConnectionInstructions,
      data: { connectionInstructions },
    });

    return outbox;
  }
}
