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
    const newSession = await this.userSessionLifecycleController.createSession(
      connectionEndpoint.id,
      identityResolutionContext
    );
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.gameStateUpdateDispatchFactory);

    // type the connection endpoint
    const userConnectionEndpoint = connectionEndpoint.toTyped<GameStateUpdate, ClientIntent>();
    this.outgoingMessagesGateway.registerEndpoint(
      userConnectionEndpoint.id,
      userConnectionEndpoint
    );

    let disconnectedSessionOption: DisconnectedSession | null = null;

    if (newSession.taggedUserId.type === UserIdType.Auth) {
      this.externalServices.profileService.createProfileIfUserHasNone(newSession.taggedUserId.id);

      disconnectedSessionOption =
        await this.externalServices.disconnectedSessionStoreService.getDisconnectedSession(
          newSession.getReconnectionKey()
        );
    } else if (newSession.taggedUserId.type === UserIdType.Guest) {
      // would have been given by the game server
      if (identityResolutionContext.clientCachedGuestReconnectionToken) {
        disconnectedSessionOption =
          await this.externalServices.disconnectedSessionStoreService.getDisconnectedSession({
            type: ReconnectionKeyType.Guest,
            reconnectionToken: identityResolutionContext.clientCachedGuestReconnectionToken,
          });
      }
    }

    // we will rely on the game server to delete the disconnectedSession when it is claimed or expires
    // in the event that it expires after we issue the claim token and before the user presents it, we will
    // not accept their reconnection to the game server. the reason I didn't want to delete it here is because
    // the game server needs to know when the disconnectedSession expires or is claimed so it can remove the
    // input lock's RC for that user in the game. also, if they get their claim token then disconnect before
    // reconnecting to the game server they won't be able to reconnect again if we delete it now.
    if (disconnectedSessionOption) {
      // - lobby ensures the game associated with this disconnected session is still active
      //   by checking the central store's Record<GameId, ActiveGame>
      const gameStillExists =
        await this.externalServices.gameSessionStoreService.getActiveGameStatus(
          disconnectedSessionOption.gameName
        );

      if (gameStillExists) {
        // - lobby provides a GameServerSessionClaimToken to user client
        const claimToken = new GameServerSessionClaimToken(
          disconnectedSessionOption.gameName,
          newSession.username,
          newSession.taggedUserId
        );

        outbox.pushFromOther(
          await this.userSessionLifecycleController.activateSession(newSession, {
            sessionWillBeForwardedToGameServer: true,
          })
        );
        // @TODO - encrypt the token
        // const encryptedToken =
        outbox.pushToConnection(newSession.connectionId, {
          type: GameStateUpdateType.GameServerConnectionInstructions,
          data: {
            connectionInstructions: {
              type: GameServerConnectionType.Remote,
              url: this.getGameServerUrlFromName(disconnectedSessionOption.gameServerName),
              sessionClaimToken: claimToken,
            },
          },
        });

        // - user client executes normal flow for onGameServerSessionClaimTokenReceipt, same as when they
        //   are in a lobby game setup and start a new game
        this.dispatchOutboxMessages(outbox);
        return;
      }
    }

    console.info(
      `-- ${newSession.username} (user id: ${newSession.taggedUserId.id}, connection id: ${newSession.connectionId}) joined the lobby`
    );

    // attach the connection to message handlers and disconnectionHandler
    this.attachIntentHandlersToSessionConnection(
      newSession,
      userConnectionEndpoint,
      this.userIntentHandlers
    );

    outbox.pushFromOther(await this.userSessionLifecycleController.activateSession(newSession));
    this.dispatchOutboxMessages(outbox);
  }

  protected async disconnectionHandler(session: UserSession, reason: TransportDisconnectReason) {
    console.info(
      `-- ${session.username} (${session.connectionId})  disconnected. Reason - ${reason.getStringName()}`
    );
    await this.userSessionLifecycleController.cleanupSession(session);
    this.outgoingMessagesGateway.unregisterEndpoint(session.connectionId);
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
