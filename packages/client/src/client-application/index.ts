import { GameWorldView } from "@/game-world-view";
import {
  AssetCache,
  ClientAppAssetService,
  GameStateUpdate,
  RemoteServerAssetStore,
} from "@speed-dungeon/common";
import { ProcessedUpdateAwaiter } from "./event-latch";
import { ReplayTreeProcessorManager } from "@/replay-tree-manager";
import { ActionMenu } from "./action-menu";
import { ClientApplicationSession } from "./client-application-session";
import { ClientApplicationGameContext } from "./client-application-game-context";
import { DetailableEntityFocus } from "./detailables/detailable-entity-focus";
import { ClientSingleton } from "@/singletons/lobby-client";
import { CombatantFocus } from "./combatant-focus";
import { ClientApplicationLobbyContext } from "./client-application-lobby-context";
import { TargetIndicatorStore } from "./target-indicator-store";
import { EventLogStore } from "./event-log/event-log-store";
import { FloatingMessagesStore } from "./event-log/floating-messages-store";
import { EventLogGameMessageService } from "./event-log/event-log-service";
import { FloatingMessageService } from "./event-log/floating-messages-service";
import { SequentialClientEventProcessor } from "./sequential-client-event-processor";
import { KeybindConfig } from "./inputs/keybind-config";
import { InputStore } from "./inputs/input-store";
import { AlertsService } from "./alerts";
import { DialogStore } from "./dialog-store";
import { TickScheduler } from "./replay-execution/replay-tree-tick-schedulers";

export class ClientApplication {
  // clients
  readonly gameClientRef = new ClientSingleton();

  // event processing
  readonly processedUpdateAwaiter = new ProcessedUpdateAwaiter<GameStateUpdate>();
  // readonly sequentialEventProcessor: SequentialClientEventProcessor;
  private unregisterReplayManagerTick: () => void;

  private assetService: ClientAppAssetService;

  // core state
  readonly session = new ClientApplicationSession();
  readonly gameContext: ClientApplicationGameContext;
  readonly lobbyContext = new ClientApplicationLobbyContext();

  // ui state
  readonly actionMenu = new ActionMenu(this);
  readonly combatantFocus: CombatantFocus;
  readonly detailableEntityFocus = new DetailableEntityFocus();
  readonly targetIndicatorStore: TargetIndicatorStore;
  readonly inputStore = new InputStore();
  readonly dialogStore = new DialogStore();

  // notifications/user readable logs
  readonly eventLogStore = new EventLogStore();
  readonly eventLogMessageService: EventLogGameMessageService;
  readonly floatingMessagesStore = new FloatingMessagesStore();
  readonly floatingMessagesService = new FloatingMessageService(this.floatingMessagesStore);
  readonly alertsService = new AlertsService();

  // user config
  readonly keybindConfig = new KeybindConfig();

  constructor(
    readonly gameWorldView: null | GameWorldView,
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
      this.gameClientRef,
      this.session,
      this.gameContext,
      this.actionMenu,
      this.detailableEntityFocus
    );
    this.detailableEntityFocus.initialize(this.combatantFocus);
    this.targetIndicatorStore = new TargetIndicatorStore(this.gameWorldView);
    this.eventLogMessageService = new EventLogGameMessageService(this);
    // this.sequentialEventProcessor = new SequentialClientEventProcessor(
    //   this.replayTreeProcessor,
    //   this.gameWorldView,
    //   this.actionMenu,
    //   this.gameContext,
    //   this.combatantFocus,
    //   this.lobbyContext,
    //   this.targetIndicatorStore,
    //   this.eventLogMessageService
    // );
  }

  dispose() {
    this.unregisterReplayManagerTick();
    this.gameWorldView?.dispose();
  }

  // TODO
  // - move replay tree
  // - remove AppStore.get() calls inside gameWorldView, replace with initialized ClientApplication
  // - change how character model divs are positioned to use transform: translate instead of absolute + top/left

  // - MiscState (stuff the frontend jsx will observe)
  //   - gameWorldStore = new GameWorldStore();
  //   - configStore = new ConfigStore(); // misc settings
  //
  //   - dialogStore = new DialogStore();
  //   - imageStore = new ImagesStore(); // Images dynamically created from loaded models (combatant portraits, item thumbnails)
  //   - tooltipStore = new TooltipStore();
  //   - formsStore = new FormsStore();
  //
  //   - assetFetchProgressStore = new AssetFetchProgressStore();
  //   - connectionStatusStore = new ConnectionStatusStore();
  //   - http request store
  //   - Asset fetch progress observer
  //   - Connection status indicator
  //
  // - GameUpdateProcessedLog
  //   - passed to the GameClient->ReplayProcessor so processed replays can post to the log
  //   - exposes a waitForMessageOfTypeProcessed() for tests
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
