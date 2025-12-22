import {
  ClientIntent,
  ConnectionId,
  ERROR_MESSAGES,
  IdGenerator,
  LOBBY_CHANNEL,
  SpeedDungeonGame,
} from "../index.js";
import { GameStateUpdateType } from "../packets/game-state-updates.js";
import { ClientIntentReceiver } from "./client-intent-receiver.js";
import { createLobbyClientIntentHandlers } from "./create-lobby-client-intent-handlers.js";
import { GameLifecycleManager } from "./game-lifecycle-manager.js";
import { GameStateUpdateGateway } from "./game-state-update-gateway.js";
import { LobbyState } from "./lobby-state.js";
import { SavedCharacterLoader } from "./saved-character-loader.js";
import { SpeedDungeonProfileLoader } from "./speed-dungeon-profile-loader.js";
import { TransportEndpoint } from "./transport-endpoint.js";
import { UserSessionRegistry } from "./user-session-registry.js";
import { AuthorizedSession, UserSession } from "./user-session.js";

export * from "./random-game-names.js";

// give the set up game to a GameSimulator either a locally owned GameSimulator
// on the client or send it over websockets to a GameServer which owns a GameSimulator
export interface GameSimulatorHandoffStrategy {
  handoff(game: SpeedDungeonGame): void;
}

// lives either inside a LobbyServer or locally on a ClientApp
export class Lobby {
  private readonly lobbyState = new LobbyState();
  private readonly userSessionRegistry = new UserSessionRegistry();
  public readonly gameLifecycleManager: GameLifecycleManager;

  constructor(
    private readonly updateGateway: GameStateUpdateGateway,
    // listens for client intents and delegates them to handlers
    private readonly clientIntentReceiver: ClientIntentReceiver,
    private gameSimulatorHandoffStrategy: GameSimulatorHandoffStrategy,
    private profileLoader: SpeedDungeonProfileLoader,
    private savedCharacterLoader: SavedCharacterLoader,
    private idGenerator: IdGenerator
  ) {
    this.clientIntentReceiver.initialize(this);

    this.gameLifecycleManager = new GameLifecycleManager(
      this.lobbyState,
      updateGateway,
      this.userSessionRegistry,
      idGenerator
    );
  }

  private async getAuthorizedSessionOption(
    connectionId: ConnectionId
  ): Promise<AuthorizedSession | null> {
    const session = this.userSessionRegistry.getExpectedSession(connectionId);
    if (session.userId === null) {
      return null;
    }

    const profile = await this.profileLoader.fetchExpectedProfile(session.userId);

    return { session, userId: session.userId, profile };
  }

  private async requireAuthorizedSession(connectionId: ConnectionId) {
    const session = await this.getAuthorizedSessionOption(connectionId);

    if (session === null) {
      throw new Error(ERROR_MESSAGES.AUTH.REQUIRED);
    }

    return session;
  }

  async connectionHandler(session: UserSession, endpoint: TransportEndpoint) {
    console.info(
      `-- ${session.username} (user id: ${session.userId}, connection id: ${session.connectionId}) joined the lobby`
    );

    const loggedInUser = await this.getAuthorizedSessionOption(session.connectionId);
    if (loggedInUser !== null) {
      this.fetchSavedCharactersHandler(session);
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

  async fetchSavedCharactersHandler(session: UserSession) {
    const authorizedSession = await this.requireAuthorizedSession(session.connectionId);
    const charactersResult = await this.savedCharacterLoader.fetchSavedCharacters(
      authorizedSession.profile.id
    );

    // tell this session about their saved characters
    this.updateGateway.submitToConnection(session.connectionId, {
      type: GameStateUpdateType.SavedCharacterList,
      data: { characterSlots: charactersResult },
    });
  }

  private intentHandlers = createLobbyClientIntentHandlers(this);

  handleIntent(clientIntent: ClientIntent, fromUser: UserSession) {
    const handlerOption = this.intentHandlers[clientIntent.type];
    if (handlerOption === undefined) {
      throw new Error("Lobby is not configured to handle this type of ClientIntent");
    }
    // a workaround is to use "as never" for some reason
    return handlerOption(clientIntent.data as never, fromUser);
  }
}
