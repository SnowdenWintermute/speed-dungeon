import { ConnectionId } from "../../../aliases.js";
import { ServerToServerMessage } from "../../../packets/server-to-server.js";
import { ConnectionEndpoint } from "../../../transport/connection-endpoint.js";
import { GameServerIdentityResolutionContext } from "../../services/identity-provider.js";
import {
  GameServerSession,
  GameServerSessionRegistry,
} from "../../sessions/game-server-session-registry.js";

export class GameServerSessionLifecycleController {
  constructor(private readonly gameServerSessionRegistry: GameServerSessionRegistry) {}

  private requireValidIdentityToken(context: GameServerIdentityResolutionContext) {
    // @TODO - validate the HMAC token
  }

  createServerSession(connectionId: ConnectionId, context: GameServerIdentityResolutionContext) {
    // validate their context's signature
    this.requireValidIdentityToken(context);
    // make sure current session doesn't exist
    this.gameServerSessionRegistry.requireNoExistingConnection(context.gameServerId);
    return new GameServerSession(
      connectionId,
      context.gameServerId,
      context.gameServerName,
      context.gameServerUrl
    );
  }

  async connectionHandler(
    session: GameServerSession,
    endpoint: ConnectionEndpoint<ServerToServerMessage, ServerToServerMessage>
  ) {
    console.info(
      `-- Game Server ${session.name} (game server id: ${session.id}, connection id: ${session.connectionId}) connected to the lobby`
    );

    this.gameServerSessionRegistry.register(session);
    // this.updateGateway.registerEndpoint(session.connectionId, endpoint);

    // const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);

    // // tell the client their username
    // outbox.pushToConnection(session.connectionId, {
    //   type: GameStateUpdateType.ClientUsername,
    //   data: { username: session.username },
    // });

    // const isAuthorizedUser = loggedInUser !== null;
    // const userChannelDisplayData = this.lobbyState.addUser(session.username, isAuthorizedUser);
    // session.subscribeToChannel(LOBBY_CHANNEL);

    // // tell the client about the channel they are in and other users in the lobby channel
    // outbox.pushToConnection(session.connectionId, {
    //   type: GameStateUpdateType.ChannelFullUpdate,
    //   data: { channelName: LOBBY_CHANNEL, users: this.lobbyState.getUsersList() },
    // });

    // // tell other clients in the lobby that this user joined
    // outbox.pushToChannel(
    //   LOBBY_CHANNEL,
    //   {
    //     type: GameStateUpdateType.UserJoinedChannel,
    //     data: { username: session.username, userChannelDisplayData },
    //   },
    //   { excludedIds: [session.connectionId] }
    // );

    // return outbox;
  }
}
