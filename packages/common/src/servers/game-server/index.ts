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
import { GameServerSessionClaimTokenCodec } from "../lobby-server/game-handoff/session-claim-token.js";
import { GameServerReconnectionProtocol } from "./reconnection/index.js";
import { ConnectionContextType } from "../reconnection-protocol/index.js";
import { ActiveGameStatus } from "../services/game-session-store/active-game-status.js";
import { ConnectionEndpoint } from "../../transport/connection-endpoint.js";
import { DungeonExplorationController } from "./controllers/dungeon-exploration.js";
import { AffixGenerator } from "../../items/item-creation/affix-generator.js";
import { EquipmentRandomizer } from "../../items/item-creation/item-builder/equipment-randomizer.js";
import { ItemBuilder } from "../../items/item-creation/item-builder/index.js";
import { LootGenerator } from "../../items/item-creation/loot-generator.js";
import { ReconnectionForwardingStoreService } from "../services/reconnection-forwarding-store/index.js";
import { AssetService } from "../services/assets/index.js";
import { AssetAnalyzer } from "./asset-analyzer/index.js";
import { CombatActionController } from "./controllers/combat-action/index.js";
import { GameMode } from "../../types.js";
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
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { LADDER_UPDATES_CHANNEL_NAME } from "../../packets/channels.js";

export interface GameServerExternalServices {
  gameSessionStoreService: GameSessionStoreService;
  reconnectionForwardingStoreService: ReconnectionForwardingStoreService;
  savedCharactersService: SavedCharactersService;
  rankedLadderService: RankedLadderService;
  raceGameRecordsService: RaceGameRecordsService;
  assetService: AssetService;
  crossServerBroadcasterService: CrossServerBroadcasterService<GameStateUpdate>;
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
    private readonly gameServerSessionClaimTokenCodec: GameServerSessionClaimTokenCodec,
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
            await this.handleConnection(context, identityContext);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });
    }, authSessionIdParser);
    this.incomingConnectionGateway.listen();

    this.heartbeatScheduler.start();
    this.startActiveGamesRecordHeartbeatTask();

    this.gameModeContexts = {
      [GameMode.Race]: new GameModeContext(
        GameMode.Race,
        externalServices.raceGameRecordsService,
        externalServices.savedCharactersService,
        externalServices.rankedLadderService,
        this.updateDispatchFactory
      ),
      [GameMode.Progression]: new GameModeContext(
        GameMode.Progression,
        externalServices.raceGameRecordsService,
        externalServices.savedCharactersService,
        externalServices.rankedLadderService,
        this.updateDispatchFactory
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
      this.externalServices.reconnectionForwardingStoreService,
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
      externalServices.reconnectionForwardingStoreService,
      this.reconnectionOpportunityManager,
      this.gameLifecycleController,
      this.externalServices.gameSessionStoreService,
      (outbox) => this.dispatchOutboxMessages(outbox)
    );
  }

  async analyzeAssetsForGameplayRelevantData() {
    await this.assetAnalyzer.collectAnimationLengths();
    await this.assetAnalyzer.collectBoundingBoxSizes();
  }

  private intentHandlers = createGameServerClientIntentHandlers(this);

  async handleConnection(
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

      this.outgoingMessagesGateway.registerEndpoint(connectionEndpoint);

      // all sessions can listen to global ladder updates
      session.subscribeToChannel(LADDER_UPDATES_CHANNEL_NAME);

      const gameName = session.currentGameName;
      if (gameName === null) {
        throw new Error("should have been set from their token in createSession");
      }

      const existingGame = await this.gameLifecycleController.getOrInitializeGame(gameName);

      this.attachIntentHandlersToSessionConnection(
        session,
        connectionEndpoint,
        this.intentHandlers
      );

      const gameIsInProgress = existingGame.getTimeStarted() !== null;
      const connectionContext = await this.reconnectionProtocol.evaluateConnectionContext(
        session,
        gameIsInProgress
      );

      if (connectionContext.type === ConnectionContextType.Reconnection) {
        await connectionContext.attemptReconnectionClaim();
      } else if (gameIsInProgress) {
        throw new Error("Tried to join a game in progress without a reconnection claim");
      }

      const outbox = await this.sessionLifecycleController.activateSession(session);

      const joinGameOutbox = await this.gameLifecycleController.joinGameHandler(gameName, session);

      outbox.pushFromOther(joinGameOutbox);

      const refreshedReconnectionTokenOutbox =
        await this.reconnectionProtocol.issueReconnectionCredential(session);
      outbox.pushFromOther(refreshedReconnectionTokenOutbox);

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

  // @TODO - combine with lobby server, it is almost exact same other than disconnection session logic
  protected async disconnectionHandler(session: UserSession, reason: TransportDisconnectReason) {
    if (GAME_CONFIG.LOG_GAME_SERVER_CONNECTIONS_EVENTS) {
      this.logUserDisconnected(session, reason);
    }

    session.connectionState = UserSessionConnectionState.Disconnected;
    this.outgoingMessagesGateway.unregisterEndpoint(session.connectionId);

    const outbox = new MessageDispatchOutbox(this.updateDispatchFactory);
    if (!session.intentionallyClosed) {
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
      // currently overwrites but could just update - this is simpler for now
      for (const [gameName, game] of this.gameRegistry.games) {
        this.externalServices.gameSessionStoreService.refreshActiveGameStatus(gameName);
      }
    });

    this.heartbeatScheduler.register(heartbeat);
  }
}
