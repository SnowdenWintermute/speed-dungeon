import {
  AffixGenerator,
  BasicRandomNumberGenerator,
  CharacterCreator,
  ClientIntent,
  IdGenerator,
  ItemGenerator,
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
import { UserSession } from "./sessions/user-session.js";

// @TODO - can remove exports after this becomes default lobby code
export * from "./controllers/default-naming/games.js";
export * from "./controllers/default-naming/parties.js";

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

  public readonly sessionAuthManager: SessionAuthorizationManager;

  // controllers
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
    profileService: SpeedDungeonProfileService,
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
      profileService
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
      this.userSessionRegistry,
      this.sessionAuthManager,
      this.gameStateUpdateDispatchFactory,
      this.partySetupController,
      idGenerator,
      this.gameSimulatorHandoffStrategy
    );

    this.characterLifecycleController = new CharacterLifecycleController(
      this.lobbyState,
      this.sessionAuthManager,
      this.gameStateUpdateDispatchFactory,
      this.savedCharactersService,
      this.characterCreator
    );

    this.sessionLifecycleController = new SessionLifecycleController(
      this.lobbyState,
      updateGateway,
      this.userSessionRegistry,
      this.sessionAuthManager,
      this.gameStateUpdateDispatchFactory,
      this.savedCharactersController,
      this.gameLifecycleController
    );
  }

  private intentHandlers = createLobbyClientIntentHandlers(this);

  async handleIntent(clientIntent: ClientIntent, fromUser: UserSession) {
    const handlerOption = this.intentHandlers[clientIntent.type];

    if (handlerOption === undefined) {
      throw new Error("Lobby is not configured to handle this type of ClientIntent");
    }

    // a workaround is to use "as never" for some reason
    const outbox = await handlerOption(clientIntent.data as never, fromUser);
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
