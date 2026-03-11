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
import { ClientApplicationSession } from "./client-application-session";
import { ClientApplicationGameContext } from "./client-application-game-context";
import { DetailableEntityFocus } from "./detailables/detailable-entity-focus";
import { ClientSingleton } from "@/singletons/lobby-client";
import { CombatantFocus } from "./combatant-focus";

export class ClientApplication {
  readonly gameClientSingleton = new ClientSingleton();
  readonly processedUpdateAwaiter = new ProcessedUpdateAwaiter<GameStateUpdate>();
  private assetService: ClientAppAssetService;
  private unregisterReplayManagerTick: () => void;
  private actionMenu = new ActionMenu();
  readonly session = new ClientApplicationSession();
  readonly gameContext: ClientApplicationGameContext;
  readonly detailableEntityFocus = new DetailableEntityFocus();
  readonly combatantFocus: CombatantFocus;
  // readonly sequentialEventProcessor: SequentialClientEventProcessor;

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
    this.gameContext = new ClientApplicationGameContext(this.session);
    this.combatantFocus = new CombatantFocus(
      this.gameClientSingleton,
      this.session,
      this.gameContext,
      this.actionMenu,
      this.detailableEntityFocus
    );
    this.detailableEntityFocus.initialize(this.combatantFocus);
    // this.sequentialEventProcessor = new SequentialClientEventProcessor(
    //   this.gameWorldView,
    //   this.actionMenu,
    //   this.gameContext,
    //   this.combatantFocus,
    //   lobbyStore,
    //   targetIndicatorStore,
    //   eventLogMessageService,
    //   replayTreeProcessor
    // );
  }

  dispose() {
    this.unregisterReplayManagerTick();
    this.gameWorldView?.dispose();
  }

  // - GameUpdateProcessedLog
  //   - passed to the GameClient->ReplayProcessor so processed replays can post to the log
  //   - exposes a waitForMessageOfTypeProcessed() for tests

  // - MiscState (stuff the frontend jsx will observe)
  //
  //   - lobbyStore = new LobbyStore();
  //   - actionMenuStore = new ActionMenuStore();
  //   - gameWorldStore = new GameWorldStore();
  //   - configStore = new ConfigStore(); // misc settings
  //   - gameEventNotificationStore = new GameEventNotificationStore();
  //
  //   - targetIndicatorStore = new TargetIndicatorStore();
  //   - dialogStore = new DialogStore();
  //   - inputStore = new InputStore(); // is alternate mode key held
  //   - imageStore = new ImagesStore(); // Images dynamically created from loaded models (combatant portraits, item thumbnails)
  //   - tooltipStore = new TooltipStore();
  //   - formsStore = new FormsStore();
  //   - hotkeysStore = new HotkeysStore();
  //
  //   - assetFetchProgressStore = new AssetFetchProgressStore();
  //   - connectionStatusStore = new ConnectionStatusStore();
  //   - http request store
  //   - Alerts (error/success toast notifications)
  //   - Asset fetch progress observer
  //   - Keybinds config
  //   - Connection status indicator
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
