import {
  AffixGenerator,
  BasicRandomNumberGenerator,
  CharacterCreator,
  ClientIntent,
  IdGenerator,
  ItemGenerator,
  SpeedDungeonGame,
} from "../index.js";
import { CharacterLifecycleManager } from "./character-lifecycle-manager.js";
import { ClientIntentReceiver } from "./client-intent-receiver.js";
import { createLobbyClientIntentHandlers } from "./create-lobby-client-intent-handlers.js";
import { GameLifecycleManager } from "./game-lifecycle-manager.js";
import { GameStateUpdateGateway } from "./game-state-update-gateway.js";
import { LobbyState } from "./lobby-state.js";
import { PartySetupManager } from "./party-setup-manager.js";
import { SavedCharacterLoader } from "./saved-character-loader.js";
import { SavedCharactersManager } from "./saved-characters-manager.js";
import { SessionAuthorizationManager } from "./session-authorization-manager.js";
import { SessionLifecycleManager } from "./session-lifecycle-manager.js";
import { SpeedDungeonProfileLoader } from "./speed-dungeon-profile-loader.js";
import { UserSessionRegistry } from "./user-session-registry.js";
import { UserSession } from "./user-session.js";

export * from "./random-game-names.js";
export * from "./character-creation/index.js";

// give the set up game to a GameSimulator either a locally owned GameSimulator
// on the client or send it over websockets to a GameServer which owns a GameSimulator
export interface GameSimulatorHandoffStrategy {
  handoff(game: SpeedDungeonGame): void;
}

// lives either inside a LobbyServer or locally on a ClientApp
export class Lobby {
  private readonly randomNumberGenerator = new BasicRandomNumberGenerator();
  private readonly lobbyState = new LobbyState();
  private readonly userSessionRegistry = new UserSessionRegistry();

  // handler managers
  public readonly sessionAuthManager: SessionAuthorizationManager;
  public readonly gameLifecycleManager: GameLifecycleManager;
  public readonly partySetupManager: PartySetupManager;
  public readonly sessionLifecycleManager: SessionLifecycleManager;
  public readonly savedCharactersManager: SavedCharactersManager;
  public readonly characterLifecycleManager: CharacterLifecycleManager;

  constructor(
    private readonly updateGateway: GameStateUpdateGateway,
    // listens for client intents and delegates them to handlers
    private readonly clientIntentReceiver: ClientIntentReceiver,
    private readonly gameSimulatorHandoffStrategy: GameSimulatorHandoffStrategy,
    private readonly profileLoader: SpeedDungeonProfileLoader,
    private readonly savedCharacterLoader: SavedCharacterLoader,
    private readonly idGenerator: IdGenerator
  ) {
    this.clientIntentReceiver.initialize(this);

    this.sessionAuthManager = new SessionAuthorizationManager(
      this.userSessionRegistry,
      profileLoader
    );

    this.savedCharactersManager = new SavedCharactersManager(
      this.sessionAuthManager,
      this.userSessionRegistry,
      updateGateway,
      this.savedCharacterLoader
    );

    this.partySetupManager = new PartySetupManager(
      this.lobbyState,
      updateGateway,
      this.userSessionRegistry,
      this.savedCharactersManager,
      this.sessionAuthManager,
      idGenerator
    );

    this.gameLifecycleManager = new GameLifecycleManager(
      this.lobbyState,
      updateGateway,
      this.userSessionRegistry,
      this.sessionAuthManager,
      this.partySetupManager,
      idGenerator
    );

    this.characterLifecycleManager = new CharacterLifecycleManager(
      this.lobbyState,
      updateGateway,
      this.userSessionRegistry,
      this.sessionAuthManager,
      this.savedCharacterLoader,
      new CharacterCreator(
        this.idGenerator,
        new ItemGenerator(
          this.idGenerator,
          this.randomNumberGenerator,
          new AffixGenerator(this.randomNumberGenerator)
        )
      )
    );

    this.sessionLifecycleManager = new SessionLifecycleManager(
      this.lobbyState,
      updateGateway,
      this.userSessionRegistry,
      this.sessionAuthManager,
      this.savedCharactersManager
    );
  }

  private intentHandlers = createLobbyClientIntentHandlers(this);

  handleIntent(clientIntent: ClientIntent, fromUser: UserSession) {
    const handlerOption = this.intentHandlers[clientIntent.type];
    if (handlerOption === undefined) {
      throw new Error("Lobby is not configured to handle this type of ClientIntent");
    }
    // a workaround is to use "as never" for some reason
    return handlerOption(clientIntent.data as never, fromUser);
  }
}
