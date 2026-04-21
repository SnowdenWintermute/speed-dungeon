import {
  AssetCache,
  ClientAppAssetService,
  Deferred,
  RemoteServerAssetStore,
  ClientRemoteConnectionEndpointFactory,
  ClientSequentialEventType,
  SerializedOf,
  Battle,
} from "@speed-dungeon/common";
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
import { ErrorRecordService } from "./error-record-service";
import { ClientLogRecorder } from "./client-log-recorder";
import { TickScheduler } from "./replay-execution/replay-tree-tick-schedulers";
import { ReplayTreeScheduler } from "./replay-execution/replay-tree-scheduler";
import { ImageStore } from "./image-store";
import { UiStore } from "./ui";
import { ClientSingleton } from "./clients/singleton";
import { ClientSequentialEventProcessor } from "./sequential-event-processor";
import { GameWorldView } from "@/game-world-view";
import { BroadcastChannelMananger } from "./broadcast-channel";
import { ConnectionTopology } from "./connection-topology";
import { GameClient } from "./clients/game";
import { LobbyClient } from "./clients/lobby";
import { ReconnectionTokenStore } from "./reconnection-token-store";
import { RootActionMenuScreen } from "./action-menu/screens/root";

/* composition root for frontend subsystems */
export class ClientApplication {
  private _gameWorldView: null | GameWorldView = null;
  // clients
  readonly gameClientRef = new ClientSingleton<GameClient>();
  readonly lobbyClientRef = new ClientSingleton<LobbyClient>();
  readonly assetService: ClientAppAssetService;

  // event processing
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
  readonly errorRecordService = new ErrorRecordService();
  readonly clientLogRecorder: ClientLogRecorder;

  // browser tab sync
  readonly broadcastChannel: BroadcastChannelMananger;

  // topology
  readonly topologyManager: ConnectionTopology;
  readonly transitionToGameServer = new Deferred();
  readonly waitForReconnectionInstructions = new Deferred();
  readonly transitionToLobbyServer = new Deferred();

  constructor(
    assetCache: AssetCache, // determined by the environment (browser, test, electron, capacitor)
    assetServerUrl: string,
    public lobbyServerUrl: string,
    replayManagerTickScheduler: TickScheduler,
    clientLogRecorder: ClientLogRecorder,
    remoteEndpointFactory: ClientRemoteConnectionEndpointFactory,
    readonly reconnectionTokenStore: ReconnectionTokenStore
  ) {
    const remoteStore = new RemoteServerAssetStore(assetServerUrl);
    this.assetService = new ClientAppAssetService(remoteStore, assetCache, new Map(), () => true);
    this.clientLogRecorder = clientLogRecorder;

    this.topologyManager = new ConnectionTopology(this, remoteEndpointFactory);

    this.replayTreeScheduler = new ReplayTreeScheduler(this);
    this.unregisterReplayManagerTick = replayManagerTickScheduler((deltaMs) =>
      this.replayTreeScheduler.tick(deltaMs)
    );

    this.gameContext = new ClientApplicationGameContext(this.session);
    this.combatantFocus = new CombatantFocus(this);
    this.detailableEntityFocus.initialize(this.combatantFocus);
    this.targetIndicatorStore = new TargetIndicatorStore();
    this.eventLogMessageService = new EventLogGameMessageService(this);
    this.sequentialEventProcessor = new ClientSequentialEventProcessor(this);
    this.broadcastChannel = new BroadcastChannelMananger(
      this.lobbyClientRef,
      this.uiStore.httpRequests
    );
  }

  setReplayManagerTickScheduler(scheduler: TickScheduler) {
    this.unregisterReplayManagerTick();
    this.unregisterReplayManagerTick = scheduler((deltaMs) =>
      this.replayTreeScheduler.tick(deltaMs)
    );
  }

  dispose() {
    this.unregisterReplayManagerTick();
    this.gameWorldView?.dispose();
  }

  setGameWorldView(gameWorldView: GameWorldView) {
    this._gameWorldView = gameWorldView;
  }

  clearGameWorldView() {
    this._gameWorldView?.dispose();
    this._gameWorldView = null;
  }

  get gameWorldView() {
    return this._gameWorldView;
  }

  handleGameStartedOrFullUpdateReceived() {
    this.actionMenu.initialize(new RootActionMenuScreen(this));

    this.combatantFocus.focusFirstOwnedCharacter();

    const { game, party } = this.combatantFocus.requireFocusedCharacterContext();

    if (!game.getTimeStarted()) {
      game.setAsStarted();
    }

    this.gameWorldView?.setDefaultCameraPositionForGame();
    party.dungeonExplorationManager.setCurrentFloor(game.selectedStartingFloor);
    this.gameWorldView?.environment.groundPlane.clear();

    const { combatantManager } = party;

    combatantManager.updateHomePositions();
    combatantManager.setAllCombatantsToHomePositions();
    this.sequentialEventProcessor.scheduleEvent({
      type: ClientSequentialEventType.SynchronizeCombatantModels,
      data: { softCleanup: true, placeInHomePositions: true },
    });
  }

  handleBattleFullUpdate(serializedBattleOption: SerializedOf<Battle> | null) {
    console.log("getting battle full update");
    const { game, party } = this.combatantFocus.requireFocusedCharacterContext();

    if (serializedBattleOption === null) {
      game.battles.clear();
      return;
    }

    const deserializedBattle = Battle.fromSerialized(serializedBattleOption);
    party.setBattleId(deserializedBattle.id);
    deserializedBattle.initialize(game, party);
    deserializedBattle.makeObservable();
    game.battles.set(deserializedBattle.id, deserializedBattle);

    const currentActorIsPlayerControlled =
      deserializedBattle.turnOrderManager.currentActorIsPlayerControlled(party);

    const turnTracker = deserializedBattle.turnOrderManager.getFastestActorTurnOrderTracker();
    this.combatantFocus.handleBattleStart(turnTracker);

    if (!currentActorIsPlayerControlled) {
      // it is ai controlled so lock input
      party.inputLock.lockInput();
    }
  }
}
