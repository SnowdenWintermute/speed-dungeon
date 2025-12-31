import {
  AffixGenerator,
  BasicRandomNumberGenerator,
  CharacterCreator,
  ClientIntent,
  ConnectionId,
  GameStateUpdate,
  IdGenerator,
  ItemGenerator,
  TransportEndpoint,
} from "../index.js";
import { ClientIntentReceiver } from "./client-intent-receiver.js";
import { CharacterLifecycleController } from "./controllers/character-lifecycle.js";
import { SavedCharactersController } from "./controllers/saved-characters.js";
import { createLobbyClientIntentHandlers } from "./create-lobby-client-intent-handlers.js";
import { GameLifecycleController } from "./controllers/game-lifecycle.js";
import { GameSimulatorHandoffStrategy } from "./game-simulator-handoff-strategy.js";
import { LobbyState } from "./lobby-state.js";
import { PartySetupController } from "./controllers/party-setup.js";
import { SessionLifecycleController } from "./controllers/session-lifecycle.js";
import { RankedLadderService } from "./services/ranked-ladder.js";
import { SavedCharactersService } from "./services/saved-characters.js";
import { SpeedDungeonProfileService } from "./services/profiles.js";
import { GameStateUpdateGateway } from "./update-delivery/game-state-update-gateway.js";
import {
  GameStateUpdateDispatchFactory,
  GameStateUpdateDispatchType,
} from "./update-delivery/game-state-update-dispatch-factory.js";
import { UserSessionRegistry } from "./sessions/user-session-registry.js";
import { SessionAuthorizationManager } from "./sessions/authorization-manager.js";
import {
  IdentityProviderService,
  IdentityResolutionContext,
} from "./services/identity-provider.js";
import { GameStateUpdateDispatchOutbox } from "./update-delivery/update-dispatch-outbox.js";

export interface LobbyExternalServices {
  identityProviderService: IdentityProviderService;
  profileService: SpeedDungeonProfileService;
  savedCharactersService: SavedCharactersService;
  rankedLadderService: RankedLadderService;
  idGenerator: IdGenerator;
}

// lives either inside a LobbyServer or locally on a ClientApp
export class Lobby {
  private readonly randomNumberGenerator = new BasicRandomNumberGenerator();
  private readonly lobbyState = new LobbyState();
  private readonly updateGateway = new GameStateUpdateGateway();
  readonly userSessionRegistry = new UserSessionRegistry();
  private readonly gameStateUpdateDispatchFactory = new GameStateUpdateDispatchFactory(
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
    // listens for client intents and delegates them to handlers
    private readonly clientIntentReceiver: ClientIntentReceiver,
    private readonly gameSimulatorHandoffStrategy: GameSimulatorHandoffStrategy,
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
      this.gameSimulatorHandoffStrategy
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
      this.externalServices.identityProviderService
    );
  }

  private intentHandlers = createLobbyClientIntentHandlers(this);

  async handleConnection(
    transportEndpoint: TransportEndpoint<GameStateUpdate, ClientIntent>,
    identityResolutionContext: IdentityResolutionContext
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

  private dispatchOutboxMessages(outbox: GameStateUpdateDispatchOutbox) {
    for (const dispatch of outbox.toDispatches()) {
      switch (dispatch.type) {
        case GameStateUpdateDispatchType.Single:
          this.updateGateway.submitToConnection(dispatch.connectionId, dispatch.update);
          break;
        case GameStateUpdateDispatchType.FanOut:
          this.updateGateway.submitToConnections(dispatch.connectionIds, dispatch.update);
          break;
      }
    }
  }
}
