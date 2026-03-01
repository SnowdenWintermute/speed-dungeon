import { GameServerName, Milliseconds } from "../../aliases.js";
import { IncomingConnectionGateway } from "../incoming-connection-gateway.js";
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
import { ONE_SECOND } from "../../app-consts.js";
import { PartyDelayedGameMessageFactory } from "./party-delayed-game-message-factory.js";
import { ReconnectionOpportunityManager } from "./reconnection-opportunity-manager.js";
import { SpeedDungeonServer } from "../speed-dungeon-server.js";
import { GameServerSessionClaimTokenCodec } from "../lobby-server/game-handoff/session-claim-token.js";
import { GameServerReconnectionProtocol } from "./reconnection/index.js";
import { ConnectionContextType } from "../reconnection-protocol/index.js";
import { ActiveGameStatus } from "../services/game-session-store/active-game-status.js";
import { ConnectionEndpoint } from "../../transport/connection-endpoint.js";
import { DungeonExplorationController } from "./controllers/dungeon-exploration.js";
import { ItemGenerator } from "../../items/item-creation/index.js";
import { AffixGenerator } from "../../items/item-creation/builders/affix-generator/index.js";
import { GameServerGameEventCommandReceiver } from "./controllers/game-event-command-receiver.js";
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

export interface GameServerExternalServices {
  gameSessionStoreService: GameSessionStoreService;
  reconnectionForwardingStoreService: ReconnectionForwardingStoreService;
  savedCharactersService: SavedCharactersService;
  rankedLadderService: RankedLadderService;
  raceGameRecordsService: RaceGameRecordsService;
  assetService: AssetService;
}

export const GAME_RECORD_HEARTBEAT_MS: Milliseconds = ONE_SECOND * 10;

export class GameServer extends SpeedDungeonServer {
  private readonly gameRegistry = new GameRegistry();
  private readonly idGenerator = new IdGenerator({ saveHistory: false });
  private readonly itemGenerator: ItemGenerator;
  private readonly heartbeatScheduler = new HeartbeatScheduler(GAME_RECORD_HEARTBEAT_MS);
  private readonly reconnectionOpportunityManager = new ReconnectionOpportunityManager();
  private readonly reconnectionProtocol: GameServerReconnectionProtocol;

  private readonly partyDelayedGameMessageFactory = new PartyDelayedGameMessageFactory(
    this.updateDispatchFactory
  );

  private readonly assetAnalyzer: AssetAnalyzer;

  // controllers
  public readonly gameLifecycleController: GameServerGameLifecycleController;
  public readonly dungeonExplorationController: DungeonExplorationController;
  public readonly sessionLifecycleController: GameServerSessionLifecycleController;
  public readonly combatActionController: CombatActionController;
  public readonly characterProgressionController: CharacterProgressionController;
  public readonly itemManagementController: ItemManagementController;
  public readonly craftingController: CraftingController;
  public readonly miscUtilityController: MiscUtilityController;

  private readonly gameEventCommandReceiver: GameServerGameEventCommandReceiver;
  private readonly gameModeContexts: Record<GameMode, GameModeContext>;

  constructor(
    readonly name: GameServerName,
    protected readonly incomingConnectionGateway: IncomingConnectionGateway,
    private readonly externalServices: GameServerExternalServices,
    private readonly gameServerSessionClaimTokenCodec: GameServerSessionClaimTokenCodec
  ) {
    super(name, incomingConnectionGateway);

    this.assetAnalyzer = new AssetAnalyzer(this.externalServices.assetService);

    this.itemGenerator = new ItemGenerator(
      this.idGenerator,
      this.randomNumberGenerator,
      new AffixGenerator(this.randomNumberGenerator)
    );

    this.incomingConnectionGateway.initialize(
      async (context, identityContext) => await this.handleConnection(context, identityContext)
    );
    this.incomingConnectionGateway.listen();

    this.heartbeatScheduler.start();
    this.startActiveGamesRecordHeartbeatTask();

    this.gameModeContexts = {
      [GameMode.Race]: new GameModeContext(
        GameMode.Race,
        externalServices.raceGameRecordsService,
        externalServices.savedCharactersService,
        externalServices.rankedLadderService
      ),
      [GameMode.Progression]: new GameModeContext(
        GameMode.Progression,
        externalServices.raceGameRecordsService,
        externalServices.savedCharactersService,
        externalServices.rankedLadderService
      ),
    };

    this.gameEventCommandReceiver = new GameServerGameEventCommandReceiver(
      this.gameRegistry,
      this.gameModeContexts
    );

    this.dungeonExplorationController = new DungeonExplorationController(
      this.updateDispatchFactory,
      this.partyDelayedGameMessageFactory,
      this.externalServices.savedCharactersService,
      this.idGenerator,
      this.itemGenerator,
      this.randomNumberGenerator,
      this.gameEventCommandReceiver,
      this.assetAnalyzer,
      this.gameModeContexts
    );

    this.gameLifecycleController = new GameServerGameLifecycleController(
      this.gameRegistry,
      this.userSessionRegistry,
      this.externalServices.gameSessionStoreService,
      this.updateDispatchFactory,
      this.partyDelayedGameMessageFactory,
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
      this.idGenerator,
      this.itemGenerator,
      this.randomNumberGenerator,
      this.gameEventCommandReceiver,
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
      this.itemGenerator
    );

    this.miscUtilityController = new MiscUtilityController(this.updateDispatchFactory);

    this.reconnectionProtocol = new GameServerReconnectionProtocol(
      this.updateDispatchFactory,
      externalServices.reconnectionForwardingStoreService,
      this.reconnectionOpportunityManager,
      this.gameLifecycleController,
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
    const session = await this.sessionLifecycleController.createSession(
      connectionEndpoint.id,
      identityResolutionContext
    );
    this.logUserConnected(session);

    this.outgoingMessagesGateway.registerEndpoint(connectionEndpoint);

    const gameName = session.currentGameName;
    if (gameName === null) {
      throw new Error("should have been set from their token in createSession");
    }

    const existingGame = await this.gameLifecycleController.getOrInitializeGame(gameName);

    this.attachIntentHandlersToSessionConnection(session, connectionEndpoint, this.intentHandlers);

    const gameIsInProgress = existingGame.getTimeStarted() !== null;
    const connectionContext = await this.reconnectionProtocol.evaluateConnectionContext(
      session,
      gameIsInProgress
    );

    if (connectionContext.type === ConnectionContextType.Reconnection) {
      await connectionContext.attemptReconnectionClaim();
    }

    const outbox = await this.sessionLifecycleController.activateSession(session);

    const joinGameOutbox = await this.gameLifecycleController.joinGameHandler(gameName, session);
    outbox.pushFromOther(joinGameOutbox);

    const refreshedReconnectionTokenOutbox =
      await this.reconnectionProtocol.issueReconnectionCredential(session);
    outbox.pushFromOther(refreshedReconnectionTokenOutbox);

    this.dispatchOutboxMessages(outbox);
  }

  private logUserConnected(session: UserSession) {
    const { username, taggedUserId, connectionId } = session;
    console.info(
      `-- ${username} (user id: ${taggedUserId.id}, connection id: ${connectionId}) joined the [${this.name}] game server`
    );
  }

  // @TODO - combine with lobby server, it is almost exact same other than disconnection session logic
  protected async disconnectionHandler(session: UserSession, reason: TransportDisconnectReason) {
    console.info(
      `-- ${session.username} (${session.connectionId}) disconnected from ${this.name} game server.`
    );

    session.connectionState = UserSessionConnectionState.Disconnected;
    this.outgoingMessagesGateway.unregisterEndpoint(session.connectionId);

    const outbox = await this.reconnectionProtocol.onPlayerDisconnected(session, this.name);

    const cleanupSessionOutbox = await this.sessionLifecycleController.cleanupSession(session);
    outbox.pushFromOther(cleanupSessionOutbox);

    this.dispatchOutboxMessages(outbox);
  }

  private startActiveGamesRecordHeartbeatTask() {
    const heartbeat = new HeartbeatTask(GAME_RECORD_HEARTBEAT_MS, () => {
      // currently overwrites but could just update - this is simpler for now
      for (const [gameName, game] of this.gameRegistry.games)
        this.externalServices.gameSessionStoreService.writeActiveGameStatus(
          gameName,
          new ActiveGameStatus(gameName, game.id)
        );
    });

    this.heartbeatScheduler.register(heartbeat);
  }
}
