import { LOBBY_CHANNEL } from "../../../packets/channels.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../packets/game-state-updates.js";
import { UserSessionRegistry } from "../../sessions/user-session-registry.js";
import { UserSession } from "../../sessions/user-session.js";
import {
  ConnectionIdentityResolutionContext,
  IdentityProviderService,
} from "../../services/identity-provider.js";
import { ConnectionId, Username } from "../../../aliases.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { IdGenerator } from "../../../utility-classes/index.js";
import { UserId, UserIdType } from "../../sessions/user-ids.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { SessionLifecycleController } from "../../controllers/session-lifecycle.js";

export class GameServerSessionLifecycleController
  implements SessionLifecycleController<GameStateUpdate>
{
  constructor(
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    private readonly identityProviderService: IdentityProviderService,
    private readonly idGenerator: IdGenerator
  ) {}

  async createSession(
    connectionId: ConnectionId,
    context: ConnectionIdentityResolutionContext
  ): Promise<UserSession> {
    // const authenticatedUserOption = await this.identityProviderService.resolve(context);
    // // I'm injecting it here because it will be different on the game server and the lobby server
    // const expectedGameGetter = () => {
    //   const session = this.userSessionRegistry.getExpectedSession(connectionId);
    //   const currentGameName = session.currentGameName;
    //   if (currentGameName === null) {
    //     throw new Error(ERROR_MESSAGES.USER.NO_CURRENT_GAME);
    //   }
    //   return this.lobbyState.getExpectedGame(currentGameName);
    // };
    // if (authenticatedUserOption === null) {
    //   const { username, userId } = this.createGuestUser();
    //   return new UserSession(username, connectionId, userId, expectedGameGetter);
    // }
    // const { username, userId } = authenticatedUserOption;
    // return new UserSession(username, connectionId, userId, expectedGameGetter);
  }

  async activateSession(session: UserSession) {
    // const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    // const isAuthorizedUser = session.userId.type === UserIdType.Auth;
    // if (isAuthorizedUser) {
    //   const savedCharactersOutbox =
    //     await this.savedCharactersController.fetchSavedCharactersHandler(session);
    //   outbox.pushFromOther(savedCharactersOutbox);
    // }
    // this.userSessionRegistry.register(session);
    // // tell the client their username
    // outbox.pushToConnection(session.connectionId, {
    //   type: GameStateUpdateType.ClientUsername,
    //   data: { username: session.username },
    // });
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

  cleanupSession(session: UserSession) {
    // const outbox = new MessageDispatchOutbox(this.updateDispatchFactory);
    // if (session.currentGameName !== null) {
    //   const leaveGameHandlerOutbox = this.gameLifecycleController.leaveGameHandler(session);
    //   outbox.pushFromOther(leaveGameHandlerOutbox);
    // }
    // this.lobbyState.removeUser(session.username);
    // this.userSessionRegistry.unregister(session.connectionId);
    // return outbox;
  }
}
