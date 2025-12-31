import { LOBBY_CHANNEL } from "../../packets/channels.js";
import { GameStateUpdate, GameStateUpdateType } from "../../packets/game-state-updates.js";
import { GameLifecycleController } from "./game-lifecycle.js";
import { LobbyState } from "../lobby-state.js";
import { SavedCharactersController } from "./saved-characters.js";
import { GameStateUpdateGateway } from "../update-delivery/game-state-update-gateway.js";
import { GameStateUpdateDispatchFactory } from "../update-delivery/game-state-update-dispatch-factory.js";
import {
  TransportDisconnectReason,
  TransportEndpoint,
} from "../update-delivery/transport-endpoint.js";
import { GameStateUpdateDispatchOutbox } from "../update-delivery/update-dispatch-outbox.js";
import { UserSessionRegistry } from "../sessions/user-session-registry.js";
import { SessionAuthorizationManager } from "../sessions/authorization-manager.js";
import { UserSession } from "../sessions/user-session.js";
import {
  IdentityProviderService,
  IdentityResolutionContext,
} from "../services/identity-provider.js";
import { ConnectionId, Username } from "../../aliases.js";
import { PLAYER_FIRST_NAMES, PLAYER_LAST_NAMES } from "./default-naming/users.js";
import { ClientIntent } from "../../packets/client-intents.js";

export class SessionLifecycleController {
  constructor(
    private readonly lobbyState: LobbyState,
    private readonly updateGateway: GameStateUpdateGateway,
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly sessionAuthManager: SessionAuthorizationManager,
    private readonly updateDispatchFactory: GameStateUpdateDispatchFactory,
    private readonly savedCharactersController: SavedCharactersController,
    private readonly gameLifecycleController: GameLifecycleController,
    private readonly identityProviderService: IdentityProviderService
  ) {}

  async createUserSession(
    connectionId: ConnectionId,
    context: IdentityResolutionContext
  ): Promise<UserSession> {
    const authenticatedUserOption = await this.identityProviderService.resolve(context);
    if (authenticatedUserOption === null) {
      const { username, userId } = this.createGuestUser();
      return new UserSession(username, connectionId, userId);
    }

    const { username, userId } = authenticatedUserOption;

    return new UserSession(username, connectionId, userId);
  }

  private generateRandomUsername() {
    const firstName = PLAYER_FIRST_NAMES[Math.floor(Math.random() * PLAYER_FIRST_NAMES.length)];
    const lastName = PLAYER_LAST_NAMES[Math.floor(Math.random() * PLAYER_LAST_NAMES.length)];
    return `${firstName} ${lastName}` as Username;
  }

  private createGuestUser() {
    return { username: this.generateRandomUsername(), userId: null };
  }

  async connectionHandler(
    session: UserSession,
    endpoint: TransportEndpoint<GameStateUpdate, ClientIntent>
  ) {
    console.info(
      `-- ${session.username} (user id: ${session.userId}, connection id: ${session.connectionId}) joined the lobby`
    );

    const loggedInUser = await this.sessionAuthManager.getAuthorizedSessionOption(session);
    if (loggedInUser !== null) {
      this.savedCharactersController.fetchSavedCharactersHandler(session);
    }

    this.userSessionRegistry.register(session);
    this.updateGateway.registerEndpoint(session.connectionId, endpoint);

    const outbox = new GameStateUpdateDispatchOutbox(this.updateDispatchFactory);

    // tell the client their username
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.ClientUsername,
      data: { username: session.username },
    });

    const isAuthorizedUser = loggedInUser !== null;
    const userChannelDisplayData = this.lobbyState.addUser(session.username, isAuthorizedUser);
    session.subscribeToChannel(LOBBY_CHANNEL);

    // tell the client about the channel they are in and other users in the lobby channel
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.ChannelFullUpdate,
      data: { channelName: LOBBY_CHANNEL, users: this.lobbyState.getUsersList() },
    });

    // tell other clients in the lobby that this user joined
    outbox.pushToChannel(
      LOBBY_CHANNEL,
      {
        type: GameStateUpdateType.UserJoinedChannel,
        data: { username: session.username, userChannelDisplayData },
      },
      { excludedIds: [session.connectionId] }
    );

    return outbox;
  }

  async disconnectionHandler(session: UserSession, reason: TransportDisconnectReason) {
    console.info(
      `-- ${session.username} (${session.connectionId})  disconnected. Reason - ${reason.getStringName()}`
    );

    const outbox = new GameStateUpdateDispatchOutbox(this.updateDispatchFactory);
    if (session.currentGameName !== null) {
      const leaveGameHandlerOutbox = this.gameLifecycleController.leaveGameHandler(session);
      outbox.pushFromOther(leaveGameHandlerOutbox);
    }

    this.lobbyState.removeUser(session.username);

    this.userSessionRegistry.unregister(session.connectionId);
    this.updateGateway.unregisterEndpoint(session.connectionId);

    return outbox;
  }
}
