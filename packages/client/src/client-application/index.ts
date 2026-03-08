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

export class ClientApplication {
  public processedUpdateAwaiter = new ProcessedUpdateAwaiter<GameStateUpdate>();
  private assetService: ClientAppAssetService;
  private unregisterReplayManagerTick: () => void;

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

  // - GameEventLog
  //   - passed to the GameClient->ReplayProcessor so processed replays can post to the log
  //   - exposes a waitForMessageOfTypeProcessed() for tests
  //   - observable getUserReadable() to show a WoW style "combat log"

  // - MenuState (what menu is open, what page, what is hovered, what character is focused)
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
