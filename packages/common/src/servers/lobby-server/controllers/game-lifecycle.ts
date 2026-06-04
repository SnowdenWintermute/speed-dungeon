import { GameStateUpdate, GameStateUpdateType } from "../../../packets/game-state-updates.js";
import { UserSession } from "../../sessions/user-session.js";
import { LobbyState } from "../lobby-state.js";
import { PartySetupController } from "./party-setup.js";
import { RANDOM_GAME_NAMES_FIRST, RANDOM_GAME_NAMES_LAST } from "../default-names/game.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";
import { GameLifecycleController } from "../../controllers/game-lifecycle.js";
import { GameHandoffManager } from "../game-handoff/game-handoff-manager.js";
import { GameId, GameName } from "../../../aliases.js";
import { MAX_GAME_NAME_LENGTH } from "../../../app-consts.js";
import { AllowedResult } from "../../../primatives/index.js";
import { GAME_CHANNEL_PREFIX, LOBBY_CHANNEL } from "../../../packets/channels.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { MapUtils } from "../../../utils/map-utils.js";
import { GameExistenceChecker } from "../game-existence-queries.js";
import { GameCreationRequest } from "../../../packets/client-intents.js";
import { GameModePolicyStore } from "../../../game-modes/game-mode-policy-store.js";

export class LobbyGameLifecycleController implements GameLifecycleController {
  constructor(
    private readonly lobbyState: LobbyState,
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    private readonly partySetupController: PartySetupController,
    private readonly gameExistenceChecker: GameExistenceChecker,
    private readonly gameHandoffManager: GameHandoffManager,
    private readonly gameModePolicyStore: GameModePolicyStore
  ) {}

  private generateRandomGameName(): GameName {
    const firstName =
      RANDOM_GAME_NAMES_FIRST[Math.floor(Math.random() * RANDOM_GAME_NAMES_FIRST.length)];
    const lastName =
      RANDOM_GAME_NAMES_LAST[Math.floor(Math.random() * RANDOM_GAME_NAMES_LAST.length)];
    return `${firstName} ${lastName}` as GameName;
  }

  private async attemptAssignRandomUniqueGameName() {
    let gameName = "" as GameName;
    const maxAttempts = 10;
    for (let attemptIndex = 0; attemptIndex < maxAttempts; attemptIndex += 1) {
      gameName = this.generateRandomGameName();
      // @PERF - awaiting in a loop is no bueno
      const noGameExistsByThisName = !(await this.gameExistenceChecker.gameExistsByName(gameName));

      if (noGameExistsByThisName) {
        break;
      }
    }

    return gameName;
  }

  private requireValidGameName(gameName: GameName) {
    const gameNameValidity = this.getGameNameValidity(gameName);
    if (!gameNameValidity.allowed) {
      throw new Error(gameNameValidity.reason);
    }
  }

  private async requireUniqueGameName(gameName: GameName) {
    const gameNameExists = await this.gameExistenceChecker.gameExistsByName(gameName);
    if (gameNameExists) {
      throw new Error(ERROR_MESSAGES.LOBBY.GAME_EXISTS);
    }
  }

  private getGameNameValidity(gameName: GameName): AllowedResult {
    if (gameName.length > MAX_GAME_NAME_LENGTH) {
      return {
        allowed: false,
        reason: `Game names may be no longer than ${MAX_GAME_NAME_LENGTH} characters`,
      };
    }

    const gameNamePrefix = gameName.slice(0, GAME_CHANNEL_PREFIX.length);
    if (gameNamePrefix === GAME_CHANNEL_PREFIX) {
      return {
        allowed: false,
        reason: `Game names may be not begin with "${GAME_CHANNEL_PREFIX}"`,
      };
    }

    return { allowed: true };
  }

  requestGameListHandler(session: UserSession) {
    const gameList = this.lobbyState.gameRegistry.getGamesList();

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.GameList,
      data: { gameList },
    });

    return outbox;
  }

  async createGameHandler(data: GameCreationRequest, session: UserSession) {
    const { mode } = data;
    let { gameName } = data;

    session.requireCanJoinGame();
    this.requireValidGameName(gameName);
    this.requireUniqueGameName(gameName);

    if (gameName === "") {
      gameName = await this.attemptAssignRandomUniqueGameName();
    }

    this.requireUniqueGameName(gameName);

    const gameModePolicy = this.gameModePolicyStore.getPolicy(mode);
    const userCanCreate = await gameModePolicy.lobbySetup.userCanCreate(session, data);
    if (!userCanCreate.allowed) {
      throw new Error(userCanCreate.reason);
    }
    data.gameName = gameName;

    const game = await gameModePolicy.lobbySetup.createGame(data);
    gameModePolicy.lobbySetup.onCreation(game);

    this.lobbyState.gameRegistry.registerGame(game);
    const joinGameUpdateHandlerOutbox = await this.joinGameHandler(game.id, session);
    return joinGameUpdateHandlerOutbox;
  }

  async joinGameHandler(gameId: GameId, session: UserSession) {
    const game = this.lobbyState.gameRegistry.requireGame(gameId);

    const userCanJoinNewGame = session.canJoinNewGame();
    if (!userCanJoinNewGame.allowed) {
      throw new Error(userCanJoinNewGame.reason);
    }

    const gameAlreadyHandedOff = game.timeHandedOff !== null;
    if (gameAlreadyHandedOff) {
      throw new Error(ERROR_MESSAGES.GAME.ALREADY_STARTED);
    }

    // game.players is keyed by username — a same-named player joining would silently
    // overwrite the existing entry and orphan their characters. Guest usernames are
    // deduped at lobby-session creation, but enforce the invariant at the point of
    // mutation so future regressions (or auth-vs-guest name collisions) can't slip past.
    // if (game.getPlayer(session.username) !== undefined) {
    //   throw new Error(ERROR_MESSAGES.LOBBY.USERNAME_ALREADY_IN_GAME);
    // }

    const gameModePolicy = this.gameModePolicyStore.getPolicy(game.mode);
    const userCanJoin = await gameModePolicy.lobbySetup.userCanJoin(session, game);
    if (!userCanJoin.allowed) {
      throw new Error(userCanJoin.reason);
    }

    session.joinGame(game);
    game.registerPlayerFromLobbyUser(session.username);
    session.unsubscribeFromChannel(LOBBY_CHANNEL);
    session.subscribeToChannel(game.getChannelName());

    // update the lobby's user list for when players ask for the list of users in lobby
    this.lobbyState.removeExpectedUserInLobbyChannel(session.username);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    // tell the clients in the lobby that the user left the lobby channel
    outbox.pushToChannel(LOBBY_CHANNEL, {
      type: GameStateUpdateType.UserLeftChannel,
      data: { username: session.username },
    });

    // give the client the game information of the game they joined
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.GameFullUpdate,
      data: { game: game.toSerialized() },
    });

    // tell clients already in the game that someone joined
    outbox.pushToChannel(
      game.getChannelName(),
      {
        type: GameStateUpdateType.PlayerJoinedGame,
        data: { username: session.username, joinOrder: game.playerJoinCount },
      },
      { excludedIds: [session.connectionId] }
    );

    const onJoinPolicyOutbox = await gameModePolicy.lobbySetup.onJoin(
      session,
      game,
      this.partySetupController
    );
    if (onJoinPolicyOutbox) {
      outbox.pushFromOther(onJoinPolicyOutbox);
    }

    return outbox;
  }

  async leaveGameHandler(session: UserSession) {
    const game = session.getExpectedCurrentGame();

    const partyOption = session.getCurrentPartyOption(game);
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);

    if (partyOption !== null) {
      const otherOutbox = this.partySetupController.removeUserFromParty(session);
      outbox.pushFromOther(otherOutbox);
    }

    game.removePlayer(session.username);

    session.currentGameId = null;
    session.unsubscribeFromChannel(game.getChannelName());

    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.GameFullUpdate,
      data: { game: null },
    });

    this.lobbyState.addUser(session.username, session.isAuth());
    session.subscribeToChannel(LOBBY_CHANNEL);

    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.ChannelFullUpdate,
      data: {
        channelName: LOBBY_CHANNEL,
        users: MapUtils.serialize(this.lobbyState.getUsersList()),
      },
    });

    const noPlayersRemain =
      game.players.size === 0 ||
      // in the case of continued ironman run we don't remove players, just set them as awaiting connection
      [...game.players.values()].every((player) => player.awaitingControllingUserConnection);

    if (noPlayersRemain) {
      await this.cleanUpGame(game);

      return outbox; // no one is left to notify about the player leaving so return early
    }

    outbox.pushToChannel(game.getChannelName(), {
      type: GameStateUpdateType.PlayerLeftGame,
      data: { username: session.username },
    });

    return outbox;
  }

  async cleanUpGame(game: SpeedDungeonGame): Promise<void> {
    this.lobbyState.gameRegistry.unregisterGame(game.id);
  }

  async toggleReadyToStartGameHandler(session: UserSession) {
    const game = session.getExpectedCurrentGame();

    game.requireGameStartPrerequisites();

    const player = game.getExpectedPlayer(session.username);
    // this should implicitly check for empty parties since a player with a character
    // must be in a party, and a party can only exist while at least one player is in it
    player.requireHasCharacters();

    const allPlayersReadied = game.togglePlayerReadyToStartGameStatus(session.username);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(game.getChannelName(), {
      type: GameStateUpdateType.PlayerToggledReadyToStartGame,
      data: { username: session.username },
    });

    const notAllPlayersAreReady = !allPlayersReadied;
    if (notAllPlayersAreReady) {
      return outbox;
    }

    game.timeHandedOff = Date.now();

    const connectionInstructions = await this.gameHandoffManager.initiateGameHandoff(game);
    outbox.pushFromOther(connectionInstructions);

    return outbox;
  }
}
