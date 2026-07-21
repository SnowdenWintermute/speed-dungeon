import { GameId, GameServerName } from "../../aliases.js";
import { AuthSessionIdParser, IncomingConnectionGateway } from "../incoming-connection-gateway.js";
import { GameSessionStoreService } from "../services/game-session-store/index.js";
import { CharacterLevelLadderService } from "../services/ranked-ladder.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { ConnectionIdentityResolutionContext } from "../services/identity-provider.js";
import { createGameServerClientIntentHandlers } from "./create-game-server-client-intent-handlers.js";
import { GameServerSessionLifecycleController } from "./controllers/session-lifecycle.js";
import { GameRegistry } from "../game-registry.js";
import { UserSession, UserSessionConnectionState } from "../sessions/user-session.js";
import { TransportDisconnectReason } from "../../transport/disconnect-reasons.js";
import {
  GameNoLongerExistsError,
  GameServerGameLifecycleController,
} from "./controllers/game-lifecycle/index.js";
import { HeartbeatScheduler, HeartbeatTask } from "../../primatives/heartbeat.js";
import {
  GAME_CONFIG,
  GAME_RECORD_HEARTBEAT_MS,
  GAME_SERVER_HEARTBEAT_MS,
  WebSocketCloseCode,
} from "../../app-consts.js";
import { ReconnectionOpportunityManager } from "./reconnection-opportunity-manager.js";
import { SpeedDungeonServer } from "../speed-dungeon-server.js";
import {
  GameServerConnectionContext,
  GameServerReconnectionProtocol,
} from "./reconnection/index.js";
import { ConnectionContextType } from "../reconnection-protocol/index.js";
import { ConnectionEndpoint } from "../../transport/connection-endpoint.js";
import { DungeonExplorationController } from "./controllers/dungeon-exploration.js";
import { AffixGenerator } from "../../items/item-creation/affix-generator.js";
import { EquipmentRandomizer } from "../../items/item-creation/item-builder/equipment-randomizer.js";
import { ItemBuilder } from "../../items/item-creation/item-builder/index.js";
import { LootGenerator } from "../../items/loot-generation/loot-generator.js";
import { GameplayAssetFacts } from "../services/assets/gameplay-asset-facts.js";
import { GameServerRegistry } from "../services/game-server-registry/index.js";
import { GameServerStatus } from "../services/game-server-registry/game-server-status.js";
import { CombatActionController } from "./controllers/combat-action/index.js";
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
import {
  GameClosedReason,
  GameStateUpdate,
  GameStateUpdateType,
} from "../../packets/game-state-updates.js";
import { LADDER_UPDATES_CHANNEL_NAME } from "../../packets/channels.js";
import { GameSessionConnectionStatus } from "../sessions/global-auth-game-session.js";
import { UserGlobalGameSessionStore } from "../services/global-auth-game-connection-session-store/index.js";
import {
  GameServerSessionClaimToken,
  OpaqueEncryptionTokenCodec,
} from "../lobby-server/game-handoff/session-claim-token.js";
import { GuestSessionReconnectionToken } from "./reconnection/guest-session-reconnection-token.js";
import { ClientAppMessageType } from "../../packets/client-app-message.js";
import { UserGameDataPersistenceService } from "../services/user-game-data-persistence/index.js";
import { GameModePolicyStore } from "../../game-modes/game-mode-policy-store.js";
import { SpeedDungeonProfileService } from "../services/profiles.js";
import { GameExistenceChecker } from "../lobby-server/game-existence-queries.js";
import { LobbyState } from "../lobby-server/lobby-state.js";
import { LadderGameRecordsService } from "../../game-modes/ladder-records/ladder-records-service.js";
import { PartyLifecyleController } from "./controllers/party-lifecycle.js";
import { ResourceChangePropertiesStrategy } from "../../combat/combat-actions/action-implementations/resource-change-properties-strategy.js";

export interface GameServerExternalServices {
  gameSessionStoreService: GameSessionStoreService;
  userGameDataPersistenceService: UserGameDataPersistenceService;
  profileService: SpeedDungeonProfileService;
  characterLevelLadderService: CharacterLevelLadderService;
  ladderGameRecordsService: LadderGameRecordsService;
  gameServerRegistry: GameServerRegistry;
  crossServerBroadcasterService: CrossServerBroadcasterService<GameStateUpdate, ServerCommand>;
  globalGameSessionStore: UserGlobalGameSessionStore;
}

export class GameServer extends SpeedDungeonServer {
  private readonly gameRegistry = new GameRegistry();
  private readonly itemBuilder: ItemBuilder;
  private readonly lootGenerator: LootGenerator;
  readonly dungeonGenerationPolicy: DungeonGenerationPolicy;
  private readonly heartbeatScheduler = new HeartbeatScheduler(GAME_RECORD_HEARTBEAT_MS);
  private readonly reconnectionOpportunityManager = new ReconnectionOpportunityManager();
  private readonly reconnectionProtocol: GameServerReconnectionProtocol;

  // controllers
  public readonly gameLifecycleController: GameServerGameLifecycleController;
  public readonly dungeonExplorationController: DungeonExplorationController;
  public readonly partyLifecycleController: PartyLifecyleController;
  public readonly sessionLifecycleController: GameServerSessionLifecycleController;
  public readonly combatActionController: CombatActionController;
  public readonly characterProgressionController: CharacterProgressionController;
  public readonly itemManagementController: ItemManagementController;
  public readonly craftingController: CraftingController;
  public readonly miscUtilityController: MiscUtilityController;

  // game modes
  private gameModePolicyStore: GameModePolicyStore;

  constructor(
    readonly name: GameServerName,
    /** the url clients are told to connect to, not this process's container address */
    readonly url: string,
    protected readonly incomingConnectionGateway: IncomingConnectionGateway,
    private readonly externalServices: GameServerExternalServices,
    private readonly gameServerSessionClaimTokenCodec: OpaqueEncryptionTokenCodec<GameServerSessionClaimToken>,
    private readonly guestReconnectionTokenCodec: OpaqueEncryptionTokenCodec<GuestSessionReconnectionToken>,
    private readonly gameplayAssetFacts: GameplayAssetFacts,
    /** pass constructor so the class can use its own private parameters to instantiate it */
    dungeonGenerationPolicyConstructor: DungeonGenerationPolicyConstructor,
    public readonly rngPolicy: RandomNumberGenerationPolicy,
    resourceChangePropertiesStrategy: ResourceChangePropertiesStrategy,
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
    this.startGameServerRegistryHeartbeatTask();

    this.gameModePolicyStore = new GameModePolicyStore(
      this.updateDispatchFactory,
      externalServices.crossServerBroadcasterService,
      externalServices.profileService,
      externalServices.characterLevelLadderService,
      externalServices.ladderGameRecordsService,
      externalServices.userGameDataPersistenceService,
      this.userSessionRegistry,
      this.gameRegistry,
      externalServices.gameSessionStoreService,
      // GameExistenceChecker placeholder to conform to interface since it is really used by lobby setup policies
      new GameExistenceChecker(new LobbyState(), externalServices.gameSessionStoreService),
      this.idGenerator
    );

    this.partyLifecycleController = new PartyLifecyleController(this.updateDispatchFactory);

    this.dungeonExplorationController = new DungeonExplorationController(
      this.updateDispatchFactory,
      this.externalServices.userGameDataPersistenceService,
      this.idGenerator,
      rngPolicy,
      resourceChangePropertiesStrategy,
      this.lootGenerator,
      this.dungeonGenerationPolicy,
      this.gameplayAssetFacts,
      this.gameModePolicyStore,
      this.partyLifecycleController
    );

    this.gameLifecycleController = new GameServerGameLifecycleController(
      this.gameRegistry,
      this.userSessionRegistry,
      this.externalServices.gameSessionStoreService,
      this.externalServices.globalGameSessionStore,
      this.updateDispatchFactory,
      this.gameModePolicyStore,
      this.dungeonExplorationController,
      this.partyLifecycleController,
      name
    );

    this.sessionLifecycleController = new GameServerSessionLifecycleController(
      this.userSessionRegistry,
      this.gameRegistry,
      this.updateDispatchFactory,
      this.gameServerSessionClaimTokenCodec
    );

    this.combatActionController = new CombatActionController(
      this.updateDispatchFactory,
      this.gameModePolicyStore,
      this.idGenerator,
      rngPolicy,
      resourceChangePropertiesStrategy,
      this.lootGenerator,
      this.gameplayAssetFacts,
      this.partyLifecycleController
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

      const gameName = session.currentGameId;
      if (gameName === null) {
        throw new Error("should have been set from their token in createSession");
      }

      let connectionContext: GameServerConnectionContext = {
        type: ConnectionContextType.InitialConnection,
      };

      try {
        const existingGame = await this.gameLifecycleController.getOrInitializeGame(gameName);
        const gameIsInProgress = existingGame.clock.isLive();
        connectionContext = await this.reconnectionProtocol.evaluateConnectionContext(
          session,
          gameIsInProgress
        );
      } catch (err) {
        // The lobby forwarded this user based on an ActiveGameStatus record that outlived the game
        // (e.g. this game server restarted and lost its in-memory games). Purge the stale shared-store
        // records so the lobby stops forwarding, and send the client cleanly back to the lobby.
        if (err instanceof GameNoLongerExistsError) {
          await this.returnConnectionToLobbyForNonexistentGame(session, gameName);
          return;
        }
        console.info(
          "Error getting connection context, setting to InitialConnection and setting session current game to null",
          err
        );
        session.currentGameId = null;
      }

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

  private async returnConnectionToLobbyForNonexistentGame(session: UserSession, gameId: GameId) {
    // Send through the outgoing gateway directly rather than an outbox: this session was never
    // activated, so it isn't in the UserSessionRegistry, and the outbox's MessageDispatchFactory
    // requires a registered session (it would throw). The gateway only needs the endpoint, which
    // was registered on connect. We deliberately do not close the socket here; the client's
    // GameClosed handler tears down its own game connection and returns to the lobby.
    this.outgoingMessagesGateway.submitToConnection(session.connectionId, {
      type: GameStateUpdateType.GameClosed,
      data: { reason: GameClosedReason.GameNoLongerExists },
    });
    console.info(`[game-no-longer-exists] sent GameClosed for game ${gameId} and purging records`);

    try {
      await this.gameLifecycleController.purgeGameSessionRecords(gameId);
    } catch (err) {
      console.trace("failed to purge stale game session records", err);
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

  async registerWithGameServerRegistry() {
    await this.externalServices.gameServerRegistry.register(
      new GameServerStatus(this.name, this.url)
    );
  }

  async unregisterFromGameServerRegistry() {
    await this.externalServices.gameServerRegistry.unregister(this.name);
  }

  private startGameServerRegistryHeartbeatTask() {
    const heartbeat = new HeartbeatTask(GAME_SERVER_HEARTBEAT_MS, () =>
      this.externalServices.gameServerRegistry.heartbeat(this.name)
    );

    this.heartbeatScheduler.register(heartbeat);
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
