import { BasicRandomNumberGenerator } from "../../utility-classes/randomizers.js";
import { UserSessionRegistry } from "../sessions/user-session-registry.js";
import { ClientIntent } from "../../packets/client-intents.js";
import { GameServerName } from "../../aliases.js";
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
import { GameServerSessionLifecycleController } from "./controllers/session-lifecycle.js";
import { GameRegistry } from "../game-registry.js";
import { UserSession } from "../sessions/user-session.js";
import { TransportDisconnectReason } from "../../transport/disconnect-reasons.js";
import { GameServerGameLifecycleController } from "./controllers/game-lifecycle/index.js";
import { RaceGameRecordsService } from "../services/race-game-records.js";

export interface GameServerExternalServices {
  gameSessionStoreService: GameSessionStoreService;
  identityProviderService: IdentityProviderService;
  savedCharactersService: SavedCharactersService;
  rankedLadderService: RankedLadderService;
  raceGameRecordsService: RaceGameRecordsService;
  savedCharactersLadderService: SavedCharactersService;
}

export class GameServer {
  private readonly gameRegistry = new GameRegistry();
  private readonly idGenerator = new IdGenerator({ saveHistory: false });
  private readonly randomNumberGenerator = new BasicRandomNumberGenerator();
  readonly userSessionRegistry = new UserSessionRegistry();
  private readonly gameStateUpdateDispatchFactory = new MessageDispatchFactory<GameStateUpdate>(
    this.userSessionRegistry
  );
  private readonly outgoingMessagesToUsersGateway = new OutgoingMessageGateway<
    GameStateUpdate,
    ClientIntent
  >();

  // controllers
  public readonly gameLifecycleController: GameServerGameLifecycleController;
  public readonly sessionLifecycleController: GameServerSessionLifecycleController;
  // public readonly savedCharactersController: SavedCharactersController;

  constructor(
    private readonly name: GameServerName,
    private readonly incomingConnectionGateway: IncomingConnectionGateway,
    private readonly externalServices: GameServerExternalServices
  ) {
    this.incomingConnectionGateway.initialize(
      async (context, identityContext) => await this.handleConnection(context, identityContext)
    );
    this.incomingConnectionGateway.listen();

    this.gameLifecycleController = new GameServerGameLifecycleController(
      this.gameRegistry,
      this.userSessionRegistry,
      this.externalServices.gameSessionStoreService,
      this.externalServices.raceGameRecordsService,
      this.externalServices.savedCharactersLadderService,
      this.externalServices.rankedLadderService,
      this.gameStateUpdateDispatchFactory
    );

    this.sessionLifecycleController = new GameServerSessionLifecycleController(
      this.userSessionRegistry,
      this.gameRegistry,
      this.gameStateUpdateDispatchFactory,
      this.externalServices.identityProviderService,
      this.gameLifecycleController,
      this.idGenerator
    );
  }

  private intentHandlers = createGameServerClientIntentHandlers(this);

  async handleConnection(
    connectionEndpoint: UntypedConnectionEndpoint,
    identityResolutionContext: ConnectionIdentityResolutionContext
  ) {
    const sessionClaimTokenOption = identityResolutionContext.gameServerSessionClaimToken;
    if (sessionClaimTokenOption === undefined) {
      throw new Error("No token was provided when attempting to join the game server");
    }

    const session = await this.sessionLifecycleController.createSession(
      connectionEndpoint.id,
      identityResolutionContext
    );

    const { gameName } = sessionClaimTokenOption;

    let existingGame = this.gameRegistry.getGameOption(gameName);
    // this means this is the first user to join this game
    if (existingGame === undefined) {
      existingGame = await this.gameLifecycleController.initializeExpectedPendingGame(gameName);
    }

    // type the connection endpoint
    const userConnectionEndpoint = connectionEndpoint.toTyped<GameStateUpdate, ClientIntent>();
    this.outgoingMessagesToUsersGateway.registerEndpoint(
      userConnectionEndpoint.id,
      userConnectionEndpoint
    );

    console.info(
      `-- ${session.username} (user id: ${session.taggedUserId.id}, connection id: ${session.connectionId}) joined the ${this.name} game server`
    );

    // attach the connection to message handlers and disconnectionHandler
    // @TODO - this is same as on lobby server, combine it
    userConnectionEndpoint.subscribeAll(
      async (receivable) => {
        const handlerOption = this.intentHandlers[receivable.type];

        if (handlerOption === undefined) {
          throw new Error("Lobby is not configured to handle this type of ClientIntent");
        }

        const session = this.userSessionRegistry.getExpectedSession(userConnectionEndpoint.id);

        // a workaround is to use "as never" for some reason
        const outbox = await handlerOption(receivable.data as never, session);
        this.dispatchUserOutboxMessages(outbox);
      },
      (reason) => this.disconnectionHandler(session, reason)
    );
    const outbox = await this.sessionLifecycleController.activateSession(session);

    // - place the UserSession in the Game
    const joinGameOutbox = await this.gameLifecycleController.joinGameHandler(gameName, session);
    outbox.pushFromOther(joinGameOutbox);

    this.dispatchUserOutboxMessages(outbox);
  }

  // @TODO - combine with lobby server, it is almost exact same
  private async disconnectionHandler(session: UserSession, reason: TransportDisconnectReason) {
    console.info(
      `-- ${session.username} (${session.connectionId}) disconnected from ${this.name} game server. Reason - ${reason.getStringName()}`
    );
    await this.sessionLifecycleController.cleanupSession(session);
    this.outgoingMessagesToUsersGateway.unregisterEndpoint(session.connectionId);
  }

  // @TODO - combine with lobby server's version, it is same thing
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
