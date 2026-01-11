import { LOBBY_CHANNEL } from "../../../packets/channels.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../packets/game-state-updates.js";
import { UserSessionRegistry } from "../../sessions/user-session-registry.js";
import { UserSession } from "../../sessions/user-session.js";
import {
  ConnectionIdentityResolutionContext,
  IdentityProviderService,
} from "../../services/identity-provider.js";
import { ConnectionId, Username } from "../../../aliases.js";
import { LobbyState } from "../lobby-state.js";
import { SavedCharactersController } from "./saved-characters.js";
import { GameLifecycleController } from "./game-lifecycle.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { PLAYER_FIRST_NAMES, PLAYER_LAST_NAMES } from "../default-names/users.js";
import { IdGenerator } from "../../../utility-classes/index.js";
import { UserId, UserIdType } from "../../sessions/user-ids.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";

export class LobbySessionLifecycleController {
  constructor(
    private readonly lobbyState: LobbyState,
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    private readonly savedCharactersController: SavedCharactersController,
    private readonly gameLifecycleController: GameLifecycleController,
    private readonly identityProviderService: IdentityProviderService,
    private readonly idGenerator: IdGenerator
  ) {}

  async createUserSession(
    connectionId: ConnectionId,
    context: ConnectionIdentityResolutionContext
  ): Promise<UserSession> {
    const authenticatedUserOption = await this.identityProviderService.resolve(context);

    // I'm injecting it here because it will be different on the game server and the lobby server
    const expectedGameGetter = () => {
      const session = this.userSessionRegistry.getExpectedSession(connectionId);
      const currentGameName = session.currentGameName;
      if (currentGameName === null) {
        throw new Error(ERROR_MESSAGES.USER.NO_CURRENT_GAME);
      }

      return this.lobbyState.getExpectedGame(currentGameName);
    };

    if (authenticatedUserOption === null) {
      const { username, userId } = this.createGuestUser();
      return new UserSession(username, connectionId, userId, expectedGameGetter);
    }

    const { username, userId } = authenticatedUserOption;

    return new UserSession(username, connectionId, userId, expectedGameGetter);
  }

  private generateRandomUsername() {
    const firstName = PLAYER_FIRST_NAMES[Math.floor(Math.random() * PLAYER_FIRST_NAMES.length)];
    const lastName = PLAYER_LAST_NAMES[Math.floor(Math.random() * PLAYER_LAST_NAMES.length)];
    return `${firstName} ${lastName}` as Username;
  }

  private createGuestUser() {
    const userId: UserId = { type: UserIdType.Guest, id: this.idGenerator.generate() };
    return { username: this.generateRandomUsername(), userId };
  }

  async connectionHandler(session: UserSession) {
    const isAuthorizedUser = session.userId.type === UserIdType.Auth;
    if (isAuthorizedUser) {
      this.savedCharactersController.fetchSavedCharactersHandler(session);
    }

    this.userSessionRegistry.register(session);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);

    // tell the client their username
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.ClientUsername,
      data: { username: session.username },
    });

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

  async disconnectionHandler(session: UserSession) {
    const outbox = new MessageDispatchOutbox(this.updateDispatchFactory);
    if (session.currentGameName !== null) {
      const leaveGameHandlerOutbox = this.gameLifecycleController.leaveGameHandler(session);
      outbox.pushFromOther(leaveGameHandlerOutbox);
    }

    this.lobbyState.removeUser(session.username);

    this.userSessionRegistry.unregister(session.connectionId);

    return outbox;
  }
}
