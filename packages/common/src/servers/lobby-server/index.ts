import { CharacterLifecycleController } from "./controllers/character-lifecycle.js";
import { SavedCharactersController } from "./controllers/saved-characters.js";
import { createLobbyClientIntentHandlers } from "./create-lobby-client-intent-handlers.js";
import { GameLifecycleController } from "./controllers/game-lifecycle.js";
import { LobbyState } from "./lobby-state.js";
import { PartySetupController } from "./controllers/party-setup.js";
import { SessionLifecycleController } from "./controllers/session-lifecycle.js";
import {
  ConnectionIdentityResolutionContext,
  GameServerIdentityResolutionContext,
  IdentityProviderService,
  UserIdentityResolutionContext,
} from "../services/identity-provider.js";
import { SpeedDungeonProfileService } from "../services/profiles.js";
import { SavedCharactersService } from "../services/saved-characters.js";
import { RankedLadderService } from "../services/ranked-ladder.js";
import { UserSessionRegistry } from "../sessions/user-session-registry.js";
import { SessionAuthorizationManager } from "../sessions/authorization-manager.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { BasicRandomNumberGenerator } from "../../utility-classes/randomizers.js";
import { CharacterCreator } from "../../character-creation/index.js";
import { ItemGenerator } from "../../items/item-creation/index.js";
import { AffixGenerator } from "../../items/item-creation/builders/affix-generator/index.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { ClientIntent } from "../../packets/client-intents.js";
import { UserIdType } from "../sessions/user-ids.js";
import { GameHandoffStrategyLobbyToGameServer } from "./game-handoff/handoff-strategy.js";
import {
  MessageDispatchFactory,
  MessageDispatchType,
} from "../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../update-delivery/outbox.js";
import { OutgoingMessageGateway } from "../update-delivery/message-gateway.js";
import { GameServerSessionRegistry } from "../sessions/game-server-session-registry.js";
import { GameServerSessionLifecycleController } from "./controllers/game-server-session-lifecycle.js";
import { ConnectionRole } from "../../http-headers.js";
import { IncomingConnectionGateway } from "../incoming-connection-gateway.js";
import { UntypedConnectionEndpoint } from "../../transport/connection-endpoint.js";
import { createLobbyGameServerIntentHandlers } from "./create-game-server-intent-handlers.js";
import { ServerToServerMessage } from "../../packets/server-to-server.js";

export interface LobbyExternalServices {
  identityProviderService: IdentityProviderService;
  profileService: SpeedDungeonProfileService;
  savedCharactersService: SavedCharactersService;
  rankedLadderService: RankedLadderService;
  idGenerator: IdGenerator;
}

// lives either inside a LobbyServerNode or locally on a ClientApp
export class LobbyServer {
  private readonly randomNumberGenerator = new BasicRandomNumberGenerator();
  public readonly lobbyState = new LobbyState();
  private readonly outgoingMessagesToUsersGateway = new OutgoingMessageGateway<
    GameStateUpdate,
    ClientIntent
  >();
  private readonly outgoingMessagesToGameServersGateway = new OutgoingMessageGateway<
    ServerToServerMessage,
    ServerToServerMessage
  >();
  readonly userSessionRegistry = new UserSessionRegistry();
  private readonly gameServerSessionRegistry = new GameServerSessionRegistry();

  private readonly gameStateUpdateDispatchFactory = new MessageDispatchFactory<GameStateUpdate>(
    this.userSessionRegistry
  );
  private readonly characterCreator: CharacterCreator;

  public readonly sessionAuthManager: SessionAuthorizationManager;
  private userIntentHandlers = createLobbyClientIntentHandlers(this);
  private gameServerIntentHandlers = createLobbyGameServerIntentHandlers(this);

  // user controllers
  public readonly gameLifecycleController: GameLifecycleController;
  public readonly partySetupController: PartySetupController;
  public readonly userSessionLifecycleController: SessionLifecycleController;
  public readonly savedCharactersController: SavedCharactersController;
  public readonly characterLifecycleController: CharacterLifecycleController;
  // game server controllers
  public readonly gameServerSessionLifecycleController: GameServerSessionLifecycleController;

  constructor(
    private readonly incomingConnectionGateway: IncomingConnectionGateway,
    private readonly gameHandoffStrategy: GameHandoffStrategyLobbyToGameServer,
    private readonly externalServices: LobbyExternalServices
  ) {
    this.incomingConnectionGateway.initialize(
      async (context, identityContext) => await this.handleConnection(context, identityContext)
    );
    this.incomingConnectionGateway.listen();

    this.characterCreator = new CharacterCreator(
      this.externalServices.idGenerator,
      new ItemGenerator(
        this.externalServices.idGenerator,
        this.randomNumberGenerator,
        new AffixGenerator(this.randomNumberGenerator)
      )
    );

    this.sessionAuthManager = new SessionAuthorizationManager(externalServices.profileService);

    const controllers = this.createControllers();
    this.gameLifecycleController = controllers.gameLifecycleController;
    this.partySetupController = controllers.partySetupController;
    this.userSessionLifecycleController = controllers.userSessionLifecycleController;
    this.savedCharactersController = controllers.savedCharactersController;
    this.characterLifecycleController = controllers.characterLifecycleController;

    this.gameServerSessionLifecycleController = controllers.gameServerSessionLifecycleController;
  }

  async handleConnection(
    endpoint: UntypedConnectionEndpoint,
    identityResolutionContext: ConnectionIdentityResolutionContext
  ) {
    console.log("got new connection to lobby:", endpoint.id);
    switch (identityResolutionContext.type) {
      case ConnectionRole.User: {
        console.log("is user connection");
        return await this.handleUserConnection(endpoint, identityResolutionContext);
      }
      case ConnectionRole.GameServer: {
        console.log("is game server connection");
        return await this.handleGameServerConnection(endpoint, identityResolutionContext);
      }
    }
  }

  private async handleUserConnection(
    connectionEndpoint: UntypedConnectionEndpoint,
    identityResolutionContext: UserIdentityResolutionContext
  ) {
    // authenticate
    // create session
    const newSession = await this.userSessionLifecycleController.createUserSession(
      connectionEndpoint.id,
      identityResolutionContext
    );

    console.log("created user session:", newSession);

    // special business logic for this session type
    if (newSession.userId.type === UserIdType.Auth) {
      this.externalServices.profileService.createProfileIfUserHasNone(newSession.userId.id);
    }

    // type the connection endpoint
    const userConnectionEndpoint = connectionEndpoint.toTyped<GameStateUpdate, ClientIntent>();

    // attach the connection to message handlers and disconnectionHandler
    userConnectionEndpoint.subscribeAll(
      async (receivable) => {
        const handlerOption = this.userIntentHandlers[receivable.type];

        if (handlerOption === undefined) {
          throw new Error("Lobby is not configured to handle this type of ClientIntent");
        }

        const session = this.userSessionRegistry.getExpectedSession(userConnectionEndpoint.id);

        // a workaround is to use "as never" for some reason
        const outbox = await handlerOption(receivable.data as never, session);
        this.dispatchUserOutboxMessages(outbox);
      },
      (reason) => {
        this.userSessionLifecycleController.disconnectionHandler(newSession, reason);
      }
    );
    //
    const outbox = await this.userSessionLifecycleController.connectionHandler(
      newSession,
      userConnectionEndpoint
    );
    this.dispatchUserOutboxMessages(outbox);
  }

  private async handleGameServerConnection(
    connectionEndpoint: UntypedConnectionEndpoint,
    identityResolutionContext: GameServerIdentityResolutionContext
  ) {
    const newSession = this.gameServerSessionLifecycleController.createServerSession(
      connectionEndpoint.id,
      identityResolutionContext
    );
    this.gameServerSessionRegistry.register(newSession);

    const gameServerConnectionEndpoint = connectionEndpoint.toTyped<
      ServerToServerMessage,
      ServerToServerMessage
    >();

    gameServerConnectionEndpoint.subscribeAll(
      async (receivable) => {
        const handlerOption = this.gameServerIntentHandlers[receivable.type];

        if (handlerOption === undefined) {
          throw new Error("Lobby is not configured to handle this type of ClientIntent");
        }

        const session = this.gameServerSessionRegistry.getExpectedSession(
          gameServerConnectionEndpoint.id
        );

        // a workaround is to use "as never" for some reason
        const outbox = await handlerOption(receivable.data as never, session);

        this.dispatchGameServerOutboxMessages(outbox);
      },
      (reason) => {
        console.log(`${connectionEndpoint.id} disconnected: ${reason.getStringName()}`);
      }
    );

    // const outbox = await this.gameServerSessionLifecycleController.connectionHandler(
    //   newSession,
    //   gameServerConnectionEndpoint
    // );
    // this.dispatchUserOutboxMessages(outbox);
  }

  private dispatchGameServerOutboxMessages(outbox: MessageDispatchOutbox<ServerToServerMessage>) {
    for (const dispatch of outbox.toDispatches()) {
      switch (dispatch.type) {
        case MessageDispatchType.Single:
          this.outgoingMessagesToGameServersGateway.submitToConnection(
            dispatch.connectionId,
            dispatch.message
          );
          break;
        case MessageDispatchType.FanOut:
          this.outgoingMessagesToGameServersGateway.submitToConnections(
            dispatch.connectionIds,
            dispatch.message
          );
          break;
      }
    }
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

  private createControllers() {
    const savedCharactersController = new SavedCharactersController(
      this.sessionAuthManager,
      this.gameStateUpdateDispatchFactory,
      this.externalServices,
      this.characterCreator
    );

    const partySetupController = new PartySetupController(
      this.lobbyState,
      this.gameStateUpdateDispatchFactory,
      this.savedCharactersController,
      this.sessionAuthManager,
      this.externalServices.idGenerator
    );

    const gameLifecycleController = new GameLifecycleController(
      this.lobbyState,
      this.userSessionRegistry,
      this.sessionAuthManager,
      this.gameStateUpdateDispatchFactory,
      this.partySetupController,
      this.externalServices.idGenerator,
      this.gameHandoffStrategy
    );

    const characterLifecycleController = new CharacterLifecycleController(
      this.lobbyState,
      this.sessionAuthManager,
      this.gameStateUpdateDispatchFactory,
      this.externalServices.savedCharactersService,
      this.characterCreator
    );

    const userSessionLifecycleController = new SessionLifecycleController(
      this.lobbyState,
      this.outgoingMessagesToUsersGateway,
      this.userSessionRegistry,
      this.sessionAuthManager,
      this.gameStateUpdateDispatchFactory,
      this.savedCharactersController,
      this.gameLifecycleController,
      this.externalServices.identityProviderService,
      this.externalServices.idGenerator
    );

    const gameServerSessionLifecycleController = new GameServerSessionLifecycleController(
      this.gameServerSessionRegistry
    );

    return {
      savedCharactersController,
      partySetupController,
      gameLifecycleController,
      characterLifecycleController,
      userSessionLifecycleController,
      gameServerSessionLifecycleController,
    };
  }
}
