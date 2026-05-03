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
import { SavedCharactersService } from "../services/saved-characters.js";
import { RankedLadderService } from "../services/ranked-ladder.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { AffixGenerator } from "../../items/item-creation/affix-generator.js";
import { ItemBuilder, EquipmentRandomizer } from "../../items/item-creation/item-builder/index.js";
import { UserIdType } from "../sessions/user-ids.js";
import { AuthSessionIdParser, IncomingConnectionGateway } from "../incoming-connection-gateway.js";
import { CrossServerBroadcasterService } from "../services/cross-server-broadcaster/index.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { GameSessionStoreService } from "../services/game-session-store/index.js";
import { TransportDisconnectReason } from "../../transport/disconnect-reasons.js";
import { UserSession, UserSessionConnectionState } from "../sessions/user-session.js";
import { ReconnectionForwardingStoreService } from "../services/reconnection-forwarding-store/index.js";
import { GameServerSessionClaimTokenCodec } from "./game-handoff/session-claim-token.js";
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
import { LOBBY_DANGLING_RESOURCES_CLEANUP_MS } from "../../app-consts.js";

export interface LobbyExternalServices {
  identityProviderService: IdentityProviderService;
  profileService: SpeedDungeonProfileService;
  savedCharactersService: SavedCharactersService;
  rankedLadderService: RankedLadderService;
  gameSessionStoreService: GameSessionStoreService;
  reconnectionForwardingStoreService: ReconnectionForwardingStoreService;
  crossServerBroadcasterService: CrossServerBroadcasterService<GameStateUpdate>;
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
  public readonly characterLifecycleController: CharacterLifecycleController;
  // game server controllers

  constructor(
    protected readonly incomingConnectionGateway: IncomingConnectionGateway,
    private readonly externalServices: LobbyExternalServices,
    private readonly gameServerSessionClaimTokenCodec: GameServerSessionClaimTokenCodec,
    private readonly gameServerUrlRegistry: Record<GameServerName, string>,
    fetchLeastBusyServer: () => Promise<string>,
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
      this.lobbyState,
      this.gameServerSessionClaimTokenCodec,
      fetchLeastBusyServer
    );

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

    const affixGenerator = new AffixGenerator(rngPolicy);
    const equipmentRandomizer = new EquipmentRandomizer(rngPolicy, affixGenerator);

    this.characterCreationPolicy = new characterCreationPolicyConstructor(
      this.idGenerator,
      new ItemBuilder(equipmentRandomizer),
      this.rngPolicy
    );

    const controllers = this.createControllers(idGenerator);
    this.gameLifecycleController = controllers.gameLifecycleController;
    this.partySetupController = controllers.partySetupController;
    this.userSessionLifecycleController = controllers.userSessionLifecycleController;
    this.savedCharactersController = controllers.savedCharactersController;
    this.characterLifecycleController = controllers.characterLifecycleController;

    this.reconnectionProtocol = new LobbyReconnectionProtocol(
      gameServerSessionClaimTokenCodec,
      this.updateDispatchFactory,
      externalServices.gameSessionStoreService,
      externalServices.reconnectionForwardingStoreService,
      gameServerUrlRegistry
    );
  }

  async handleConnection(
    connectionEndpoint: ConnectionEndpoint,
    identityResolutionContext: ConnectionIdentityResolutionContext
  ) {
    const session = await this.userSessionLifecycleController.createSession(
      connectionEndpoint.id,
      identityResolutionContext
    );

    this.logUserConnected(session);

    if (session.taggedUserId.type === UserIdType.Auth) {
      await this.externalServices.profileService.createProfileIfUserHasNone(
        session.taggedUserId.id
      );
    }

    this.outgoingMessagesGateway.registerEndpoint(connectionEndpoint);

    const connectionContext = await this.reconnectionProtocol.evaluateConnectionContext(session);

    if (connectionContext.type === ConnectionContextType.Reconnection) {
      const outbox = await this.userSessionLifecycleController.activateSession(session, {
        sessionWillBeForwardedToGameServer: true,
      });
      const reconnectionCredentialsOutbox = await connectionContext.issueCredentials();
      outbox.pushFromOther(reconnectionCredentialsOutbox);
      this.dispatchOutboxMessages(outbox);
    } else {
      this.attachIntentHandlersToSessionConnection(
        session,
        connectionEndpoint,
        this.userIntentHandlers
      );

      const outbox = await this.userSessionLifecycleController.activateSession(session, {
        sessionWillBeForwardedToGameServer: false,
      });

      this.dispatchOutboxMessages(outbox);
    }
  }

  protected async disconnectionHandler(session: UserSession, reason: TransportDisconnectReason) {
    this.logUserDisconnected(session, reason);

    session.connectionState = UserSessionConnectionState.Disconnected;
    this.outgoingMessagesGateway.unregisterEndpoint(session.connectionId);

    const outbox = await this.userSessionLifecycleController.cleanupSession(session);

    this.dispatchOutboxMessages(outbox);
  }

  private createControllers(idGenerator: IdGenerator) {
    const savedCharactersController = new SavedCharactersController(
      this.externalServices.profileService,
      this.updateDispatchFactory,
      this.externalServices,
      this.characterCreationPolicy
    );

    const partySetupController = new PartySetupController(
      this.updateDispatchFactory,
      savedCharactersController,
      this.externalServices.profileService,
      idGenerator
    );

    const gameLifecycleController = new LobbyGameLifecycleController(
      this.lobbyState,
      this.userSessionRegistry,
      this.updateDispatchFactory,
      partySetupController,
      this.externalServices.profileService,
      savedCharactersController,
      idGenerator,
      this.gameHandoffManager,
      this.externalServices.gameSessionStoreService
    );

    const characterLifecycleController = new CharacterLifecycleController(
      this.externalServices.profileService,
      this.updateDispatchFactory,
      this.externalServices.savedCharactersService,
      this.characterCreationPolicy
    );

    const userSessionLifecycleController = new LobbySessionLifecycleController(
      this.lobbyState,
      this.userSessionRegistry,
      this.updateDispatchFactory,
      savedCharactersController,
      gameLifecycleController,
      this.externalServices.identityProviderService,
      idGenerator
    );

    return {
      savedCharactersController,
      partySetupController,
      gameLifecycleController,
      characterLifecycleController,
      userSessionLifecycleController,
    };
  }

  startDanglingResourcesCleanupHeartbeat() {
    this.danglingResourcesHeartbeatScheduler.start();
    this.danglingResourcesHeartbeatScheduler.register(
      new HeartbeatTask(LOBBY_DANGLING_RESOURCES_CLEANUP_MS, async () => {
        const activeGames = await this.externalServices.gameSessionStoreService.getActiveGames();
        // @TODO - figure this out: if a read on the active games starts, then the active game is deleted by
        // closing, then someone creates and disconnects from a game of the same name before the read finishes,
        // we might could actually clean up a valid newly started game with the same name as a previously stale one
        const { gameSessionStoreService, reconnectionForwardingStoreService } =
          this.externalServices;
        for (const activeGame of activeGames) {
          if (activeGame.isStale()) {
            await gameSessionStoreService.deleteActiveGameStatus(activeGame.name);
            await gameSessionStoreService.deletePendingGameSetup(activeGame.name);
            await reconnectionForwardingStoreService.deleteAllReconnectionKeysForGameName(
              activeGame.name
            );
          }
        }
      })
    );
  }
}
