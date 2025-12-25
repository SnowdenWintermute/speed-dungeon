import {
  AffixGenerator,
  BasicRandomNumberGenerator,
  CharacterCreator,
  ClientIntent,
  IdGenerator,
  ItemGenerator,
} from "../index.js";
import { CharacterLifecycleController } from "./character-lifecycle-controller.js";
import { ClientIntentReceiver } from "./client-intent-receiver.js";
import { createLobbyClientIntentHandlers } from "./create-lobby-client-intent-handlers.js";
import { GameLifecycleController } from "./game-lifecycle-controller.js";
import { GameSimulatorHandoffStrategy } from "./game-simulator-handoff-strategy.js";
import { GameStateUpdateDispatchFactory } from "./game-state-update-dispatch-factory.js";
import { GameStateUpdateGateway } from "./game-state-update-gateway.js";
import { LobbyState } from "./lobby-state.js";
import { PartySetupController } from "./party-setup-controller.js";
import { RankedLadderService } from "./ranked-ladder-service.js";
import { SavedCharactersService } from "./saved-character-service.js";
import { SavedCharactersController } from "./saved-characters-controller.js";
import { SessionAuthorizationManager } from "./session-authorization-manager.js";
import { SessionLifecycleController } from "./session-lifecycle-controller.js";
import { SpeedDungeonProfileLoader } from "./speed-dungeon-profile-loader.js";
import { UserSessionRegistry } from "./user-session-registry.js";
import { UserSession } from "./user-session.js";

export * from "./random-names.js";
export * from "./character-creation/index.js";

// lives either inside a LobbyServer or locally on a ClientApp
export class Lobby {
  private readonly randomNumberGenerator = new BasicRandomNumberGenerator();
  private readonly lobbyState = new LobbyState();
  private readonly userSessionRegistry = new UserSessionRegistry();
  private readonly gameStateUpdateDispatchFactory = new GameStateUpdateDispatchFactory(
    this.userSessionRegistry
  );
  private readonly characterCreator: CharacterCreator;

  // handler managers
  public readonly sessionAuthManager: SessionAuthorizationManager;
  public readonly gameLifecycleController: GameLifecycleController;
  public readonly partySetupController: PartySetupController;
  public readonly sessionLifecycleController: SessionLifecycleController;
  public readonly savedCharactersController: SavedCharactersController;
  public readonly characterLifecycleController: CharacterLifecycleController;

  constructor(
    private readonly updateGateway: GameStateUpdateGateway,
    // listens for client intents and delegates them to handlers
    private readonly clientIntentReceiver: ClientIntentReceiver,
    private readonly gameSimulatorHandoffStrategy: GameSimulatorHandoffStrategy,
    private readonly profileLoader: SpeedDungeonProfileLoader,
    private readonly savedCharactersService: SavedCharactersService,
    private readonly idGenerator: IdGenerator,
    private readonly rankedLadderService: RankedLadderService
  ) {
    this.clientIntentReceiver.initialize(this);

    this.characterCreator = new CharacterCreator(
      this.idGenerator,
      new ItemGenerator(
        idGenerator,
        this.randomNumberGenerator,
        new AffixGenerator(this.randomNumberGenerator)
      )
    );

    this.sessionAuthManager = new SessionAuthorizationManager(
      this.userSessionRegistry,
      profileLoader
    );

    this.savedCharactersController = new SavedCharactersController(
      this.sessionAuthManager,
      this.gameStateUpdateDispatchFactory,
      this.savedCharactersService,
      this.rankedLadderService,
      this.characterCreator
    );

    this.partySetupController = new PartySetupController(
      this.lobbyState,
      this.gameStateUpdateDispatchFactory,
      this.savedCharactersController,
      this.sessionAuthManager,
      idGenerator
    );

    this.gameLifecycleController = new GameLifecycleController(
      this.lobbyState,
      updateGateway,
      this.userSessionRegistry,
      this.sessionAuthManager,
      this.partySetupController,
      idGenerator,
      this.gameSimulatorHandoffStrategy
    );

    this.characterLifecycleController = new CharacterLifecycleController(
      this.lobbyState,
      updateGateway,
      this.userSessionRegistry,
      this.sessionAuthManager,
      this.savedCharactersService,
      this.characterCreator
    );

    this.sessionLifecycleController = new SessionLifecycleController(
      this.lobbyState,
      updateGateway,
      this.userSessionRegistry,
      this.sessionAuthManager,
      this.savedCharactersController
    );
  }

  private intentHandlers = createLobbyClientIntentHandlers(this);

  handleIntent(clientIntent: ClientIntent, fromUser: UserSession) {
    const handlerOption = this.intentHandlers[clientIntent.type];

    if (handlerOption === undefined) {
      throw new Error("Lobby is not configured to handle this type of ClientIntent");
    }

    try {
      // a workaround is to use "as never" for some reason
      const gameStateUpdateDispatches = handlerOption(clientIntent.data as never, fromUser);
    } catch (error) {
      // do error handling
    }
  }
}
