import { LOBBY_CHANNEL } from "../packets/channels.js";
import { GameStateUpdateType } from "../packets/game-state-updates.js";
import { GameLifecycleController } from "./game-lifecycle-controller.js";
import { GameStateUpdateDispatchFactory } from "./game-state-update-dispatch-factory.js";
import { GameStateUpdateGateway } from "./game-state-update-gateway.js";
import { LobbyState } from "./lobby-state.js";
import { SavedCharactersController } from "./saved-characters-controller.js";
import { SessionAuthorizationManager } from "./session-authorization-manager.js";
import { TransportDisconnectReason, TransportEndpoint } from "./transport-endpoint.js";
import { GameStateUpdateDispatchOutbox } from "./update-dispatch-outbox.js";
import { UserSessionRegistry } from "./user-session-registry.js";
import { UserSession } from "./user-session.js";

export class SessionLifecycleController {
  constructor(
    private readonly lobbyState: LobbyState,
    private readonly updateGateway: GameStateUpdateGateway,
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly sessionAuthManager: SessionAuthorizationManager,
    private readonly updateDispatchFactory: GameStateUpdateDispatchFactory,
    private readonly savedCharactersController: SavedCharactersController,
    private readonly gameLifecycleController: GameLifecycleController
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
