import { GameStateUpdate } from "../../../packets/game-state-updates.js";
import { UserSessionRegistry } from "../../sessions/user-session-registry.js";
import { UserSession } from "../../sessions/user-session.js";
import {
  ConnectionIdentityResolutionContext,
  IdentityProviderService,
} from "../../services/identity-provider.js";
import { ConnectionId } from "../../../aliases.js";
import { IdGenerator } from "../../../utility-classes/index.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { SessionLifecycleController } from "../../controllers/session-lifecycle.js";
import { GameRegistry } from "../../game-registry.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";
import { GameServerGameLifecycleController } from "./game-lifecycle/index.js";

export class GameServerSessionLifecycleController
  implements SessionLifecycleController<GameStateUpdate>
{
  constructor(
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly gameRegistry: GameRegistry,
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    private readonly identityProviderService: IdentityProviderService,
    private readonly gameLifecycleController: GameServerGameLifecycleController,
    private readonly idGenerator: IdGenerator
  ) {}

  async createSession(
    connectionId: ConnectionId,
    context: ConnectionIdentityResolutionContext
  ): Promise<UserSession> {
    const sessionClaimTokenOption = context.gameServerSessionClaimToken;
    if (sessionClaimTokenOption === undefined) {
      throw new Error("No token was provided when attempting to join the game server");
    }

    // @TODO - decrypt and validate the token
    const token = sessionClaimTokenOption;

    // @TODO - record the nonce as used

    // it is possible to be given a reconnection token in two separate browser tabs
    // while the disconnection record is live in the central store, and there would be
    // undefined behavior if a user tried to claim a session while already in a game
    if (this.userSessionRegistry.userIsAlreadyConnected(sessionClaimTokenOption.taggedUserId.id)) {
      throw new Error("Only one connection per user is permitted on a single game server");
    }

    const newSession = new UserSession(
      token.username,
      connectionId,
      token.taggedUserId,
      this.gameRegistry
    );
    return newSession;
  }

  async activateSession(session: UserSession): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    this.userSessionRegistry.register(session);
    return outbox;
  }

  async cleanupSession(session: UserSession) {
    const outbox = new MessageDispatchOutbox(this.updateDispatchFactory);
    this.userSessionRegistry.unregister(session.connectionId);
    return outbox;
  }
}
