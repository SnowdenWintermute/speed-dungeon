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
import { PLACEHOLDER_ANIMATION_LENGTHS } from "../../types.js";
import { ReconnectionForwardingStoreService } from "../services/reconnection-forwarding-store/index.js";

export interface GameServerExternalServices {
  gameSessionStoreService: GameSessionStoreService;
  reconnectionForwardingStoreService: ReconnectionForwardingStoreService;
  savedCharactersService: SavedCharactersService;
  rankedLadderService: RankedLadderService;
  raceGameRecordsService: RaceGameRecordsService;
}

export const GAME_RECORD_HEARTBEAT_MS: Milliseconds = ONE_SECOND * 10;

export class GameServer extends SpeedDungeonServer {
  private readonly gameRegistry = new GameRegistry();
  private readonly idGenerator = new IdGenerator({ saveHistory: false });
  private readonly itemGenerator: ItemGenerator;
  private readonly heartbeatScheduler = new HeartbeatScheduler(GAME_RECORD_HEARTBEAT_MS);
  private readonly reconnectionOpportunityManager = new ReconnectionOpportunityManager();
  private readonly reconnectionProtocol: GameServerReconnectionProtocol;
  private readonly pendingDisconnections: Promise<void>[] = [];

  private readonly partyDelayedGameMessageFactory = new PartyDelayedGameMessageFactory(
    this.updateDispatchFactory
  );

  // controllers
  public readonly gameLifecycleController: GameServerGameLifecycleController;
  public readonly dungeonExplorationController: DungeonExplorationController;
  public readonly sessionLifecycleController: GameServerSessionLifecycleController;
  // public readonly savedCharactersController: SavedCharactersController;
  private readonly gameEventCommandReceiver: GameServerGameEventCommandReceiver;

  constructor(
    readonly name: GameServerName,
    protected readonly incomingConnectionGateway: IncomingConnectionGateway,
    private readonly externalServices: GameServerExternalServices,
    private readonly gameServerSessionClaimTokenCodec: GameServerSessionClaimTokenCodec
  ) {
    super(name, incomingConnectionGateway);

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

    this.gameLifecycleController = new GameServerGameLifecycleController(
      this.gameRegistry,
      this.userSessionRegistry,
      this.externalServices.gameSessionStoreService,
      this.externalServices.raceGameRecordsService,
      this.externalServices.savedCharactersService,
      this.externalServices.rankedLadderService,
      this.updateDispatchFactory,
      this.partyDelayedGameMessageFactory
    );

    this.sessionLifecycleController = new GameServerSessionLifecycleController(
      this.userSessionRegistry,
      this.gameRegistry,
      this.updateDispatchFactory,
      this.gameLifecycleController,
      this.idGenerator,
      this.gameServerSessionClaimTokenCodec
    );

    this.gameEventCommandReceiver = new GameServerGameEventCommandReceiver(
      this.gameRegistry,
      this.gameLifecycleController.gameModeContexts
    );

    this.dungeonExplorationController = new DungeonExplorationController(
      this.gameRegistry,
      this.updateDispatchFactory,
      this.externalServices.savedCharactersService,
      this.idGenerator,
      this.itemGenerator,
      this.randomNumberGenerator,
      this.gameEventCommandReceiver,
      PLACEHOLDER_ANIMATION_LENGTHS,
      {}
    );

    this.reconnectionProtocol = new GameServerReconnectionProtocol(
      this.updateDispatchFactory,
      externalServices.reconnectionForwardingStoreService,
      this.reconnectionOpportunityManager,
      this.gameLifecycleController,
      (outbox) => this.dispatchOutboxMessages(outbox)
    );
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

    const { username, taggedUserId, connectionId } = session;
    // console.info(
    //   `-- ${username} (user id: ${taggedUserId.id}, connection id: ${connectionId}) joined the [${this.name}] game server`
    // );

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
