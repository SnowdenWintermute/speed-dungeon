import { GameName } from "../../../../aliases.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../../packets/game-state-updates.js";
import { GameLifecycleController } from "../../../controllers/game-lifecycle.js";
import { GameRegistry } from "../../../game-registry.js";
import { GameSessionStoreService } from "../../../services/game-session-store/index.js";
import { ActiveGameStatus } from "../../../services/game-session-store/active-game-status.js";
import { UserSession } from "../../../sessions/user-session.js";
import { MessageDispatchOutbox } from "../../../update-delivery/outbox.js";
import { SpeedDungeonGame } from "../../../../game/index.js";
import { UserSessionRegistry } from "../../../sessions/user-session-registry.js";
import { MessageDispatchFactory } from "../../../update-delivery/message-dispatch-factory.js";
import { getPartyChannelName } from "../../../../packets/channels.js";
import { GameMode } from "../../../../types.js";
import { GameModeContext } from "./game-mode-context.js";
import { RaceGameRecordsService } from "../../../services/race-game-records.js";
import { SavedCharactersService } from "../../../services/saved-characters.js";
import { RankedLadderService } from "../../../services/ranked-ladder.js";
import { HeartbeatScheduler, HeartbeatTask } from "../../../../primatives/heartbeat.js";
import { GAME_RECORD_HEARTBEAT_MS } from "../../index.js";

export class GameServerGameLifecycleController implements GameLifecycleController {
  // strategy pattern for handling certain events
  gameModeContexts: Record<GameMode, GameModeContext>;

  constructor(
    private readonly gameRegistry: GameRegistry,
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly heartbeatScheduler: HeartbeatScheduler,
    private readonly gameSessionStoreService: GameSessionStoreService,
    raceGameRecordsService: RaceGameRecordsService,
    savedCharactersLadderService: SavedCharactersService,
    rankedLadderService: RankedLadderService,
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>
  ) {
    this.gameModeContexts = {
      [GameMode.Race]: new GameModeContext(
        GameMode.Race,
        raceGameRecordsService,
        savedCharactersLadderService,
        rankedLadderService
      ),
      [GameMode.Progression]: new GameModeContext(
        GameMode.Progression,
        raceGameRecordsService,
        savedCharactersLadderService,
        rankedLadderService
      ),
    };
  }

  async initializeExpectedPendingGame(gameName: GameName) {
    const pendingGameSetupOption = await this.gameSessionStoreService.getPendingGameSetup(gameName);
    if (pendingGameSetupOption === null) {
      throw new Error(
        "A user presented a token with a game id that didn't match any existing game or pending game setup."
      );
    }

    const newGame = SpeedDungeonGame.getDeserialized(pendingGameSetupOption.game);
    this.gameRegistry.registerGame(newGame);
    this.gameSessionStoreService.deletePendingGameSetup(newGame.name);

    this.gameSessionStoreService.writeActiveGameStatus(
      newGame.name,
      new ActiveGameStatus(newGame.name, newGame.id)
    );

    const heartbeat = new HeartbeatTask(GAME_RECORD_HEARTBEAT_MS, () => {
      // currently overwrites but could just update - this is simpler for now
      this.gameSessionStoreService.writeActiveGameStatus(
        newGame.name,
        new ActiveGameStatus(newGame.name, newGame.id)
      );
    });

    this.heartbeatScheduler.register(heartbeat);

    return newGame;
  }

  async joinGameHandler(gameName: GameName, session: UserSession) {
    const game = this.gameRegistry.requireGame(gameName);
    session.joinGame(game);
    session.subscribeToChannel(game.getChannelName());

    const player = game.getExpectedPlayer(session.username);
    const party = game.getExpectedParty(player.getExpectedPartyName());
    session.subscribeToChannel(getPartyChannelName(game.name, party.name));

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);

    // if they are reconnecting their client would have lost the game information
    // could avoid sending it if this is a connection from the lobby though
    // for simplicity we'll eat the performance cost until it is measured
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.GameFullUpdate,
      data: { game: game.getSerialized() },
    });

    // clients should handle this differently than in the lobby
    // and just mark this player as connected in their client
    outbox.pushToChannel(
      game.getChannelName(),
      {
        type: GameStateUpdateType.PlayerJoinedGame,
        data: { username: session.username },
      },
      { excludedIds: [session.connectionId] }
    );

    const allPlayersAreConnectedToGame = this.allPlayersAreConnectedToGame(game);
    const gameHasNotYetStarted = game.timeStarted === null;

    if (gameHasNotYetStarted && allPlayersAreConnectedToGame) {
      const startGameOutbox = await this.startGame(game);
      outbox.pushFromOther(startGameOutbox);
    }

    if (allPlayersAreConnectedToGame) {
      game.inputLock.unlockInput(); // @TODO - check this lock when players submit inputs
      outbox.pushToChannel(game.getChannelName(), {
        type: GameStateUpdateType.GameInputLockUpdate,
        data: { isLocked: false },
      });
    }

    return outbox;
  }

  private async startGame(game: SpeedDungeonGame) {
    const gameModeContext = this.gameModeContexts[game.mode];
    await gameModeContext.strategy.onGameStart(game);

    game.timeStarted = Date.now();

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToChannel(game.getChannelName(), {
      type: GameStateUpdateType.GameStarted,
      data: { timeStarted: game.timeStarted },
    });

    return outbox;
    // - we used to run the "explore next room" handler or otherwise put the parties in their first room
    //   but hopefully we don't need to do this anymore since adventuring party starts in empty room by default
  }

  private allPlayersAreConnectedToGame(game: SpeedDungeonGame) {
    let result = true;
    for (const [username, player] of Array.from(game.players)) {
      const sessions = this.userSessionRegistry.getSessionsByUsername(username);
      if (sessions.length === 0) {
        result = false;
        break;
      }
    }

    return result;
  }

  async leaveGameHandler(session: UserSession) {
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    const game = session.getExpectedCurrentGame();

    let allPartiesWiped = false;
    for (const party of Object.values(game.adventuringParties)) {
      if (party.timeOfWipe === null) {
        allPartiesWiped = false;
        break;
      }
    }

    if (allPartiesWiped) {
      // - if there are no living parties in the game, clean up the game
    }
    return outbox;
  }
}
