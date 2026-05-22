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
import { MapUtils } from "../../../utils/map-utils.js";
import { GuestSessionReconnectionToken } from "../../game-server/reconnection/guest-session-reconnection-token.js";
import { OpaqueEncryptionTokenCodec } from "../game-handoff/session-claim-token.js";
import { throwIfLoopLimitReached } from "../../../utils/index.js";
import { CharacterControlScheme, GameMode } from "../../../game-modes/index.js";
import { IronmanRunController } from "../../controllers/ironman-run-controller.js";

export class LobbySessionLifecycleController
  implements SessionLifecycleController<GameStateUpdate>
{
  constructor(
    private readonly lobbyState: LobbyState,
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    private readonly savedCharactersController: SavedCharactersController,
    private readonly savedIronmanRunsController: IronmanRunController,
    private readonly gameLifecycleController: LobbyGameLifecycleController,
    private readonly identityProviderService: IdentityProviderService,
    private readonly idGenerator: IdGenerator,
    private readonly guestReconnectionTokenCodec: OpaqueEncryptionTokenCodec<GuestSessionReconnectionToken>
  ) {}

  async createSession(
    connectionId: ConnectionId,
    context: ConnectionIdentityResolutionContext
  ): Promise<UserSession> {
    const authenticatedUserOption = await this.identityProviderService.resolve(context);

    if (authenticatedUserOption === null) {
      const { username, taggedUserId } = this.createGuestUser(this.userSessionRegistry);
      const guestSession = new UserSession(
        username,
        connectionId,
        taggedUserId,
        this.lobbyState.gameRegistry
      );

      // given by game server to guests on disconnect to identify them
      if (context.clientCachedGuestReconnectionToken) {
        const decrypted = await this.guestReconnectionTokenCodec.decode(
          context.clientCachedGuestReconnectionToken
        );
        guestSession.setGuestReconnectionToken(decrypted);
      }
      return guestSession;
    } else {
      const { username, taggedUserId } = authenticatedUserOption;
      const result = new UserSession(
        username,
        connectionId,
        taggedUserId,
        this.lobbyState.gameRegistry
      );
      return result;
    }
  }

  private createGuestUser(userSessionRegistry: UserSessionRegistry) {
    const guestId = this.idGenerator.generate() as GuestUserId;
    const taggedUserId: TaggedUserId = {
      type: UserIdType.Guest,
      id: guestId,
    };

    let username = this.generateRandomUsername();

    let safetyCounter = 0;
    while (userSessionRegistry.getSessionByUsername(username)) {
      safetyCounter += 1;
      throwIfLoopLimitReached(safetyCounter);
      username = this.generateRandomUsername();
    }

    return { username, taggedUserId };
  }

  private generateRandomUsername() {
    const firstName = PLAYER_FIRST_NAMES[Math.floor(Math.random() * PLAYER_FIRST_NAMES.length)];
    const lastName = PLAYER_LAST_NAMES[Math.floor(Math.random() * PLAYER_LAST_NAMES.length)];
    const randomFourDigitNumber = Math.floor(1000 + Math.random() * 9000);
    return `${firstName} ${lastName} [${randomFourDigitNumber}]` as Username;
  }

  async activateSession(
    session: UserSession,
    options?: {
      sessionWillBeForwardedToGameServer?: boolean;
    }
  ) {
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    this.userSessionRegistry.register(session);

    // tell the client their username
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.OnConnection,
      data: {
        username: session.username,
        willBeReconnectedToGame: options?.sessionWillBeForwardedToGameServer,
      },
    });

    // don't set up all their lobby stuff because we just want to forward them
    // to their disconnected session in the game server
    if (options?.sessionWillBeForwardedToGameServer) {
      return outbox;
    }

    // @TODO - determine what default (control scheme) characters to send them
    // or send all, or just send metadata enough to render the models
    if (session.isAuth() && session.taggedUserId.type === UserIdType.Auth) {
      const captainsSavedCharactersOutbox =
        await this.savedCharactersController.fetchSavedCharactersHandler(session, {
          gameMode: GameMode.Progression,
          controlScheme: CharacterControlScheme.Captain,
        });
      const freelancersSavedCharactersOutbox =
        await this.savedCharactersController.fetchSavedCharactersHandler(session, {
          gameMode: GameMode.Progression,
          controlScheme: CharacterControlScheme.Freelancer,
        });
      // @TODO @PERF
      // - defer sending their runs until they ask for them,
      // - don't send the entire run, just some descriptive data
      const ironmanRunsOutbox =
        await this.savedIronmanRunsController.getUserSavedIronmanRunsOutbox(session);
      outbox.pushFromOther(ironmanRunsOutbox);
      outbox.pushFromOther(captainsSavedCharactersOutbox);
      outbox.pushFromOther(freelancersSavedCharactersOutbox);
    }

    const userChannelDisplayData = this.lobbyState.addUser(session.username, session.isAuth());
    session.subscribeToChannel(LOBBY_CHANNEL);

    // tell the client about the channel they are in and other users in the lobby channel
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.ChannelFullUpdate,
      data: {
        channelName: LOBBY_CHANNEL,
        users: MapUtils.serialize(this.lobbyState.getUsersList()),
      },
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
    const outbox = new MessageDispatchOutbox(this.updateDispatchFactory);
    if (session.currentGameId !== null) {
      const leaveGameHandlerOutbox = await this.gameLifecycleController.leaveGameHandler(session);
      outbox.pushFromOther(leaveGameHandlerOutbox);
    }

    // they would not be in the lobby if disconnecting after getting their reconnection
    // referral to the game server
    const wasInLobbyChannel = this.lobbyState.removeUserIfInLobbyChannel(session.username);
    if (wasInLobbyChannel) {
      outbox.pushToChannel(LOBBY_CHANNEL, {
        type: GameStateUpdateType.UserLeftChannel,
        data: { username: session.username },
      });
    }

    this.userSessionRegistry.unregister(session.connectionId);

    return outbox;
  }
}
