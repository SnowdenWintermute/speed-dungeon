import { CharacterLifecycleController } from "./controllers/character-lifecycle.js";
import { SavedCharactersController } from "./controllers/saved-characters.js";
import { createLobbyClientIntentHandlers } from "./create-lobby-client-intent-handlers.js";
import { GameLifecycleController } from "./controllers/game-lifecycle.js";
import { LobbyState } from "./lobby-state.js";
import { PartySetupController } from "./controllers/party-setup.js";
import { SessionLifecycleController } from "./controllers/session-lifecycle.js";
import {
  IdentityProviderService,
  IdentityResolutionContext,
} from "../services/identity-provider.js";
import { SpeedDungeonProfileService } from "../services/profiles.js";
import { SavedCharactersService } from "../services/saved-characters.js";
import { RankedLadderService } from "../services/ranked-ladder.js";
import { UserSessionRegistry } from "../sessions/user-session-registry.js";
import { SessionAuthorizationManager } from "../sessions/authorization-manager.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { BasicRandomNumberGenerator } from "../../utility-classes/randomizers.js";
import { CharacterCreator } from "../../character-creation/index.js";
import { ClientIntentReceiver } from "../client-intent-receiver.js";
import { ItemGenerator } from "../../items/item-creation/index.js";
import { AffixGenerator } from "../../items/item-creation/builders/affix-generator/index.js";
import { ConnectionEndpoint } from "../../transport/connection-endpoint.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { ClientIntent } from "../../packets/client-intents.js";
import { ConnectionId } from "../../aliases.js";
import { GameServerNodeDirectory } from "./game-server-node-directory.js";
import { UserIdType } from "../sessions/user-ids.js";
import { GameHandoffStrategyLobbyToGameServer } from "./game-handoff/handoff-strategy.js";
import {
  MessageDispatchFactory,
  MessageDispatchType,
} from "../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../update-delivery/outbox.js";
import { OutgoingMessageGateway } from "../update-delivery/message-gateway.js";

export interface LobbyExternalServices {
  identityProviderService: IdentityProviderService;
  profileService: SpeedDungeonProfileService;
  savedCharactersService: SavedCharactersService;
  rankedLadderService: RankedLadderService;
  idGenerator: IdGenerator;
}

// lives either inside a LobbyServerNode or locally on a ClientApp
export class LobbyServer {
  private readonly gameServerNodeRegistry = new GameServerNodeDirectory();
  private readonly randomNumberGenerator = new BasicRandomNumberGenerator();
  public readonly lobbyState = new LobbyState();
  private readonly updateGateway = new OutgoingMessageGateway<GameStateUpdate, ClientIntent>();
  readonly userSessionRegistry = new UserSessionRegistry();
  private readonly gameStateUpdateDispatchFactory = new MessageDispatchFactory<GameStateUpdate>(
    this.userSessionRegistry
  );
  private readonly characterCreator: CharacterCreator;

  public readonly sessionAuthManager: SessionAuthorizationManager;

  // controllers
  public readonly gameLifecycleController: GameLifecycleController;
  public readonly partySetupController: PartySetupController;
  public readonly sessionLifecycleController: SessionLifecycleController;
  public readonly savedCharactersController: SavedCharactersController;
  public readonly characterLifecycleController: CharacterLifecycleController;

  constructor(
    private readonly clientIntentReceiver: ClientIntentReceiver<ClientIntent, GameStateUpdate>,
    // private readonly gameServerMessageReceiver: ClientIntentReceiver<
    //   ServerToServerPacket,
    //   ServerToServerPacket
    // >,
    private readonly gameHandoffStrategy: GameHandoffStrategyLobbyToGameServer,
    private readonly externalServices: LobbyExternalServices
  ) {
    this.clientIntentReceiver.initialize(this);
    this.clientIntentReceiver.listen();

    this.characterCreator = new CharacterCreator(
      this.externalServices.idGenerator,
      new ItemGenerator(
        this.externalServices.idGenerator,
        this.randomNumberGenerator,
        new AffixGenerator(this.randomNumberGenerator)
      )
    );

    this.sessionAuthManager = new SessionAuthorizationManager(externalServices.profileService);

    this.savedCharactersController = new SavedCharactersController(
      this.sessionAuthManager,
      this.gameStateUpdateDispatchFactory,
      this.externalServices,
      this.characterCreator
    );

    this.partySetupController = new PartySetupController(
      this.lobbyState,
      this.gameStateUpdateDispatchFactory,
      this.savedCharactersController,
      this.sessionAuthManager,
      this.externalServices.idGenerator
    );

    this.gameLifecycleController = new GameLifecycleController(
      this.lobbyState,
      this.userSessionRegistry,
      this.sessionAuthManager,
      this.gameStateUpdateDispatchFactory,
      this.partySetupController,
      this.externalServices.idGenerator,
      this.gameHandoffStrategy
    );

    this.characterLifecycleController = new CharacterLifecycleController(
      this.lobbyState,
      this.sessionAuthManager,
      this.gameStateUpdateDispatchFactory,
      this.externalServices.savedCharactersService,
      this.characterCreator
    );

    this.sessionLifecycleController = new SessionLifecycleController(
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
  }

  private intentHandlers = createLobbyClientIntentHandlers(this);

  async handleConnection(
    connectionEndpoint: ConnectionEndpoint<GameStateUpdate, ClientIntent>,
    identityResolutionContext: IdentityResolutionContext
  ) {
    const newSession = await this.sessionLifecycleController.createUserSession(
      connectionEndpoint.id,
      identityResolutionContext
    );

    if (newSession.userId.type === UserIdType.Auth) {
      this.externalServices.profileService.createProfileIfUserHasNone(newSession.userId.id);
    }

    const outbox = await this.sessionLifecycleController.connectionHandler(
      newSession,
      connectionEndpoint
    );
    this.dispatchOutboxMessages(outbox);
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
}

// connection domains

// on connection
// - put connection endpoint id in a pendingHandshakes: Map<ConnectionId, ConnectionEndpoint>
//
// on handshake packet
// - determine type of client (user or game server)
// - call appropriate handleHandshake

// usersManager | gameServersManager
// handle handshake - verify connector's identity (guest user, auth user, trusted game server)
// store sessions
// contain controller subsystems with handlers corresponding to typed messages
// handle client packets -> create outboxes
// submit outbox dispatches to connections
// handle disconnections
