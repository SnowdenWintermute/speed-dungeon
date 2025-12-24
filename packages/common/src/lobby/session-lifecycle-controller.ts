import { LOBBY_CHANNEL } from "../packets/channels.js";
import { GameStateUpdateType } from "../packets/game-state-updates.js";
import { GameStateUpdateGateway } from "./game-state-update-gateway.js";
import { LobbyState } from "./lobby-state.js";
import { SavedCharactersController } from "./saved-characters-controller.js";
import { SessionAuthorizationManager } from "./session-authorization-manager.js";
import { TransportEndpoint } from "./transport-endpoint.js";
import { UserSessionRegistry } from "./user-session-registry.js";
import { UserSession } from "./user-session.js";

export class SessionLifecycleController {
  constructor(
    private readonly lobbyState: LobbyState,
    private readonly updateGateway: GameStateUpdateGateway,
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly sessionAuthManager: SessionAuthorizationManager,
    private readonly savedCharactersController: SavedCharactersController
  ) {}

  async connectionHandler(session: UserSession, endpoint: TransportEndpoint) {
    console.info(
      `-- ${session.username} (user id: ${session.userId}, connection id: ${session.connectionId}) joined the lobby`
    );

    const loggedInUser = await this.sessionAuthManager.getAuthorizedSessionOption(
      session.connectionId
    );
    if (loggedInUser !== null) {
      this.savedCharactersController.fetchSavedCharactersHandler(session);
    }

    this.userSessionRegistry.register(session);
    this.updateGateway.registerEndpoint(session.connectionId, endpoint);

    // tell the client their username
    this.updateGateway.submitToConnection(session.connectionId, {
      type: GameStateUpdateType.ClientUsername,
      data: { username: session.username },
    });

    const isAuthorizedUser = loggedInUser !== null;
    const userChannelDisplayData = this.lobbyState.addUser(session.username, isAuthorizedUser);
    session.subscribeToChannel(LOBBY_CHANNEL);

    // tell the client about the channel they are in and other users in the lobby channel
    this.updateGateway.submitToConnection(session.connectionId, {
      type: GameStateUpdateType.ChannelFullUpdate,
      data: { channelName: LOBBY_CHANNEL, users: this.lobbyState.getUsersList() },
    });

    // tell other clients in the lobby that this user joined
    this.updateGateway.submitToConnections(
      this.userSessionRegistry.in(LOBBY_CHANNEL, { excludedIds: [session.connectionId] }),
      {
        type: GameStateUpdateType.UserJoinedChannel,
        data: { username: session.username, userChannelDisplayData },
      }
    );
  }
}
