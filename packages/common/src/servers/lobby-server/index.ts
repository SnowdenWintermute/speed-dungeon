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
import { BasicRandomNumberGenerator } from "../../utility-classes/randomizers.js";
import { CharacterCreator } from "../../character-creation/index.js";
import { ItemGenerator } from "../../items/item-creation/index.js";
import { AffixGenerator } from "../../items/item-creation/builders/affix-generator/index.js";
import { GameStateUpdate, GameStateUpdateType } from "../../packets/game-state-updates.js";
import { ClientIntent } from "../../packets/client-intents.js";
import { UserIdType } from "../sessions/user-ids.js";
import { GameHandoffStrategyLobbyToGameServer } from "./game-handoff/handoff-strategy.js";
import { MessageDispatchFactory } from "../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../update-delivery/outbox.js";
import { IncomingConnectionGateway } from "../incoming-connection-gateway.js";
import { UntypedConnectionEndpoint } from "../../transport/connection-endpoint.js";
import { GameSessionStoreService } from "../services/game-session-store/index.js";
import { TransportDisconnectReason } from "../../transport/disconnect-reasons.js";
import { UserSession } from "../sessions/user-session.js";
import {
  DisconnectedSessionStoreService,
  ReconnectionKeyType,
} from "../services/disconnected-session-store/index.js";
import { GameServerSessionClaimToken } from "./game-handoff/session-claim-token.js";
import { GameServerConnectionType } from "./game-handoff/connection-instructions.js";
import { GameServerName } from "../../aliases.js";
import { DisconnectedSession } from "../sessions/disconnected-session.js";
import { GameHandoffManager } from "./game-handoff/game-handoff-manager.js";
import { SpeedDungeonServer } from "../speed-dungeon-server.js";

export interface LobbyExternalServices {
  identityProviderService: IdentityProviderService;
  profileService: SpeedDungeonProfileService;
  savedCharactersService: SavedCharactersService;
  rankedLadderService: RankedLadderService;
  gameSessionStoreService: GameSessionStoreService;
  disconnectedSessionStoreService: DisconnectedSessionStoreService;
  idGenerator: IdGenerator;
}

// lives either inside a LobbyServerNode or locally on a ClientApp
export class LobbyServer extends SpeedDungeonServer {
  private readonly randomNumberGenerator = new BasicRandomNumberGenerator();
  public readonly lobbyState = new LobbyState();

  private readonly gameStateUpdateDispatchFactory = new MessageDispatchFactory<GameStateUpdate>(
    this.userSessionRegistry
  );
  private readonly characterCreator: CharacterCreator;

  private readonly gameHandoffManager: GameHandoffManager;
  private userIntentHandlers = createLobbyClientIntentHandlers(this);

  // user controllers
  public readonly gameLifecycleController: LobbyGameLifecycleController;
  public readonly partySetupController: PartySetupController;
  public readonly userSessionLifecycleController: LobbySessionLifecycleController;
  public readonly savedCharactersController: SavedCharactersController;
  public readonly characterLifecycleController: CharacterLifecycleController;
  // game server controllers

  constructor(
    private readonly incomingConnectionGateway: IncomingConnectionGateway,
    private readonly gameHandoffStrategy: GameHandoffStrategyLobbyToGameServer,
    private readonly externalServices: LobbyExternalServices
  ) {
    super();

    this.gameHandoffManager = new GameHandoffManager(
      this.userSessionRegistry,
      this.gameStateUpdateDispatchFactory,
      externalServices.gameSessionStoreService,
      this.lobbyState
    );

    this.incomingConnectionGateway.initialize(
      async (context, identityContext) => await this.handleConnection(context, identityContext)
    );
    this.incomingConnectionGateway.listen();

    this.characterCreator = new CharacterCreator(
      this.externalServices.idGenerator,
      new ItemGenerator(
        this.externalServices.idGenerator,
        this.randomNumberGenerator,
        new AffixGenerator(this.randomNumberGenerator)
      )
    );

    const controllers = this.createControllers();
    this.gameLifecycleController = controllers.gameLifecycleController;
    this.partySetupController = controllers.partySetupController;
    this.userSessionLifecycleController = controllers.userSessionLifecycleController;
    this.savedCharactersController = controllers.savedCharactersController;
    this.characterLifecycleController = controllers.characterLifecycleController;
  }

  async handleConnection(
    connectionEndpoint: UntypedConnectionEndpoint,
    identityResolutionContext: ConnectionIdentityResolutionContext
  ) {
    const session = await this.userSessionLifecycleController.createSession(
      connectionEndpoint.id,
      identityResolutionContext
    );

    // type the connection endpoint
    const userConnectionEndpoint = connectionEndpoint.toTyped<GameStateUpdate, ClientIntent>();
    this.outgoingMessagesGateway.registerEndpoint(
      userConnectionEndpoint.id,
      userConnectionEndpoint
    );

    const disconnectedSessionOption = await this.getDisconnectedSessionOption(
      session,
      identityResolutionContext
    );

    // we will rely on the game server to delete the disconnectedSession when it is claimed or expires
    // in the event that it expires after we issue the claim token and before the user presents it, we will
    // not accept their reconnection to the game server. the reason I didn't want to delete it here is because
    // the game server needs to know when the disconnectedSession expires or is claimed so it can remove the
    // input lock's RC for that user in the game. also, if they get their claim token then disconnect before
    // reconnecting to the game server they won't be able to reconnect again if we delete it now.
    if (disconnectedSessionOption) {
      const gameStillExists =
        await this.externalServices.gameSessionStoreService.getActiveGameStatus(
          disconnectedSessionOption.gameName
        );

      if (gameStillExists) {
        await this.giveClientReconnectionInstructions(session, disconnectedSessionOption);
        return; // don't set up the rest of their lobby session, they will go directly to reconnect to game server
      }
    }

    const { username, taggedUserId, connectionId } = session;
    console.info(
      `-- ${username} (user id: ${taggedUserId.id}, connection id: ${connectionId}) joined the lobby`
    );

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.gameStateUpdateDispatchFactory);
    // attach the connection to message handlers and disconnectionHandler
    this.attachIntentHandlersToSessionConnection(
      session,
      userConnectionEndpoint,
      this.userIntentHandlers
    );

    outbox.pushFromOther(await this.userSessionLifecycleController.activateSession(session));
    this.dispatchOutboxMessages(outbox);
  }

  protected async disconnectionHandler(session: UserSession, reason: TransportDisconnectReason) {
    console.info(
      `-- ${session.username} (${session.connectionId})  disconnected. Reason - ${reason.getStringName()}`
    );
    await this.userSessionLifecycleController.cleanupSession(session);
    this.outgoingMessagesGateway.unregisterEndpoint(session.connectionId);
  }

  private async giveClientReconnectionInstructions(
    session: UserSession,
    disconnectedSession: DisconnectedSession
  ) {
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.gameStateUpdateDispatchFactory);
    const claimToken = new GameServerSessionClaimToken(
      disconnectedSession.gameName,
      session.username,
      disconnectedSession.taggedUserId
    );

    outbox.pushFromOther(
      await this.userSessionLifecycleController.activateSession(session, {
        sessionWillBeForwardedToGameServer: true,
      })
    );
    // @TODO - encrypt the token
    // const encryptedToken =
    const url = this.getGameServerUrlFromName(disconnectedSession.gameServerName);
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.GameServerConnectionInstructions,
      data: {
        connectionInstructions: {
          type: GameServerConnectionType.Remote,
          url,
          sessionClaimToken: claimToken,
        },
      },
    });

    // - user client executes normal flow for onGameServerSessionClaimTokenReceipt, same as when they
    //   are in a lobby game setup and start a new game
    this.dispatchOutboxMessages(outbox);

    const { username, taggedUserId, connectionId } = session;
    console.info(
      `-- ${username} (user id: ${taggedUserId.id}, connection id: ${connectionId}) was given instructions to reconnect to server ${disconnectedSession.gameServerName} at url ${url}`
    );
  }

  private async getDisconnectedSessionOption(
    session: UserSession,
    identityResolutionContext: ConnectionIdentityResolutionContext
  ) {
    if (session.taggedUserId.type === UserIdType.Auth) {
      this.externalServices.profileService.createProfileIfUserHasNone(session.taggedUserId.id);

      return await this.externalServices.disconnectedSessionStoreService.getDisconnectedSession(
        session.getReconnectionKey()
      );
    } else if (session.taggedUserId.type === UserIdType.Guest) {
      // would have been given by the game server and cached on the client
      if (identityResolutionContext.clientCachedGuestReconnectionToken) {
        return await this.externalServices.disconnectedSessionStoreService.getDisconnectedSession({
          type: ReconnectionKeyType.Guest,
          reconnectionToken: identityResolutionContext.clientCachedGuestReconnectionToken,
        });
      }
    }
  }

  private createControllers() {
    const savedCharactersController = new SavedCharactersController(
      this.externalServices.profileService,
      this.gameStateUpdateDispatchFactory,
      this.externalServices,
      this.characterCreator
    );

    const partySetupController = new PartySetupController(
      this.gameStateUpdateDispatchFactory,
      this.savedCharactersController,
      this.externalServices.profileService,
      this.externalServices.idGenerator
    );

    const gameLifecycleController = new LobbyGameLifecycleController(
      this.lobbyState,
      this.userSessionRegistry,
      this.gameStateUpdateDispatchFactory,
      this.partySetupController,
      this.externalServices.idGenerator,
      this.gameHandoffManager,
      this.externalServices.gameSessionStoreService
    );

    const characterLifecycleController = new CharacterLifecycleController(
      this.externalServices.profileService,
      this.gameStateUpdateDispatchFactory,
      this.externalServices.savedCharactersService,
      this.characterCreator
    );

    const userSessionLifecycleController = new LobbySessionLifecycleController(
      this.lobbyState,
      this.userSessionRegistry,
      this.gameStateUpdateDispatchFactory,
      this.savedCharactersController,
      this.gameLifecycleController,
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

  private getGameServerUrlFromName(name: GameServerName) {
    return "";
  }
}
