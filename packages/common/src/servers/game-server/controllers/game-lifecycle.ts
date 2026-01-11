import { GameName } from "../../../aliases.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../packets/game-state-updates.js";
import { GameLifecycleController } from "../../controllers/game-lifecycle.js";
import { GameRegistry } from "../../game-registry.js";
import { GameSessionStoreService } from "../../services/game-session-store/index.js";
import { ActiveGameStatus } from "../../services/game-session-store/active-game-status.js";
import { UserSession } from "../../sessions/user-session.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { UserSessionRegistry } from "../../sessions/user-session-registry.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { getPartyChannelName } from "../../../packets/channels.js";

export class GameServerGameLifecycleController implements GameLifecycleController {
  constructor(
    private readonly gameRegistry: GameRegistry,
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly gameSessionStoreService: GameSessionStoreService,
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>
  ) {}

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

    // give the client the game information of the game they joined
    // if they reconnected their client would not have the game information
    // from when they were in the lobby
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.GameFullUpdate,
      data: { game: game.getSerialized() },
    });

    // tell clients already in the game that someone joined
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

    // - if all Players in Game have a corresponding expected UserSession
    const allPlayersAreConnectedToGame = this.allPlayersAreConnectedToGame(game);

    if (!allPlayersAreConnectedToGame) {
      return outbox;
    }

    const gameHasNotYetStarted = game.timeStarted === null;
    //   - if the game has not yet started
    if (gameHasNotYetStarted) {
      // @TODO
      //     - handle any game mode specific onStart business
      //     - start accepting player inputs
      //     - start a heartbeat loop to periodically update the ActiveGame record's lastHeartbeatTimestamp
      //       in the central store
      //
      // FROM OLD GAME SERVER CODE WHEN STARTING GAME:
      // game.timeStarted = Date.now();
      // const gameModeContext = gameServer.gameModeContexts[game.mode];
      // await gameModeContext.onGameStart(game);
      // gameServer.io
      //   .of("/")
      //   .in(game.getChannelName())
      //   .emit(ServerToClientEvent.GameStarted, game.timeStarted);
      // for (const [_, player] of Array.from(game.players)) {
      //   const socketIdResult = gameServer.getSocketIdOfPlayer(game, player.username);
      //   if (socketIdResult instanceof Error) return socketIdResult;
      //   if (!player.partyName) throw new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);
      //   const partyOption = game.adventuringParties[player.partyName];
      //   if (!partyOption) throw new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
      //   toggleReadyToExploreHandler(undefined, { game, partyOption, player, session });
    } else {
      // @TODO
      //   - if the game was in progress
      //     - this was a reconnection for a disconnected user
      //     - delete the disconnection session from the central store
      //     - unpause acceptance of player inputs
    }

    return outbox;
  }

  private allPlayersAreConnectedToGame(game: SpeedDungeonGame) {
    let result = true;
    for (const [username, player] of Array.from(game.players)) {
      const connectionIds = this.userSessionRegistry.getConnectionIdsByUsername(username);
      if (connectionIds.size === 0) {
        result = false;
        break;
      }
    }

    return result;
  }

  async leaveGameHandler(session: UserSession) {
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    return outbox;
  }
}
