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
import { ConnectionId } from "../../aliases.js";
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
import { IncomingMessageGateway } from "../incoming-message-gateway.js";
import { UntypedConnectionEndpoint } from "../../transport/connection-endpoint.js";

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
  private readonly updateGateway = new OutgoingMessageGateway<GameStateUpdate, ClientIntent>();
  readonly userSessionRegistry = new UserSessionRegistry();
  private readonly gameServerSessionRegistry = new GameServerSessionRegistry();

  private readonly gameStateUpdateDispatchFactory = new MessageDispatchFactory<GameStateUpdate>(
    this.userSessionRegistry
  );
  private readonly characterCreator: CharacterCreator;

  public readonly sessionAuthManager: SessionAuthorizationManager;
  private intentHandlers = createLobbyClientIntentHandlers(this);

  // user controllers
  public readonly gameLifecycleController: GameLifecycleController;
  public readonly partySetupController: PartySetupController;
  public readonly userSessionLifecycleController: SessionLifecycleController;
  public readonly savedCharactersController: SavedCharactersController;
  public readonly characterLifecycleController: CharacterLifecycleController;
  // game server controllers
  public readonly gameServerSessionLifecycleController: GameServerSessionLifecycleController;

  constructor(
    private readonly incomingMessageGateway: IncomingMessageGateway,
    // private readonly gameServerMessageReceiver: ClientIntentReceiver<
    //   ServerToServerPacket,
    //   ServerToServerPacket
    // >,
    private readonly gameHandoffStrategy: GameHandoffStrategyLobbyToGameServer,
    private readonly externalServices: LobbyExternalServices
  ) {
    this.incomingMessageGateway.initialize(
      async (context, identityContext) => await this.handleConnection(context, identityContext)
    );
    this.incomingMessageGateway.listen();

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
    const newSession = await this.userSessionLifecycleController.createUserSession(
      connectionEndpoint.id,
      identityResolutionContext
    );

    console.log("created user session:", newSession);

    if (newSession.userId.type === UserIdType.Auth) {
      this.externalServices.profileService.createProfileIfUserHasNone(newSession.userId.id);
    }

    const userConnectionEndpoint = connectionEndpoint.toTyped<GameStateUpdate, ClientIntent>();

    const outbox = await this.userSessionLifecycleController.connectionHandler(
      newSession,
      userConnectionEndpoint
    );
    this.dispatchOutboxMessages(outbox);
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
  }

  async handleIntent(clientIntent: ClientIntent, connectionId: ConnectionId) {
    const handlerOption = this.intentHandlers[clientIntent.type];

    if (handlerOption === undefined) {
      throw new Error("Lobby is not configured to handle this type of ClientIntent");
    }

    const fromUser = this.userSessionRegistry.getExpectedSession(connectionId);

    // a workaround is to use "as never" for some reason
    const outbox = await handlerOption(clientIntent.data as never, fromUser);
    this.dispatchOutboxMessages(outbox);
  }

  private dispatchOutboxMessages(outbox: MessageDispatchOutbox<GameStateUpdate>) {
    for (const dispatch of outbox.toDispatches()) {
      switch (dispatch.type) {
        case MessageDispatchType.Single:
          this.updateGateway.submitToConnection(dispatch.connectionId, dispatch.message);
          break;
        case MessageDispatchType.FanOut:
          this.updateGateway.submitToConnections(dispatch.connectionIds, dispatch.message);
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
      this.updateGateway,
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
