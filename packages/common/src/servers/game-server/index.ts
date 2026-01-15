import { BasicRandomNumberGenerator } from "../../utility-classes/randomizers.js";
import { ClientIntent } from "../../packets/client-intents.js";
import { randomBytes } from "crypto";
import { GameServerName, GuestSessionReconnectionToken, Milliseconds } from "../../aliases.js";
import { GameStateUpdate, GameStateUpdateType } from "../../packets/game-state-updates.js";
import { MessageDispatchFactory } from "../update-delivery/message-dispatch-factory.js";
import { IncomingConnectionGateway } from "../incoming-connection-gateway.js";
import { GameSessionStoreService } from "../services/game-session-store/index.js";
import { SavedCharactersService } from "../services/saved-characters.js";
import { RankedLadderService } from "../services/ranked-ladder.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { UntypedConnectionEndpoint } from "../../transport/connection-endpoint.js";
import {
  ConnectionIdentityResolutionContext,
  IdentityProviderService,
} from "../services/identity-provider.js";
import { createGameServerClientIntentHandlers } from "./create-game-server-client-intent-handlers.js";
import { MessageDispatchOutbox } from "../update-delivery/outbox.js";
import { GameServerSessionLifecycleController } from "./controllers/session-lifecycle.js";
import { GameRegistry } from "../game-registry.js";
import { UserSession } from "../sessions/user-session.js";
import { TransportDisconnectReason } from "../../transport/disconnect-reasons.js";
import { GameServerGameLifecycleController } from "./controllers/game-lifecycle/index.js";
import { RaceGameRecordsService } from "../services/race-game-records.js";
import { HeartbeatScheduler } from "../../primatives/heartbeat.js";
import { ONE_SECOND } from "../../app-consts.js";
import { DisconnectedSession } from "../sessions/disconnected-session.js";
import { DisconnectedSessionStoreService } from "../services/disconnected-session-store/index.js";
import { ReconnectionOpportunity } from "./reconnection-opportunity.js";
import { PartyDelayedGameMessageFactory } from "./party-delayed-game-message-factory.js";
import { ReconnectionOpportunityManager } from "./reconnection-opportunity-manager.js";
import { SpeedDungeonServer } from "../speed-dungeon-server.js";
import { invariant } from "../../utils/index.js";
import { GameServerSessionClaimTokenCodec } from "../lobby-server/game-handoff/session-claim-token.js";

export interface GameServerExternalServices {
  gameSessionStoreService: GameSessionStoreService;
  disconnectedSessionStoreService: DisconnectedSessionStoreService;
  identityProviderService: IdentityProviderService;
  savedCharactersService: SavedCharactersService;
  rankedLadderService: RankedLadderService;
  raceGameRecordsService: RaceGameRecordsService;
  savedCharactersLadderService: SavedCharactersService;
}

export const GAME_RECORD_HEARTBEAT_MS: Milliseconds = ONE_SECOND * 10;
export const RECONNECTION_OPPORTUNITY_TIMOUT_MS: Milliseconds = ONE_SECOND * 120;

export class GameServer extends SpeedDungeonServer {
  private readonly gameRegistry = new GameRegistry();
  private readonly idGenerator = new IdGenerator({ saveHistory: false });
  private readonly heartbeatScheduler = new HeartbeatScheduler(GAME_RECORD_HEARTBEAT_MS);
  private readonly randomNumberGenerator = new BasicRandomNumberGenerator();
  private readonly reconnectionOpportunityManager = new ReconnectionOpportunityManager();
  private readonly gameStateUpdateDispatchFactory = new MessageDispatchFactory<GameStateUpdate>(
    this.userSessionRegistry
  );

  private readonly partyDelayedGameMessageFactory = new PartyDelayedGameMessageFactory(
    this.gameStateUpdateDispatchFactory
  );

  // controllers
  public readonly gameLifecycleController: GameServerGameLifecycleController;
  public readonly sessionLifecycleController: GameServerSessionLifecycleController;
  // public readonly savedCharactersController: SavedCharactersController;

  constructor(
    private readonly name: GameServerName,
    private readonly incomingConnectionGateway: IncomingConnectionGateway,
    private readonly externalServices: GameServerExternalServices,
    private readonly gameServerSessionClaimTokenCodec: GameServerSessionClaimTokenCodec
  ) {
    super();
    this.incomingConnectionGateway.initialize(
      async (context, identityContext) => await this.handleConnection(context, identityContext)
    );
    this.incomingConnectionGateway.listen();

    this.heartbeatScheduler.start();

    this.gameLifecycleController = new GameServerGameLifecycleController(
      this.gameRegistry,
      this.userSessionRegistry,
      this.heartbeatScheduler,
      this.externalServices.gameSessionStoreService,
      this.externalServices.raceGameRecordsService,
      this.externalServices.savedCharactersLadderService,
      this.externalServices.rankedLadderService,
      this.gameStateUpdateDispatchFactory,
      this.partyDelayedGameMessageFactory
    );

    this.sessionLifecycleController = new GameServerSessionLifecycleController(
      this.userSessionRegistry,
      this.gameRegistry,
      this.gameStateUpdateDispatchFactory,
      this.externalServices.identityProviderService,
      this.gameLifecycleController,
      this.idGenerator,
      this.gameServerSessionClaimTokenCodec
    );
  }

  private intentHandlers = createGameServerClientIntentHandlers(this);

  async handleConnection(
    connectionEndpoint: UntypedConnectionEndpoint,
    identityResolutionContext: ConnectionIdentityResolutionContext
  ) {
    const sessionClaimTokenOption = identityResolutionContext.encrypteGameServerSessionClaimToken;
    if (sessionClaimTokenOption === undefined) {
      throw new Error("No token was provided when attempting to join the game server");
    }

    const session = await this.sessionLifecycleController.createSession(
      connectionEndpoint.id,
      identityResolutionContext
    );

    // type the connection endpoint
    const userConnectionEndpoint = connectionEndpoint.toTyped<GameStateUpdate, ClientIntent>();
    this.outgoingMessagesGateway.registerEndpoint(
      userConnectionEndpoint.id,
      userConnectionEndpoint
    );

    const gameName = session.currentGameName;
    invariant(gameName !== null); // should have been set from their token in createSession

    let existingGame = this.gameRegistry.getGameOption(gameName);
    // this means this is the first user to join this game
    if (existingGame === undefined) {
      existingGame = await this.gameLifecycleController.initializeExpectedPendingGame(gameName);
    }

    const { username, taggedUserId, connectionId } = session;
    console.info(
      `-- ${username} (user id: ${taggedUserId.id}, connection id: ${connectionId}) joined the ${this.name} game server`
    );

    this.attachIntentHandlersToSessionConnection(
      session,
      userConnectionEndpoint,
      this.intentHandlers
    );

    const outbox = await this.sessionLifecycleController.activateSession(session);

    const gameIsInProgress = existingGame.timeStarted !== null;

    const reconnectionOpportunityOption = this.reconnectionOpportunityManager.get(
      session.getReconnectionKey()
    );

    const isValidReconnection =
      gameIsInProgress &&
      reconnectionOpportunityOption !== undefined &&
      reconnectionOpportunityOption.claim();

    if (isValidReconnection) {
      this.reconnectionOpportunityManager.remove(session.getReconnectionKey());
      await this.externalServices.disconnectedSessionStoreService.deleteDisconnectedSession(
        session.getReconnectionKey()
      );

      const joinGameOutbox = await this.gameLifecycleController.joinGameHandler(gameName, session);
      outbox.pushFromOther(joinGameOutbox);
    } else if (!gameIsInProgress) {
      const joinGameOutbox = await this.gameLifecycleController.joinGameHandler(gameName, session);
      outbox.pushFromOther(joinGameOutbox);
    } else {
      throw new Error("Client attempted to reconnect to a game under invalid conditions");
    }

    const newReconnectionToken = this.generateGuestReconnectionToken();
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.CacheGuestSessionReconnectionToken,
      data: {
        token: newReconnectionToken,
      },
    });

    this.dispatchOutboxMessages(outbox);
  }

  // @TODO - combine with lobby server, it is almost exact same other than disconnection session logic
  protected async disconnectionHandler(session: UserSession, reason: TransportDisconnectReason) {
    await this.sessionLifecycleController.cleanupSession(session);
    this.outgoingMessagesGateway.unregisterEndpoint(session.connectionId);
    console.info(
      `-- ${session.username} (${session.connectionId}) disconnected from ${this.name} game server. Reason - ${reason.getStringName()}`
    );

    const outbox = new MessageDispatchOutbox(this.gameStateUpdateDispatchFactory);
    // - if the user party is still alive, provide a reconnection opportunity
    try {
      const game = session.getExpectedCurrentGame();
      const party = session.getExpectedCurrentParty(game);
      const partyIsStillAlive = party.timeOfWipe === null;

      const reconnectionPermitted = partyIsStillAlive;

      if (reconnectionPermitted) {
        const disconnectedSession = DisconnectedSession.fromUserSession(session, this.name);
        this.externalServices.disconnectedSessionStoreService.writeDisconnectedSession(
          session.getReconnectionKey(),
          disconnectedSession
        );

        // - pause acceptance of user inputs until reconnection is established or a timeout has passed
        game.inputLock.add(session.taggedUserId.id);
        // - tell the users still in game that a player is awaiting reconnection
        outbox.pushToChannel(game.getChannelName(), {
          type: GameStateUpdateType.PlayerDisconnectedWithReconnectionOpportunity,
          data: { username: session.username },
        });

        // - if timeout elapses without reconnection,
        this.reconnectionOpportunityManager.add(
          session.getReconnectionKey(),
          new ReconnectionOpportunity(RECONNECTION_OPPORTUNITY_TIMOUT_MS, async () => {
            this.reconnectionOpportunityManager.remove(session.getReconnectionKey());
            try {
              await this.externalServices.disconnectedSessionStoreService.deleteDisconnectedSession(
                session.getReconnectionKey()
              );
            } catch (error) {
              console.error("failed to delete disconnectedSession:", error);
            }

            const reconnectionTimeoutOutbox = new MessageDispatchOutbox(
              this.gameStateUpdateDispatchFactory
            );

            reconnectionTimeoutOutbox.pushToChannel(game.getChannelName(), {
              type: GameStateUpdateType.PlayerReconnectionTimedOut,
              data: { username: session.username },
            });
            game.inputLock.remove(session.taggedUserId.id);
            const leaveGameHandlerOutbox =
              await this.gameLifecycleController.leaveGameHandler(session);
            reconnectionTimeoutOutbox.pushFromOther(leaveGameHandlerOutbox);

            this.dispatchOutboxMessages(reconnectionTimeoutOutbox);
          })
        );
      } else {
        const leaveGameHandlerOutbox = await this.gameLifecycleController.leaveGameHandler(session);
        outbox.pushFromOther(leaveGameHandlerOutbox);
      }
    } catch (error) {
      console.error("unexpected error while handling disconnection from living party:", error);
    }

    this.dispatchOutboxMessages(outbox);
  }

  private generateGuestReconnectionToken(): GuestSessionReconnectionToken {
    return randomBytes(32).toString("base64url") as GuestSessionReconnectionToken;
  }
}
