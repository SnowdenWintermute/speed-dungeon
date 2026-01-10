import { SpeedDungeonGame } from "../../game/index.js";
import { BasicRandomNumberGenerator } from "../../utility-classes/randomizers.js";
import { UserSessionRegistry } from "../sessions/user-session-registry.js";
import { ClientIntent } from "../../packets/client-intents.js";
import { ConnectionId, GameName } from "../../aliases.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { OutgoingMessageGateway } from "../update-delivery/message-gateway.js";
import {
  MessageDispatchFactory,
  MessageDispatchType,
} from "../update-delivery/message-dispatch-factory.js";
import { IncomingConnectionGateway } from "../incoming-connection-gateway.js";
import { GameSessionStoreService } from "../services/game-session-store/index.js";
import { SavedCharactersService } from "../services/saved-characters.js";
import { RankedLadderService } from "../services/ranked-ladder.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { UntypedConnectionEndpoint } from "../../transport/connection-endpoint.js";
import {
  ConnectionIdentityResolutionContext,
  IdentityProviderService,
} from "../services/identity-provider.js";
import { createGameServerClientIntentHandlers } from "./create-game-server-client-intent-handlers.js";
import { MessageDispatchOutbox } from "../update-delivery/outbox.js";

export interface GameServerExternalServices {
  gameSessionStoreService: GameSessionStoreService;
  identityProviderService: IdentityProviderService;
  savedCharactersService: SavedCharactersService;
  rankedLadderService: RankedLadderService;
}

export class GameServer {
  private readonly games = new Map<GameName, SpeedDungeonGame>();
  private readonly idGenerator = new IdGenerator({ saveHistory: false });
  private readonly randomNumberGenerator = new BasicRandomNumberGenerator();
  private readonly updateGateway = new OutgoingMessageGateway<GameStateUpdate, ClientIntent>();
  readonly userSessionRegistry = new UserSessionRegistry();
  private readonly gameStateUpdateDispatchFactory = new MessageDispatchFactory<GameStateUpdate>(
    this.userSessionRegistry
  );
  private readonly outgoingMessagesToUsersGateway = new OutgoingMessageGateway<
    GameStateUpdate,
    ClientIntent
  >();
  // public readonly sessionAuthManager: SessionAuthorizationManager;

  // controllers
  // public readonly gameLifecycleController: GameLifecycleController;
  // public readonly sessionLifecycleController: SessionLifecycleController;
  // public readonly savedCharactersController: SavedCharactersController;

  constructor(
    private readonly incomingConnectionGateway: IncomingConnectionGateway,
    private readonly externalServices: GameServerExternalServices
  ) {
    this.incomingConnectionGateway.initialize(
      async (context, identityContext) => await this.handleConnection(context, identityContext)
    );
    this.incomingConnectionGateway.listen();

    // this.sessionAuthManager = new SessionAuthorizationManager(externalServices.profileService);
  }

  private intentHandlers = createGameServerClientIntentHandlers(this);

  async handleConnection(
    endpoint: UntypedConnectionEndpoint,
    identityResolutionContext: ConnectionIdentityResolutionContext
  ) {
    const newSession = await this.sessionLifecycleController.createUserSession(
      transportEndpoint.id,
      identityResolutionContext
    );

    if (newSession.userId !== null) {
      this.externalServices.profileService.createProfileIfUserHasNone(newSession.userId);
    }

    const outbox = await this.sessionLifecycleController.connectionHandler(
      newSession,
      transportEndpoint
    );
    this.dispatchOutboxMessages(outbox);
  }

  private dispatchUserOutboxMessages(outbox: MessageDispatchOutbox<GameStateUpdate>) {
    for (const dispatch of outbox.toDispatches()) {
      switch (dispatch.type) {
        case MessageDispatchType.Single:
          this.outgoingMessagesToUsersGateway.submitToConnection(
            dispatch.connectionId,
            dispatch.message
          );
          break;
        case MessageDispatchType.FanOut:
          this.outgoingMessagesToUsersGateway.submitToConnections(
            dispatch.connectionIds,
            dispatch.message
          );
          break;
      }
    }
  }
}
