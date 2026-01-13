import { BasicRandomNumberGenerator } from "../../utility-classes/randomizers.js";
import { UserSessionRegistry } from "../sessions/user-session-registry.js";
import { ClientIntent } from "../../packets/client-intents.js";
import { ChannelName, ConnectionId, GameServerName, Milliseconds } from "../../aliases.js";
import { GameStateUpdate, GameStateUpdateType } from "../../packets/game-state-updates.js";
import { OutgoingMessageGateway } from "../update-delivery/message-gateway.js";
import {
  MessageDispatchFactory,
  MessageDispatchType,
} from "../update-delivery/message-dispatch-factory.js";
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
import { UserId } from "../sessions/user-ids.js";
import { ReconnectionOpportunity } from "./reconnection-opportunity.js";
import { GameMessage, GameMessageType } from "../../packets/game-message.js";
import { PartyDelayedGameMessageFactory } from "./party-delayed-game-message-factory.js";

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

export class GameServer {
  private readonly gameRegistry = new GameRegistry();
  private readonly idGenerator = new IdGenerator({ saveHistory: false });
  private readonly heartbeatScheduler = new HeartbeatScheduler(GAME_RECORD_HEARTBEAT_MS);
  private readonly reconnectionOpportunities = new Map<UserId, ReconnectionOpportunity>();
  private readonly randomNumberGenerator = new BasicRandomNumberGenerator();
  readonly userSessionRegistry = new UserSessionRegistry();
  private readonly gameStateUpdateDispatchFactory = new MessageDispatchFactory<GameStateUpdate>(
    this.userSessionRegistry
  );
  private readonly outgoingMessagesToUsersGateway = new OutgoingMessageGateway<
    GameStateUpdate,
    ClientIntent
  >();

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
    private readonly externalServices: GameServerExternalServices
  ) {
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
      this.idGenerator
    );
  }

  private intentHandlers = createGameServerClientIntentHandlers(this);

  async handleConnection(
    connectionEndpoint: UntypedConnectionEndpoint,
    identityResolutionContext: ConnectionIdentityResolutionContext
  ) {
    const sessionClaimTokenOption = identityResolutionContext.gameServerSessionClaimToken;
    if (sessionClaimTokenOption === undefined) {
      throw new Error("No token was provided when attempting to join the game server");
    }

    const session = await this.sessionLifecycleController.createSession(
      connectionEndpoint.id,
      identityResolutionContext
    );

    const { gameName } = sessionClaimTokenOption;

    let existingGame = this.gameRegistry.getGameOption(gameName);
    // this means this is the first user to join this game
    if (existingGame === undefined) {
      existingGame = await this.gameLifecycleController.initializeExpectedPendingGame(gameName);
    }

    // type the connection endpoint
    const userConnectionEndpoint = connectionEndpoint.toTyped<GameStateUpdate, ClientIntent>();
    this.outgoingMessagesToUsersGateway.registerEndpoint(
      userConnectionEndpoint.id,
      userConnectionEndpoint
    );

    console.info(
      `-- ${session.username} (user id: ${session.taggedUserId.id}, connection id: ${session.connectionId}) joined the ${this.name} game server`
    );

    // attach the connection to message handlers and disconnectionHandler
    // @TODO - this is same as on lobby server, combine it
    userConnectionEndpoint.subscribeAll(
      async (receivable) => {
        const handlerOption = this.intentHandlers[receivable.type];

        if (handlerOption === undefined) {
          throw new Error("Lobby is not configured to handle this type of ClientIntent");
        }

        const session = this.userSessionRegistry.getExpectedSession(userConnectionEndpoint.id);

        // a workaround is to use "as never" for some reason
        const outbox = await handlerOption(receivable.data as never, session);
        this.dispatchUserOutboxMessages(outbox);
      },
      (reason) => this.disconnectionHandler(session, reason)
    );

    const outbox = await this.sessionLifecycleController.activateSession(session);

    const gameIsInProgress = existingGame.timeStarted !== null;

    const reconnectionOpportunityOption = this.reconnectionOpportunities.get(
      session.taggedUserId.id
    );

    const isValidReconnection =
      gameIsInProgress &&
      reconnectionOpportunityOption !== undefined &&
      reconnectionOpportunityOption.claim();

    if (isValidReconnection) {
      this.reconnectionOpportunities.delete(session.taggedUserId.id);
      await this.externalServices.disconnectedSessionStoreService.deleteDisconnectedSession(
        session.taggedUserId.id
      );

      const joinGameOutbox = await this.gameLifecycleController.joinGameHandler(gameName, session);
      outbox.pushFromOther(joinGameOutbox);
    } else if (!gameIsInProgress) {
      const joinGameOutbox = await this.gameLifecycleController.joinGameHandler(gameName, session);
      outbox.pushFromOther(joinGameOutbox);
    } else {
      throw new Error("Client attempted to reconnect to a game under invalid conditions");
    }

    this.dispatchUserOutboxMessages(outbox);
  }

  // @TODO - combine with lobby server, it is almost exact same other than disconnection session logic
  private async disconnectionHandler(session: UserSession, reason: TransportDisconnectReason) {
    await this.sessionLifecycleController.cleanupSession(session);
    this.outgoingMessagesToUsersGateway.unregisterEndpoint(session.connectionId);
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
        const disconnectedSession = DisconnectedSession.fromUserSession(session);
        this.externalServices.disconnectedSessionStoreService.writeDisconnectedSession(
          session.taggedUserId.id,
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
        this.reconnectionOpportunities.set(
          session.taggedUserId.id,
          new ReconnectionOpportunity(RECONNECTION_OPPORTUNITY_TIMOUT_MS, async () => {
            this.reconnectionOpportunities.delete(session.taggedUserId.id);
            try {
              await this.externalServices.disconnectedSessionStoreService.deleteDisconnectedSession(
                session.taggedUserId.id
              );
            } catch (error) {
              console.error("failed to delete disconnectedSession:", error);
            }

            outbox.pushToChannel(game.getChannelName(), {
              type: GameStateUpdateType.PlayerReconnectionTimedOut,
              data: { username: session.username },
            });
            game.inputLock.remove(session.taggedUserId.id);
            //   - clean up the player's in game resources
            //     - characters/pets
            //     - player object
          })
        );
      } else {
        // clean up the player's in game resources
        //  - characters/pets
        //  - player object
      }

      const leaveGameHandlerOutbox = await this.gameLifecycleController.leaveGameHandler(session);
      outbox.pushFromOther(leaveGameHandlerOutbox);
    } catch (error) {
      console.error("unexpected error while handling disconnection from living party:", error);
    }

    this.dispatchUserOutboxMessages(outbox);
  }

  // @TODO - combine with lobby server's version, it is same thing
  private dispatchUserOutboxMessages(outbox: MessageDispatchOutbox<GameStateUpdate>) {
    for (const dispatch of outbox.toDispatches()) {
      switch (dispatch.type) {
        case MessageDispatchType.Single:
          this.outgoingMessagesToUsersGateway.submitToConnection(
            dispatch.connectionId,
            dispatch.message
          );
          break;
        case MessageDispatchType.FanOut:
          this.outgoingMessagesToUsersGateway.submitToConnections(
            dispatch.connectionIds,
            dispatch.message
          );
          break;
      }
    }
  }
}
