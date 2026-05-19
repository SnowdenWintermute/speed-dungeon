import { CombatantId, GameId, IdentityProviderId, Username } from "../../aliases.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { GameRegistry } from "../game-registry.js";
import { UserGameDataPersistenceService } from "../services/user-game-data-persistence/index.js";
import { UserSessionRegistry } from "../sessions/user-session-registry.js";
import { MessageDispatchFactory } from "../update-delivery/message-dispatch-factory.js";

export class IronmanRunController {
  constructor(
    protected userGameDataPersistenceService: UserGameDataPersistenceService,
    protected gameRegistry: GameRegistry,
    protected userSessionRegistry: UserSessionRegistry,
    protected messageDispatchFactory: MessageDispatchFactory<GameStateUpdate>
  ) {}

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
