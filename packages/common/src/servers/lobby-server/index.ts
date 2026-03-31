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
import { CharacterCreator } from "../../character-creation/index.js";
import { AffixGenerator } from "../../items/item-creation/builders/affix-generator/index.js";
import { ItemBuilder, EquipmentRandomizer } from "../../items/item-creation/item-builder/index.js";
import { UserIdType } from "../sessions/user-ids.js";
import { IncomingConnectionGateway } from "../incoming-connection-gateway.js";
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

export interface LobbyExternalServices {
  identityProviderService: IdentityProviderService;
  profileService: SpeedDungeonProfileService;
  savedCharactersService: SavedCharactersService;
  rankedLadderService: RankedLadderService;
  gameSessionStoreService: GameSessionStoreService;
  reconnectionForwardingStoreService: ReconnectionForwardingStoreService;
  idGenerator: IdGenerator;
}

// lives either inside a LobbyServerNode or locally on a ClientApp
export class LobbyServer extends SpeedDungeonServer {
  public readonly lobbyState = new LobbyState();
  private readonly characterCreator: CharacterCreator;

  private readonly gameHandoffManager: GameHandoffManager;
  private userIntentHandlers = createLobbyClientIntentHandlers(this);
  private readonly reconnectionProtocol: LobbyReconnectionProtocol;
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
    fetchLeastBusyServer: () => Promise<string>
  ) {
    super("LobbyServer", incomingConnectionGateway);

    this.gameHandoffManager = new GameHandoffManager(
      this.userSessionRegistry,
      this.updateDispatchFactory,
      externalServices.gameSessionStoreService,
      this.lobbyState,
      this.gameServerSessionClaimTokenCodec,
      fetchLeastBusyServer
    );

    this.incomingConnectionGateway.initialize(
      async (context, identityContext) => await this.handleConnection(context, identityContext)
    );
    this.incomingConnectionGateway.listen();

    const affixGenerator = new AffixGenerator(this.randomNumberGenerator);
    const equipmentRandomizer = new EquipmentRandomizer(this.randomNumberGenerator, affixGenerator);
    this.characterCreator = new CharacterCreator(
      this.externalServices.idGenerator,
      new ItemBuilder(equipmentRandomizer)
    );

    const controllers = this.createControllers();
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

    // this.logUserConnected(session);

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

      const hadExpiredReconnectionToken = session.getGuestReconnectionTokenOption() !== null;

      const outbox = await this.userSessionLifecycleController.activateSession(session, {
        hadExpiredReconnectionToken,
      });

      this.dispatchOutboxMessages(outbox);
    }
  }

  private logUserConnected(session: UserSession) {
    const { username, taggedUserId, connectionId } = session;
    console.info(
      `-- ${username} (user id: ${taggedUserId.id}, connection id: ${connectionId}) joined the lobby`
    );
  }

  protected async disconnectionHandler(session: UserSession, reason: TransportDisconnectReason) {
    // console.info(`-- ${session.username} (${session.connectionId})  disconnected.`);

    session.connectionState = UserSessionConnectionState.Disconnected;
    this.outgoingMessagesGateway.unregisterEndpoint(session.connectionId);

    const outbox = await this.userSessionLifecycleController.cleanupSession(session);

    this.dispatchOutboxMessages(outbox);
  }

  private createControllers() {
    const savedCharactersController = new SavedCharactersController(
      this.externalServices.profileService,
      this.updateDispatchFactory,
      this.externalServices,
      this.characterCreator
    );

    const partySetupController = new PartySetupController(
      this.updateDispatchFactory,
      savedCharactersController,
      this.externalServices.profileService,
      this.externalServices.idGenerator
    );

    const gameLifecycleController = new LobbyGameLifecycleController(
      this.lobbyState,
      this.userSessionRegistry,
      this.updateDispatchFactory,
      partySetupController,
      this.externalServices.idGenerator,
      this.gameHandoffManager,
      this.externalServices.gameSessionStoreService
    );

    const characterLifecycleController = new CharacterLifecycleController(
      this.externalServices.profileService,
      this.updateDispatchFactory,
      this.externalServices.savedCharactersService,
      this.characterCreator
    );

    const userSessionLifecycleController = new LobbySessionLifecycleController(
      this.lobbyState,
      this.userSessionRegistry,
      this.updateDispatchFactory,
      savedCharactersController,
      gameLifecycleController,
      this.externalServices.identityProviderService,
      this.externalServices.idGenerator
    );

    return {
      savedCharactersController,
      partySetupController,
      gameLifecycleController,
      characterLifecycleController,
      userSessionLifecycleController,
    };
  }
}
