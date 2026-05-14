import { GameServerName } from "../../aliases.js";
import { AuthSessionIdParser, IncomingConnectionGateway } from "../incoming-connection-gateway.js";
import { GameSessionStoreService } from "../services/game-session-store/index.js";
import { SavedCharactersService } from "../services/saved-characters.js";
import { RankedLadderService } from "../services/ranked-ladder.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { ConnectionIdentityResolutionContext } from "../services/identity-provider.js";
import { createGameServerClientIntentHandlers } from "./create-game-server-client-intent-handlers.js";
import { GameServerSessionLifecycleController } from "./controllers/session-lifecycle.js";
import { GameRegistry } from "../game-registry.js";
import { UserSession, UserSessionConnectionState } from "../sessions/user-session.js";
import { TransportDisconnectReason } from "../../transport/disconnect-reasons.js";
import { GameServerGameLifecycleController } from "./controllers/game-lifecycle/index.js";
import { RaceGameRecordsService } from "../services/race-game-records.js";
import { HeartbeatScheduler, HeartbeatTask } from "../../primatives/heartbeat.js";
import { GAME_CONFIG, GAME_RECORD_HEARTBEAT_MS, WebSocketCloseCode } from "../../app-consts.js";
import { ReconnectionOpportunityManager } from "./reconnection-opportunity-manager.js";
import { SpeedDungeonServer } from "../speed-dungeon-server.js";
import { GameServerReconnectionProtocol } from "./reconnection/index.js";
import { ConnectionContextType } from "../reconnection-protocol/index.js";
import { ConnectionEndpoint } from "../../transport/connection-endpoint.js";
import { DungeonExplorationController } from "./controllers/dungeon-exploration.js";
import { AffixGenerator } from "../../items/item-creation/affix-generator.js";
import { EquipmentRandomizer } from "../../items/item-creation/item-builder/equipment-randomizer.js";
import { ItemBuilder } from "../../items/item-creation/item-builder/index.js";
import { LootGenerator } from "../../items/item-creation/loot-generator.js";
import { AssetService } from "../services/assets/index.js";
import { AssetAnalyzer } from "./asset-analyzer/index.js";
import { CombatActionController } from "./controllers/combat-action/index.js";
import { GameModeContext } from "./controllers/game-lifecycle/game-mode-context.js";
import { CharacterProgressionController } from "./controllers/character-progression.js";
import { ItemManagementController } from "./controllers/item-management.js";
import { CraftingController } from "./controllers/crafting/index.js";
import { MiscUtilityController } from "./controllers/misc-utility-controller.js";
import {
  DungeonGenerationPolicy,
  DungeonGenerationPolicyConstructor,
} from "../../dungeon-generation/index.js";
import { RandomNumberGenerationPolicy } from "../../utility-classes/random-number-generation-policy.js";
import { MessageDispatchOutbox } from "../update-delivery/outbox.js";
import { CrossServerBroadcasterService } from "../services/cross-server-broadcaster/index.js";
import { ServerCommand } from "../services/server-command/index.js";
import { GameStateUpdate, GameStateUpdateType } from "../../packets/game-state-updates.js";
import { LADDER_UPDATES_CHANNEL_NAME } from "../../packets/channels.js";
import { GameSessionConnectionStatus } from "../sessions/global-auth-game-session.js";
import { GlobalGameSessionStore } from "../services/global-auth-game-connection-session-store/index.js";
import {
  GameServerSessionClaimToken,
  OpaqueEncryptionTokenCodec,
} from "../lobby-server/game-handoff/session-claim-token.js";
import { GuestSessionReconnectionToken } from "./reconnection/guest-session-reconnection-token.js";
import { ClientAppMessageType } from "../../packets/client-app-message.js";
import { GameMode } from "../../game-modes/index.js";

export interface GameServerExternalServices {
  gameSessionStoreService: GameSessionStoreService;
  savedCharactersService: SavedCharactersService;
  rankedLadderService: RankedLadderService;
  raceGameRecordsService: RaceGameRecordsService;
  assetService: AssetService;
  crossServerBroadcasterService: CrossServerBroadcasterService<GameStateUpdate, ServerCommand>;
  globalGameSessionStore: GlobalGameSessionStore;
}

export class GameServer extends SpeedDungeonServer {
  private readonly gameRegistry = new GameRegistry();
  private readonly itemBuilder: ItemBuilder;
  private readonly lootGenerator: LootGenerator;
  readonly dungeonGenerationPolicy: DungeonGenerationPolicy;
  private readonly heartbeatScheduler = new HeartbeatScheduler(GAME_RECORD_HEARTBEAT_MS);
  private readonly reconnectionOpportunityManager = new ReconnectionOpportunityManager();
  private readonly reconnectionProtocol: GameServerReconnectionProtocol;

  readonly assetAnalyzer: AssetAnalyzer;

  // controllers
  public readonly gameLifecycleController: GameServerGameLifecycleController;
  public readonly dungeonExplorationController: DungeonExplorationController;
  public readonly sessionLifecycleController: GameServerSessionLifecycleController;
  public readonly combatActionController: CombatActionController;
  public readonly characterProgressionController: CharacterProgressionController;
  public readonly itemManagementController: ItemManagementController;
  public readonly craftingController: CraftingController;
  public readonly miscUtilityController: MiscUtilityController;

  private readonly gameModeContexts: Record<GameMode, GameModeContext>;

  constructor(
    readonly name: GameServerName,
    protected readonly incomingConnectionGateway: IncomingConnectionGateway,
    private readonly externalServices: GameServerExternalServices,
    private readonly gameServerSessionClaimTokenCodec: OpaqueEncryptionTokenCodec<GameServerSessionClaimToken>,
    private readonly guestReconnectionTokenCodec: OpaqueEncryptionTokenCodec<GuestSessionReconnectionToken>,
    /** pass constructor so the class can use its own private parameters to instantiate it */
    dungeonGenerationPolicyConstructor: DungeonGenerationPolicyConstructor,
    public readonly rngPolicy: RandomNumberGenerationPolicy,
    private readonly idGenerator: IdGenerator,
    authSessionIdParser: AuthSessionIdParser
  ) {
    super(
      name,
      incomingConnectionGateway,
      rngPolicy,
      externalServices.crossServerBroadcasterService
    );

    const affixGenerator = new AffixGenerator(rngPolicy);
    const equipmentRandomizer = new EquipmentRandomizer(rngPolicy, affixGenerator);
    this.itemBuilder = new ItemBuilder(equipmentRandomizer);
    this.lootGenerator = new LootGenerator(this.itemBuilder, this.idGenerator, rngPolicy);
    this.dungeonGenerationPolicy = new dungeonGenerationPolicyConstructor(
      this.idGenerator,
      this.itemBuilder,
      rngPolicy
    );

    this.assetAnalyzer = new AssetAnalyzer(this.externalServices.assetService);
    this.incomingConnectionGateway.initialize((context, identityContext) => {
      return new Promise<void>((resolve, reject) => {
        this.executor.enqueue(async () => {
          try {
            await this.connectionHandler(context, identityContext);
            resolve();
          } catch (error) {
            console.info(error);
            reject(error);
          }
        });
      });
    }, authSessionIdParser);
    this.incomingConnectionGateway.listen();

    this.heartbeatScheduler.start();
    this.startActiveGamesRecordHeartbeatTask();

    this.gameModeContexts = {
      [GameMode.UnrankedRace]: new GameModeContext(
        GameMode.UnrankedRace,
        externalServices.raceGameRecordsService,
        externalServices.savedCharactersService,
        externalServices.rankedLadderService,
        this.updateDispatchFactory,
        externalServices.crossServerBroadcasterService,
        this.userSessionRegistry
      ),
      [GameMode.RankedRace]: new GameModeContext(
        GameMode.RankedRace,
        externalServices.raceGameRecordsService,
        externalServices.savedCharactersService,
        externalServices.rankedLadderService,
        this.updateDispatchFactory,
        externalServices.crossServerBroadcasterService,
        this.userSessionRegistry
      ),
      [GameMode.Ironman]: new GameModeContext(
        GameMode.Ironman,
        externalServices.raceGameRecordsService,
        externalServices.savedCharactersService,
        externalServices.rankedLadderService,
        this.updateDispatchFactory,
        externalServices.crossServerBroadcasterService,
        this.userSessionRegistry
      ),
      [GameMode.Progression]: new GameModeContext(
        GameMode.Progression,
        externalServices.raceGameRecordsService,
        externalServices.savedCharactersService,
        externalServices.rankedLadderService,
        this.updateDispatchFactory,
        externalServices.crossServerBroadcasterService,
        this.userSessionRegistry
      ),
    };

    this.dungeonExplorationController = new DungeonExplorationController(
      this.updateDispatchFactory,
      this.externalServices.savedCharactersService,
      this.idGenerator,
      rngPolicy,
      this.lootGenerator,
      this.dungeonGenerationPolicy,
      this.assetAnalyzer,
      this.gameModeContexts
    );

    this.gameLifecycleController = new GameServerGameLifecycleController(
      this.gameRegistry,
      this.userSessionRegistry,
      this.externalServices.gameSessionStoreService,
      this.externalServices.globalGameSessionStore,
      this.updateDispatchFactory,
      this.gameModeContexts,
      this.dungeonExplorationController
    );

    this.sessionLifecycleController = new GameServerSessionLifecycleController(
      this.userSessionRegistry,
      this.gameRegistry,
      this.updateDispatchFactory,
      this.gameServerSessionClaimTokenCodec
    );

    this.combatActionController = new CombatActionController(
      this.updateDispatchFactory,
      this.gameModeContexts,
      this.idGenerator,
      rngPolicy,
      this.lootGenerator,
      this.assetAnalyzer
    );

    this.characterProgressionController = new CharacterProgressionController(
      this.updateDispatchFactory
    );

    this.itemManagementController = new ItemManagementController(
      this.updateDispatchFactory,
      this.combatActionController
    );

    this.craftingController = new CraftingController(
      this.updateDispatchFactory,
      this.idGenerator,
      this.itemBuilder,
      equipmentRandomizer,
      affixGenerator
    );

    this.miscUtilityController = new MiscUtilityController(this.updateDispatchFactory);

    this.reconnectionProtocol = new GameServerReconnectionProtocol(
      this.updateDispatchFactory,
      this.reconnectionOpportunityManager,
      this.userSessionRegistry,
      this.gameLifecycleController,
      this.externalServices.globalGameSessionStore,
      this.guestReconnectionTokenCodec,
      (outbox) => this.dispatchOutboxMessages(outbox)
    );
  }

  async analyzeAssetsForGameplayRelevantData() {
    await this.assetAnalyzer.collectAnimationLengths();
    await this.assetAnalyzer.collectBoundingBoxSizes();
  }

  private intentHandlers = createGameServerClientIntentHandlers(this);

  async connectionHandler(
    connectionEndpoint: ConnectionEndpoint,
    identityResolutionContext: ConnectionIdentityResolutionContext
  ) {
    try {
      const session = await this.sessionLifecycleController.createSession(
        connectionEndpoint.id,
        identityResolutionContext
      );

      if (GAME_CONFIG.LOG_GAME_SERVER_CONNECTIONS_EVENTS) {
        this.logUserConnected(session);
      }

      this.attachIntentHandlersToSessionConnection(
        session,
        connectionEndpoint,
        this.intentHandlers
      );

      this.outgoingMessagesGateway.registerEndpoint(connectionEndpoint);

      // all sessions can listen to global ladder updates
      session.subscribeToChannel(LADDER_UPDATES_CHANNEL_NAME);

      const gameName = session.currentGameName;
      if (gameName === null) {
        throw new Error("should have been set from their token in createSession");
      }

      const existingGame = await this.gameLifecycleController.getOrInitializeGame(gameName);

      const gameIsInProgress = existingGame.getTimeStarted() !== null;
      const connectionContext = await this.reconnectionProtocol.evaluateConnectionContext(
        session,
        gameIsInProgress
      );

      let isPreemption = false;
      if (connectionContext.type === ConnectionContextType.GameServerReconnection) {
        await connectionContext.attemptReconnectionClaim();
      } else if (connectionContext.type === ConnectionContextType.GameServerSessionPreemption) {
        isPreemption = true;
        await this.preemptExistingSession(connectionContext.oldSession, session);
      }

      const outbox = await this.sessionLifecycleController.activateSession(session);

      const joinGameOutbox = await this.gameLifecycleController.joinGameHandler(gameName, session);

      await this.externalServices.globalGameSessionStore.updateSessionConnectionStatus(
        session.taggedUserId,
        GameSessionConnectionStatus.ConnectedToGameServer
      );

      outbox.pushFromOther(joinGameOutbox);

      const refreshedReconnectionTokenOutbox =
        await this.reconnectionProtocol.issueReconnectionCredential(session);
      await this.externalServices.globalGameSessionStore.updateGuestReconnectionToken(
        session.taggedUserId,
        session.getGuestReconnectionTokenOption()
      );
      outbox.pushFromOther(refreshedReconnectionTokenOutbox);

      if (isPreemption) {
        outbox.pushToConnection(session.connectionId, {
          type: GameStateUpdateType.ClientAppMessage,
          data: ClientAppMessageType.OtherConnectionPreempted,
        });
      }

      this.dispatchOutboxMessages(outbox);
    } catch (error) {
      // @TODO @ARCHITECTURE - we should instead be rejecting connections without session claim tokens
      // at the "upgrade" event on the http server, but will need to restructure to adapt to non websocket transports
      // which have no such upgrade event
      console.trace("error creating user session", error);
      let errorMessage = "";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      connectionEndpoint.close(WebSocketCloseCode.PolicyViolation, errorMessage);
    }
  }

  private async preemptExistingSession(oldSession: UserSession, newSession: UserSession) {
    // disconnect with message any other session for this user
    this.outgoingMessagesGateway.submitToConnection(oldSession.connectionId, {
      type: GameStateUpdateType.ClientAppMessage,
      data: ClientAppMessageType.DisconnectedByPreemption,
    });
    this.outgoingMessagesGateway.closeEndpoint(oldSession.connectionId);
    this.outgoingMessagesGateway.unregisterEndpoint(oldSession.connectionId);

    // returns an empty outbox (conforming to sessionLifecycleController interface)
    const outbox = await this.sessionLifecycleController.cleanupSession(oldSession);
    return outbox;
  }

  // @TODO - combine with lobby server, it is almost exact same other than disconnection session logic
  protected async disconnectionHandler(session: UserSession, reason: TransportDisconnectReason) {
    // If preemption already cleaned this session up, the registry won't have it.
    if (!this.outgoingMessagesGateway.getEndpoint(session.connectionId)) return;

    if (GAME_CONFIG.LOG_GAME_SERVER_CONNECTIONS_EVENTS) {
      this.logUserDisconnected(session, reason);
    }

    session.connectionState = UserSessionConnectionState.Disconnected;
    this.outgoingMessagesGateway.unregisterEndpoint(session.connectionId);

    // Registry-presence guard — handles connection-dropped-before-activateSession.
    // The endpoint was registered with the gateway but the session never made it
    // into the registry, so there's no game-side cleanup to do.
    if (!this.userSessionRegistry.getSessionOption(session.connectionId)) return;

    const outbox = new MessageDispatchOutbox(this.updateDispatchFactory);
    const shouldAllowReconnection = !session.intentionallyClosed;
    if (shouldAllowReconnection) {
      const reconnectionOutbox = await this.reconnectionProtocol.onPlayerDisconnected(
        session,
        this.name
      );
      outbox.pushFromOther(reconnectionOutbox);
    }

    const cleanupSessionOutbox = await this.sessionLifecycleController.cleanupSession(session);
    outbox.pushFromOther(cleanupSessionOutbox);

    this.dispatchOutboxMessages(outbox);
  }

  private startActiveGamesRecordHeartbeatTask() {
    const heartbeat = new HeartbeatTask(GAME_RECORD_HEARTBEAT_MS, () => {
      for (const [gameName, game] of this.gameRegistry.games) {
        this.externalServices.gameSessionStoreService.refreshActiveGameStatus(gameName);
      }
    });

    this.heartbeatScheduler.register(heartbeat);
  }
}
