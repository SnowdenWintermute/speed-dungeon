import { CharacterLifecycleController } from "./controllers/character-lifecycle.js";
import { SavedCharactersController } from "./controllers/saved-characters.js";
import { createLobbyClientIntentHandlers } from "./create-lobby-client-intent-handlers.js";
import { LobbyGameLifecycleController } from "./controllers/game-lifecycle.js";
import { LobbyState } from "./lobby-state.js";
import { PartySetupController } from "./controllers/party-setup.js";
import { LobbySessionLifecycleController } from "./controllers/session-lifecycle.js";
import {
  ConnectionIdentityResolutionContext,
  IdentityProviderService,
} from "../services/identity-provider.js";
import { SpeedDungeonProfileService } from "../services/profiles.js";
import { RankedLadderService } from "../services/ranked-ladder.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { AffixGenerator } from "../../items/item-creation/affix-generator.js";
import { ItemBuilder, EquipmentRandomizer } from "../../items/item-creation/item-builder/index.js";
import { UserIdType } from "../sessions/user-ids.js";
import { AuthSessionIdParser, IncomingConnectionGateway } from "../incoming-connection-gateway.js";
import { CrossServerBroadcasterService } from "../services/cross-server-broadcaster/index.js";
import { ServerCommand } from "../services/server-command/index.js";
import { GameStateUpdate, GameStateUpdateType } from "../../packets/game-state-updates.js";
import { GameSessionStoreService } from "../services/game-session-store/index.js";
import { TransportDisconnectReason } from "../../transport/disconnect-reasons.js";
import { UserSession, UserSessionConnectionState } from "../sessions/user-session.js";
import { GameHandoffManager } from "./game-handoff/game-handoff-manager.js";
import { SpeedDungeonServer } from "../speed-dungeon-server.js";
import { LobbyReconnectionProtocol } from "./reconnection/index.js";
import { ConnectionContextType } from "../reconnection-protocol/index.js";
import { ConnectionEndpoint } from "../../transport/connection-endpoint.js";
import { GameServerName } from "../../aliases.js";
import {
  CharacterCreationPolicy,
  CharacterCreationPolicyConstructor,
} from "../../character-creation/character-creation-policy.js";
import { RandomNumberGenerationPolicy } from "../../utility-classes/random-number-generation-policy.js";
import { HeartbeatScheduler, HeartbeatTask } from "../../primatives/heartbeat.js";
import { GAME_CONFIG, LOBBY_DANGLING_RESOURCES_CLEANUP_MS } from "../../app-consts.js";
import { GlobalGameSessionStore } from "../services/global-auth-game-connection-session-store/index.js";
import {
  GameServerSessionClaimToken,
  OpaqueEncryptionTokenCodec,
} from "./game-handoff/session-claim-token.js";
import { GuestSessionReconnectionToken } from "../game-server/reconnection/guest-session-reconnection-token.js";
import { ClientAppMessageType } from "../../packets/client-app-message.js";
import { MessageDispatchOutbox } from "../update-delivery/outbox.js";
import { UserGameDataPersistenceService } from "../services/user-game-data-persistence/index.js";
import { GameExistenceChecker } from "./game-existence-queries.js";
import { GameModePolicyStore } from "../../game-modes/game-mode-policy-store.js";
import { IronmanRunController } from "../controllers/ironman-run-controller.js";

export interface LobbyExternalServices {
  identityProviderService: IdentityProviderService;
  profileService: SpeedDungeonProfileService;
  userGameDataPersistenceService: UserGameDataPersistenceService;
  rankedLadderService: RankedLadderService;
  gameSessionStoreService: GameSessionStoreService;
  crossServerBroadcasterService: CrossServerBroadcasterService<GameStateUpdate, ServerCommand>;
  globalGameSessionStore: GlobalGameSessionStore;
}

// lives either inside a LobbyServerNode or locally on a ClientApp
export class LobbyServer extends SpeedDungeonServer {
  public readonly lobbyState = new LobbyState();
  public readonly characterCreationPolicy: CharacterCreationPolicy;

  private readonly gameHandoffManager: GameHandoffManager;
  private userIntentHandlers = createLobbyClientIntentHandlers(this);
  private readonly reconnectionProtocol: LobbyReconnectionProtocol;
  private readonly danglingResourcesHeartbeatScheduler = new HeartbeatScheduler(
    LOBBY_DANGLING_RESOURCES_CLEANUP_MS
  );
  // user controllers
  public readonly gameLifecycleController: LobbyGameLifecycleController;
  public readonly partySetupController: PartySetupController;
  public readonly userSessionLifecycleController: LobbySessionLifecycleController;
  public readonly savedCharactersController: SavedCharactersController;
  public readonly savedIronmanRunsController: IronmanRunController;
  public readonly characterLifecycleController: CharacterLifecycleController;

  // queries
  public readonly gameExistenceChecker: GameExistenceChecker;

  // game modes
  private gameModePolicyStore: GameModePolicyStore;

  constructor(
    protected readonly incomingConnectionGateway: IncomingConnectionGateway,
    private readonly externalServices: LobbyExternalServices,
    private readonly gameServerSessionClaimTokenCodec: OpaqueEncryptionTokenCodec<GameServerSessionClaimToken>,
    private readonly guestReconnectionTokenCodec: OpaqueEncryptionTokenCodec<GuestSessionReconnectionToken>,
    gameServerUrlRegistry: Record<GameServerName, string>,
    fetchLeastBusyServer: () => Promise<{ name: GameServerName; url: string }>,
    characterCreationPolicyConstructor: CharacterCreationPolicyConstructor,
    rngPolicy: RandomNumberGenerationPolicy,
    private idGenerator: IdGenerator,
    authSessionIdParser: AuthSessionIdParser
  ) {
    super(
      "Lobby",
      incomingConnectionGateway,
      rngPolicy,
      externalServices.crossServerBroadcasterService
    );

    this.startDanglingResourcesCleanupHeartbeat();

    this.gameHandoffManager = new GameHandoffManager(
      this.userSessionRegistry,
      this.updateDispatchFactory,
      externalServices.gameSessionStoreService,
      externalServices.globalGameSessionStore,
      this.gameServerSessionClaimTokenCodec,
      fetchLeastBusyServer
    );

    this.incomingConnectionGateway.initialize((connectionEndpoint, identityContext) => {
      return new Promise<void>((resolve, reject) => {
        this.executor.enqueue(async () => {
          try {
            await this.connectionHandler(connectionEndpoint, identityContext);
            resolve();
          } catch (error) {
            console.info(error);
            reject(error);
          }
        });
      });
    }, authSessionIdParser);
    this.incomingConnectionGateway.listen();

    const affixGenerator = new AffixGenerator(rngPolicy);
    const equipmentRandomizer = new EquipmentRandomizer(rngPolicy, affixGenerator);

    this.characterCreationPolicy = new characterCreationPolicyConstructor(
      this.idGenerator,
      new ItemBuilder(equipmentRandomizer),
      this.rngPolicy
    );

    this.gameExistenceChecker = new GameExistenceChecker(
      this.lobbyState,
      this.externalServices.gameSessionStoreService
    );

    this.gameModePolicyStore = new GameModePolicyStore(
      this.updateDispatchFactory,
      externalServices.crossServerBroadcasterService,
      externalServices.profileService,
      externalServices.rankedLadderService,
      externalServices.userGameDataPersistenceService,
      this.userSessionRegistry,
      this.lobbyState.gameRegistry,
      externalServices.gameSessionStoreService,
      this.gameExistenceChecker,
      this.idGenerator
    );

    const controllers = this.createControllers(idGenerator);
    this.gameLifecycleController = controllers.gameLifecycleController;
    this.partySetupController = controllers.partySetupController;
    this.userSessionLifecycleController = controllers.userSessionLifecycleController;
    this.savedCharactersController = controllers.savedCharactersController;
    this.savedIronmanRunsController = controllers.savedIronmanRunsController;
    this.characterLifecycleController = controllers.characterLifecycleController;

    this.reconnectionProtocol = new LobbyReconnectionProtocol(
      gameServerSessionClaimTokenCodec,
      this.updateDispatchFactory,
      externalServices.gameSessionStoreService,
      externalServices.globalGameSessionStore,
      gameServerUrlRegistry
    );
  }

  async connectionHandler(
    connectionEndpoint: ConnectionEndpoint,
    identityResolutionContext: ConnectionIdentityResolutionContext
  ) {
    const session = await this.userSessionLifecycleController.createSession(
      connectionEndpoint.id,
      identityResolutionContext
    );

    this.attachIntentHandlersToSessionConnection(
      session,
      connectionEndpoint,
      this.userIntentHandlers
    );

    if (GAME_CONFIG.LOG_LOBBY_CONNECTION_EVENTS) {
      this.logUserConnected(session);
    }

    if (session.taggedUserId.type === UserIdType.Auth) {
      await this.externalServices.profileService.createProfileIfUserHasNone(
        session.taggedUserId.id
      );
    }

    this.outgoingMessagesGateway.registerEndpoint(connectionEndpoint);

    const connectionContext = await this.reconnectionProtocol.evaluateConnectionContext(session);

    const preexistingSessionOption = this.userSessionRegistry.getSessionByUserId(
      session.taggedUserId.id
    );
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    const isPreemption = !!preexistingSessionOption;

    if (preexistingSessionOption) {
      const preemptionOutbox = await this.preemptExistingSession(preexistingSessionOption);
      outbox.pushFromOther(preemptionOutbox);
    }

    if (connectionContext.type === ConnectionContextType.WillForwardToGameServer) {
      const sessionActivationOutbox = await this.userSessionLifecycleController.activateSession(
        session,
        {
          sessionWillBeForwardedToGameServer: true,
        }
      );
      outbox.pushFromOther(sessionActivationOutbox);
      const reconnectionCredentialsOutbox = await connectionContext.issueCredentials();
      outbox.pushFromOther(reconnectionCredentialsOutbox);
    } else {
      const sessionActivationOutbox = await this.userSessionLifecycleController.activateSession(
        session,
        {
          sessionWillBeForwardedToGameServer: false,
        }
      );
      outbox.pushFromOther(sessionActivationOutbox);
      if (isPreemption) {
        // if it is a preemtion but we are sending them to the game server, game server
        // will let them know they preempted
        outbox.pushToConnection(session.connectionId, {
          type: GameStateUpdateType.ClientAppMessage,
          data: ClientAppMessageType.OtherConnectionPreempted,
        });
      }
    }

    this.dispatchOutboxMessages(outbox);
  }

  private async preemptExistingSession(oldSession: UserSession) {
    // disconnect with message any other session for this user in the lobby
    this.outgoingMessagesGateway.submitToConnection(oldSession.connectionId, {
      type: GameStateUpdateType.ClientAppMessage,
      data: ClientAppMessageType.DisconnectedByPreemption,
    });
    this.outgoingMessagesGateway.closeEndpoint(oldSession.connectionId);
    this.outgoingMessagesGateway.unregisterEndpoint(oldSession.connectionId);
    const outbox = await this.userSessionLifecycleController.cleanupSession(oldSession);
    return outbox;
  }

  protected async disconnectionHandler(session: UserSession, reason: TransportDisconnectReason) {
    // If preemption already cleaned this session up, the registry won't have it.
    if (!this.outgoingMessagesGateway.getEndpoint(session.connectionId)) return;

    if (GAME_CONFIG.LOG_LOBBY_CONNECTION_EVENTS) {
      this.logUserDisconnected(session, reason);
    }

    session.connectionState = UserSessionConnectionState.Disconnected;
    this.outgoingMessagesGateway.unregisterEndpoint(session.connectionId);

    // in case this user's connection was dropped before their session was activated
    if (!this.userSessionRegistry.getSessionOption(session.connectionId)) return;

    const outbox = await this.userSessionLifecycleController.cleanupSession(session);

    this.dispatchOutboxMessages(outbox);
  }

  private createControllers(idGenerator: IdGenerator) {
    const savedIronmanRunsController = new IronmanRunController(
      this.externalServices.userGameDataPersistenceService,
      this.externalServices.profileService,
      this.lobbyState.gameRegistry,
      this.userSessionRegistry,
      this.updateDispatchFactory
    );

    const savedCharactersController = new SavedCharactersController(
      this.externalServices.profileService,
      this.updateDispatchFactory,
      this.externalServices,
      this.characterCreationPolicy
    );

    const partySetupController = new PartySetupController(this.updateDispatchFactory, idGenerator);

    const gameLifecycleController = new LobbyGameLifecycleController(
      this.lobbyState,
      this.updateDispatchFactory,
      partySetupController,
      this.gameExistenceChecker,
      this.gameHandoffManager,
      this.gameModePolicyStore
    );

    const characterLifecycleController = new CharacterLifecycleController(
      this.externalServices.profileService,
      this.updateDispatchFactory,
      this.externalServices.userGameDataPersistenceService,
      this.characterCreationPolicy,
      partySetupController
    );

    const userSessionLifecycleController = new LobbySessionLifecycleController(
      this.lobbyState,
      this.userSessionRegistry,
      this.updateDispatchFactory,
      savedCharactersController,
      savedIronmanRunsController,
      gameLifecycleController,
      this.externalServices.identityProviderService,
      idGenerator,
      this.guestReconnectionTokenCodec
    );

    return {
      savedCharactersController,
      partySetupController,
      gameLifecycleController,
      characterLifecycleController,
      userSessionLifecycleController,
      savedIronmanRunsController,
    };
  }

  startDanglingResourcesCleanupHeartbeat() {
    this.danglingResourcesHeartbeatScheduler.start();
    this.danglingResourcesHeartbeatScheduler.register(
      new HeartbeatTask(LOBBY_DANGLING_RESOURCES_CLEANUP_MS, async () => {
        // @TODO - figure this out: if a read on the active games starts, then the active game is deleted by
        // closing, then someone creates and disconnects from a game of the same name before the read finishes,
        // we might could actually clean up a valid newly started game with the same name as a previously stale one
        const { gameSessionStoreService } = this.externalServices;

        const pendingGames =
          await this.externalServices.gameSessionStoreService.getPendingGameSetups();
        for (const pendingGame of pendingGames) {
          if (pendingGame.isStale()) {
            await gameSessionStoreService.deletePendingGameSetup(pendingGame.game.id);
            await this.externalServices.globalGameSessionStore.clearSessionsInGame(
              pendingGame.game.id
            );
          }
        }

        const activeGames = await this.externalServices.gameSessionStoreService.getActiveGames();
        for (const activeGame of activeGames) {
          if (activeGame.isStale()) {
            await gameSessionStoreService.deleteActiveGameStatus(activeGame.id);
            await this.externalServices.globalGameSessionStore.clearSessionsInGame(activeGame.id);
          }
        }
      })
    );
  }
}
