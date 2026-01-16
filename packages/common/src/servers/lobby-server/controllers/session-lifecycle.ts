import { LOBBY_CHANNEL } from "../../../packets/channels.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../packets/game-state-updates.js";
import { UserSessionRegistry } from "../../sessions/user-session-registry.js";
import { UserSession } from "../../sessions/user-session.js";
import {
  ConnectionIdentityResolutionContext,
  IdentityProviderService,
} from "../../services/identity-provider.js";
import { ConnectionId, GuestUserId, Username } from "../../../aliases.js";
import { LobbyState } from "../lobby-state.js";
import { SavedCharactersController } from "./saved-characters.js";
import { LobbyGameLifecycleController } from "./game-lifecycle.js";
import { PLAYER_FIRST_NAMES, PLAYER_LAST_NAMES } from "../default-names/users.js";
import { IdGenerator } from "../../../utility-classes/index.js";
import { TaggedUserId, UserIdType } from "../../sessions/user-ids.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { SessionLifecycleController } from "../../controllers/session-lifecycle.js";

export class LobbySessionLifecycleController
  implements SessionLifecycleController<GameStateUpdate>
{
  constructor(
    private readonly lobbyState: LobbyState,
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    private readonly savedCharactersController: SavedCharactersController,
    private readonly gameLifecycleController: LobbyGameLifecycleController,
    private readonly identityProviderService: IdentityProviderService,
    private readonly idGenerator: IdGenerator
  ) {}

  async createSession(
    connectionId: ConnectionId,
    context: ConnectionIdentityResolutionContext
  ): Promise<UserSession> {
    const authenticatedUserOption = await this.identityProviderService.resolve(context);

    if (authenticatedUserOption === null) {
      const { username, taggedUserId } = this.createGuestUser();
      return new UserSession(username, connectionId, taggedUserId, this.lobbyState.gameRegistry);
    }

    const { username, taggedUserId } = authenticatedUserOption;

    return new UserSession(username, connectionId, taggedUserId, this.lobbyState.gameRegistry);
  }

  private createGuestUser() {
    const taggedUserId: TaggedUserId = {
      type: UserIdType.Guest,
      id: this.idGenerator.generate() as GuestUserId,
    };

    const username = this.generateRandomUsername();

    return { username, taggedUserId };
  }

  private generateRandomUsername() {
    const firstName = PLAYER_FIRST_NAMES[Math.floor(Math.random() * PLAYER_FIRST_NAMES.length)];
    const lastName = PLAYER_LAST_NAMES[Math.floor(Math.random() * PLAYER_LAST_NAMES.length)];
    return `${firstName} ${lastName}` as Username;
  }

  async activateSession(
    session: UserSession,
    options?: { sessionWillBeForwardedToGameServer: boolean }
  ) {
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    this.userSessionRegistry.register(session);

    // tell the client their username
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.ClientUsername,
      data: { username: session.username },
    });

    // don't set up all their lobby stuff because we just want to forward them
    // to their disconnected session in the game server
    if (options?.sessionWillBeForwardedToGameServer) {
      return outbox;
    }

    if (session.isAuth()) {
      const savedCharactersOutbox =
        await this.savedCharactersController.fetchSavedCharactersHandler(session);
      outbox.pushFromOther(savedCharactersOutbox);
    }

    const userChannelDisplayData = this.lobbyState.addUser(session.username, session.isAuth());
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

  async cleanupSession(session: UserSession) {
    console.log("cleaning up session: ", session);
    const outbox = new MessageDispatchOutbox(this.updateDispatchFactory);
    if (session.currentGameName !== null) {
      const leaveGameHandlerOutbox = await this.gameLifecycleController.leaveGameHandler(session);
      outbox.pushFromOther(leaveGameHandlerOutbox);
    }

    this.lobbyState.removeUser(session.username);

    this.userSessionRegistry.unregister(session.connectionId);

    return outbox;
  }
}
