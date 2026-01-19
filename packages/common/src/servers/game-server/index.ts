import { ClientIntent } from "../../packets/client-intents.js";
import { GameServerName, Milliseconds } from "../../aliases.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { IncomingConnectionGateway } from "../incoming-connection-gateway.js";
import { GameSessionStoreService } from "../services/game-session-store/index.js";
import { SavedCharactersService } from "../services/saved-characters.js";
import { RankedLadderService } from "../services/ranked-ladder.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { UntypedConnectionEndpoint } from "../../transport/connection-endpoint.js";
import { ConnectionIdentityResolutionContext } from "../services/identity-provider.js";
import { createGameServerClientIntentHandlers } from "./create-game-server-client-intent-handlers.js";
import { GameServerSessionLifecycleController } from "./controllers/session-lifecycle.js";
import { GameRegistry } from "../game-registry.js";
import { UserSession } from "../sessions/user-session.js";
import { TransportDisconnectReason } from "../../transport/disconnect-reasons.js";
import { GameServerGameLifecycleController } from "./controllers/game-lifecycle/index.js";
import { RaceGameRecordsService } from "../services/race-game-records.js";
import { HeartbeatScheduler, HeartbeatTask } from "../../primatives/heartbeat.js";
import { ONE_SECOND } from "../../app-consts.js";
import { DisconnectedSessionStoreService } from "../services/disconnected-session-store/index.js";
import { PartyDelayedGameMessageFactory } from "./party-delayed-game-message-factory.js";
import { ReconnectionOpportunityManager } from "./reconnection-opportunity-manager.js";
import { SpeedDungeonServer } from "../speed-dungeon-server.js";
import { GameServerSessionClaimTokenCodec } from "../lobby-server/game-handoff/session-claim-token.js";
import { GameServerReconnectionProtocol } from "./reconnection/index.js";
import { ConnectionContextType } from "../reconnection-protocol/index.js";
import { ActiveGameStatus } from "../services/game-session-store/active-game-status.js";

export interface GameServerExternalServices {
  gameSessionStoreService: GameSessionStoreService;
  disconnectedSessionStoreService: DisconnectedSessionStoreService;
  savedCharactersService: SavedCharactersService;
  rankedLadderService: RankedLadderService;
  raceGameRecordsService: RaceGameRecordsService;
}

export const GAME_RECORD_HEARTBEAT_MS: Milliseconds = ONE_SECOND * 10;

export class GameServer extends SpeedDungeonServer {
  private readonly gameRegistry = new GameRegistry();
  private readonly idGenerator = new IdGenerator({ saveHistory: false });
  private readonly heartbeatScheduler = new HeartbeatScheduler(GAME_RECORD_HEARTBEAT_MS);
  private readonly reconnectionOpportunityManager = new ReconnectionOpportunityManager();
  private readonly reconnectionProtocol: GameServerReconnectionProtocol;

  private readonly partyDelayedGameMessageFactory = new PartyDelayedGameMessageFactory(
    this.updateDispatchFactory
  );

  // controllers
  public readonly gameLifecycleController: GameServerGameLifecycleController;
  public readonly sessionLifecycleController: GameServerSessionLifecycleController;
  // public readonly savedCharactersController: SavedCharactersController;

  constructor(
    readonly name: GameServerName,
    private readonly incomingConnectionGateway: IncomingConnectionGateway,
    private readonly externalServices: GameServerExternalServices,
    private readonly gameServerSessionClaimTokenCodec: GameServerSessionClaimTokenCodec
  ) {
    super(name);
    this.incomingConnectionGateway.initialize(
      async (context, identityContext) => await this.handleConnection(context, identityContext)
    );
    this.incomingConnectionGateway.listen();

    this.heartbeatScheduler.start();

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

    this.reconnectionProtocol = new GameServerReconnectionProtocol(
      this.updateDispatchFactory,
      externalServices.disconnectedSessionStoreService,
      this.reconnectionOpportunityManager,
      this.gameLifecycleController,
      (outbox) => this.dispatchOutboxMessages(outbox)
    );
  }

  private intentHandlers = createGameServerClientIntentHandlers(this);

  async handleConnection(
    connectionEndpoint: UntypedConnectionEndpoint,
    identityResolutionContext: ConnectionIdentityResolutionContext
  ) {
    const session = await this.sessionLifecycleController.createSession(
      connectionEndpoint.id,
      identityResolutionContext
    );

    const { username, taggedUserId, connectionId } = session;
    console.info(
      `-- ${username} (user id: ${taggedUserId.id}, connection id: ${connectionId}) joined the [${this.name}] game server`
    );

    const userConnectionEndpoint = connectionEndpoint.toTyped<GameStateUpdate, ClientIntent>();
    this.outgoingMessagesGateway.registerEndpoint(userConnectionEndpoint);

    const gameName = session.currentGameName;
    if (gameName === null) {
      throw new Error("should have been set from their token in createSession");
    }

    const existingGame = await this.gameLifecycleController.getOrInitializeGame(gameName);

    this.attachIntentHandlersToSessionConnection(
      session,
      userConnectionEndpoint,
      this.intentHandlers
    );

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
      `-- ${session.username} (${session.connectionId}) disconnected from ${this.name} game server. Reason - ${reason.getStringName()}`
    );

    const outbox = await this.reconnectionProtocol.onPlayerDisconnected(session, this.name);

    const cleanupSessionOutbox = await this.sessionLifecycleController.cleanupSession(session);
    outbox.pushFromOther(cleanupSessionOutbox);
    this.outgoingMessagesGateway.unregisterEndpoint(session.connectionId);

    outbox.removeRecipients([session.connectionId]);

    this.dispatchOutboxMessages(outbox);
  }

  private startActiveGamesRecordHeartbeat() {
    this.heartbeatScheduler.start();

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
