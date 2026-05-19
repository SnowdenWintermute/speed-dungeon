import { CombatantId, GameId, IdentityProviderId, Username } from "../../aliases.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { GameRegistry } from "../game-registry.js";
import { UserGameDataPersistenceService } from "../services/user-game-data-persistence/index.js";
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

  // for leaving the run from game server, could move to persistence game policy
  async leaveLiveRun(runId: GameId, session: UserSession) {
    const game = this.gameRegistry.requireGame(runId);
    const sessionsInGame = this.userSessionRegistry.getAllSessionsInGame(game);
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.messageDispatchFactory);
    for (const session of sessionsInGame) {
      //   .disconnect and send back to lobby other users with message "a teammate disconnected, game closed"
    }

    //   .save the run
    await this.userGameDataPersistenceService.saveIronmanRun(
      game,
      this.userSessionRegistry.getAllSessionsInGame(game)
    );
  }

  // from lobby, need bespoke ClientIntent and handler
  async abandonRun(runId: GameId, userId: IdentityProviderId) {
    //   .remove the player
    //   .if no players remain, delete the saved run record
    //   .else update their owned characters to be owned by the next most recently
    //    joined player (need to record join order on players then)
    //   .remove the reference to the run in their user Profile
  }

  // from lobby, need bespoke ClientIntent and handler
  // or automatically done on run abandonment
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
