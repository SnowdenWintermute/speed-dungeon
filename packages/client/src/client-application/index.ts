import {
  AssetCache,
  ClientAppAssetService,
  GameStateUpdate,
  RemoteServerAssetStore,
} from "@speed-dungeon/common";
import { ProcessedUpdateAwaiter } from "./event-latch";
import { ActionMenu } from "./action-menu";
import { ClientApplicationSession } from "./client-application-session";
import { ClientApplicationGameContext } from "./client-application-game-context";
import { DetailableEntityFocus } from "./detailables/detailable-entity-focus";
import { CombatantFocus } from "./combatant-focus";
import { ClientApplicationLobbyContext } from "./client-application-lobby-context";
import { TargetIndicatorStore } from "./target-indicator-store";
import { EventLogStore } from "./event-log/event-log-store";
import { FloatingMessagesStore } from "./event-log/floating-messages-store";
import { EventLogGameMessageService } from "./event-log/event-log-service";
import { FloatingMessageService } from "./event-log/floating-messages-service";
import { AlertsService } from "./alerts";
import { TickScheduler } from "./replay-execution/replay-tree-tick-schedulers";
import { ReplayTreeScheduler } from "./replay-execution/replay-tree-scheduler";
import { ImageStore } from "./image-store";
import { GameWorldView } from "@/xxNEW-game-world-view";
import { UiStore } from "./ui";
import { ClientSingleton } from "./clients/singleton";
import { ClientSequentialEventProcessor } from "./sequential-event-processor";

export class ClientApplication {
  // clients
  readonly gameClientRef = new ClientSingleton();
  readonly lobbyClientRef = new ClientSingleton();
  readonly assetService: ClientAppAssetService;

  // event processing
  readonly processedUpdateAwaiter = new ProcessedUpdateAwaiter<GameStateUpdate>();
  readonly replayTreeScheduler: ReplayTreeScheduler;
  readonly sequentialEventProcessor: ClientSequentialEventProcessor;
  private unregisterReplayManagerTick: () => void;

  // core state
  readonly session = new ClientApplicationSession();
  readonly gameContext: ClientApplicationGameContext;
  readonly lobbyContext = new ClientApplicationLobbyContext();

  // ui state
  readonly actionMenu = new ActionMenu(this);
  readonly combatantFocus: CombatantFocus;
  readonly detailableEntityFocus = new DetailableEntityFocus();
  readonly targetIndicatorStore: TargetIndicatorStore;
  readonly imageStore = new ImageStore();
  readonly uiStore = new UiStore();

  // notifications/user readable logs
  readonly eventLogStore = new EventLogStore();
  readonly eventLogMessageService: EventLogGameMessageService;
  readonly floatingMessagesStore = new FloatingMessagesStore();
  readonly floatingMessagesService = new FloatingMessageService(this.floatingMessagesStore);
  readonly alertsService = new AlertsService();

  constructor(
    readonly gameWorldView: null | GameWorldView,
    assetCache: AssetCache, // determined by the environment (browser, test, electron, capacitor)
    assetServerUrl: string,
    replayManagerTickScheduler: TickScheduler
  ) {
    const remoteStore = new RemoteServerAssetStore(assetServerUrl);
    this.assetService = new ClientAppAssetService(remoteStore, assetCache, new Map(), () => true);
    this.unregisterReplayManagerTick = replayManagerTickScheduler(() =>
      this.replayTreeScheduler.tick()
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
    this.targetIndicatorStore = new TargetIndicatorStore();
    this.eventLogMessageService = new EventLogGameMessageService(this);
    this.replayTreeScheduler = new ReplayTreeScheduler(this);
    this.sequentialEventProcessor = new ClientSequentialEventProcessor(this);
  }

  dispose() {
    this.unregisterReplayManagerTick();
    this.gameWorldView?.dispose();
  }

  // TODO
  // - change how character model divs are positioned to use transform: translate instead of absolute + top/left

  //
  // - ConnectionTopologyManager (change between online/offline mode and manage persistence of choice/error states)
  //   - ConnectionEndpointFactory
  //     - Configured to open runtime dependent Websocket (node or browser version) or InMemoryTransport connections (in offline)
  //   - OfflineGameServer
  //   - OfflineLobbyServer
  //   - LobbyClient
  //     - client application
  //     - ConnectionEndpoint
  //     - Event handlers
  //     - Message dispatcher
  //   - GameClient
  //     - client application
  //     - ConnectionEndpoint
  //     - Event handlers
  //     - Message dispatcher
  //
  // - GameUpdateProcessedLog
  //   - passed to the GameClient->ReplayProcessor so processed replays can post to the log
  //   - exposes a waitForMessageOfTypeProcessed() for tests
}
