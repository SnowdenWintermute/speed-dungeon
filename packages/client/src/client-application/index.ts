import { GameWorldView } from "@/game-world-view";
import {
  AssetCache,
  ClientAppAssetService,
  GameStateUpdate,
  RemoteServerAssetStore,
} from "@speed-dungeon/common";
import { ProcessedUpdateAwaiter } from "./event-latch";
import { ReplayTreeProcessorManager } from "@/replay-tree-manager";
import { TickScheduler } from "./replay-tree-manager/replay-tree-tick-schedulers";
import { ActionMenu } from "./action-menu";

export class ClientApplication {
  public processedUpdateAwaiter = new ProcessedUpdateAwaiter<GameStateUpdate>();
  private assetService: ClientAppAssetService;
  private unregisterReplayManagerTick: () => void;
  private actionMenu = new ActionMenu();

  constructor(
    private gameWorldView: null | GameWorldView,
    private replayProcessorManager: ReplayTreeProcessorManager,
    assetCache: AssetCache,
    assetServerUrl: string,
    replayManagerTickScheduler: TickScheduler
  ) {
    const remoteStore = new RemoteServerAssetStore(assetServerUrl);
    this.assetService = new ClientAppAssetService(remoteStore, assetCache, new Map(), () => true);
    this.unregisterReplayManagerTick = replayManagerTickScheduler(() =>
      this.replayProcessorManager.tick()
    );
  }

  dispose() {
    this.unregisterReplayManagerTick();
    this.gameWorldView?.dispose();
  }

  // export class GameStore {
  //   private game: null | SpeedDungeonGame = null;

  // CLIENT APP GENERAL
  //   private username: null | Username = null;
  //   private focusedCharacterId: CombatantId | null = null;
  //   getUsernameOption() {}
  //   getExpectedUsername() {}
  //   setUsername(username: Username) {}
  //   clearUsername() {}
  // GAME CLIENT
  //   setGame(game: SpeedDungeonGame) {}
  //   clearGame() {}
  //   getExpectedClientPlayer() {}
  //   getGameOption() {}
  //   getExpectedGame() {}
  //   getExpectedCombatantContext(combatantId: EntityId): CombatantContext {}
  //   getExpectedPlayerContext(username: Username) {}
  //   getPartyOption() {}
  //   getExpectedParty() {} // getExpectedClientParty()
  //   private getExpectedPlayer(username: Username) {} // getExpectedClientPlayer()
  //   getCombatantOption(combatantId: EntityId) {}
  //   getExpectedCombatant(combatantId: EntityId) {}
  //   private clientUserControlsCombatant(combatantId: string) {}
  //
  // FOCUSED CHARACTER
  //   getFocusedCharacterContext() {}
  //   setFocusedCharacter(entityId: CombatantId) {}
  //   private handleCharacterUnfocused(id: CombatantId) {}
  //   characterIsFocused(entityId: EntityId) {}
  //   getFocusedCharacterIdOption() {}
  //   getExpectedFocusedCharacterId() {}
  //   getExpectedFocusedCharacter() {}
  //   getFocusedCharacterOption: () => undefined | Combatant = () => {};
  //   clientUserControlsFocusedCombatant(options?: { includePets: boolean }) {}
  //
  // }

  // - GameUpdateProcessedLog
  //   - passed to the GameClient->ReplayProcessor so processed replays can post to the log
  //   - exposes a waitForMessageOfTypeProcessed() for tests

  // - MiscState (stuff the frontend jsx will observe)
  //   - Alerts (error/success toast notifications)
  //   - Input state (is alternate mode key held)
  //   - Asset fetch progress observer
  //   - Misc UI Config
  //   - Keybinds config
  //   - Connection status indicator
  //   - Images dynamically created from loaded models (combatant portraits, item thumbnails)
  //
  // - RuntimeEnvironmentManager (change between online/offline mode and manage persistence of choice/error states)
  //   - ConnectionEndpointFactory
  //     - Configured to open runtime dependent Websocket (node or browser version) or InMemoryTransport connections (in offline)
  //   - OfflineGameServer
  //   - OfflineLobbyServer
  //   - LobbyClient
  //     - GameWorldView (optional)
  //     - ConnectionEndpoint
  //     - Event handlers
  //     - Message dispatcher
  //     - LobbyState
  //     - SavedCharactersManager
  //   - GameClient
  //     - GameWorldView (optional)
  //     - ConnectionEndpoint
  //     - Event handlers
  //     - Message dispatcher
  //     - GameState
  //     - ReplayTreeProcessorManager
}
