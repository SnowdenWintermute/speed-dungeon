import { CombatantId, GameId, IdentityProviderId, Username } from "../../aliases.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { GameRegistry } from "../game-registry.js";
import { UserGameDataPersistenceService } from "../services/user-game-data-persistence/index.js";
import { SavedIronmanRun } from "../services/user-game-data-persistence/saved-ironman-runs.js";
import { UserSessionRegistry } from "../sessions/user-session-registry.js";
import { UserSession } from "../sessions/user-session.js";
import { MessageDispatchFactory } from "../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../update-delivery/outbox.js";

export class IronmanRunController {
  constructor(
    protected userGameDataPersistenceService: UserGameDataPersistenceService,
    protected gameRegistry: GameRegistry,
    protected userSessionRegistry: UserSessionRegistry,
    protected messageDispatchFactory: MessageDispatchFactory<GameStateUpdate>
  ) {}

  async saveRun(game: SpeedDungeonGame) {
    const sessionsInGame = this.userSessionRegistry.getAllSessionsInGame(game);
    await this.userGameDataPersistenceService.saveIronmanRun(game, sessionsInGame);
  }

  async loadRun(runId: GameId, session: UserSession) {
    const serialized = await this.userGameDataPersistenceService.requireIronmanRun(runId);
    const run = SavedIronmanRun.fromSerialized(serialized);
    if (!run.containsPlayerControlledByUser(session)) {
      throw new Error(ERROR_MESSAGES.GAME_SETUP.PLAYER_NOT_IN_CONTINUED_GAME);
    }

    run.game.markAsContinuedRun();
    run.game.timeHandedOff = null;

    for (const [username, player] of run.game.players) {
      player.awaitingControllingUserConnection = true;
    }

    return run;
  }

  // for leaving a lobby game setup
  async leaveRunSetup(runId: GameId, session: UserSession) {
    // - if not a continued run setup, remove their characters
    // - else, mark their player as "awaitingControllingUserConnection"
  }

  // for leaving the run from game server
  async leaveLiveRun(runId: GameId, session: UserSession) {
    const game = this.gameRegistry.requireGame(runId);
    const sessionsInGame = this.userSessionRegistry.getAllSessionsInGame(game);
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.messageDispatchFactory);
    for (const session of sessionsInGame) {
      //   .disconnect and send back to lobby other users with message "a teammate disconnected, game closed"
    }

    //   .save the run
    await this.saveRun(game);
  }

  // from lobby
  async abandonRun(runId: GameId, userId: IdentityProviderId) {
    //   .remove the player
    //   .if no players remain, delete the saved run record
    //   .else update their owned characters to be owned by the next most recently
    //    joined player (need to record join order on players then)
  }

  transferCharacterOwnership(
    gameId: GameId,
    characterId: CombatantId,
    from: Username,
    to: Username
  ) {
    const game = this.gameRegistry.requireGame(gameId);
    // @TODO - ask if the implementation is good
    game.transferCharacterOwnership(characterId, from, to);
  }
}
