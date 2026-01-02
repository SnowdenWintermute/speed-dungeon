import { SpeedDungeonGame } from "../../game/index.js";
import { GameStateUpdateGateway } from "../update-delivery/game-state-update-gateway.js";
import { BasicRandomNumberGenerator } from "../../utility-classes/randomizers.js";
import { ClientIntentReceiver } from "../client-intent-receiver.js";
import { UserSessionRegistry } from "../sessions/user-session-registry.js";
import {
  GameStateUpdateDispatchFactory,
  GameStateUpdateDispatchType,
} from "../update-delivery/game-state-update-dispatch-factory.js";
import { SessionAuthorizationManager } from "../sessions/authorization-manager.js";
import { ClientIntent } from "../../packets/client-intents.js";
import { ConnectionId, IdentityProviderId } from "../../aliases.js";
import { GameStateUpdateDispatchOutbox } from "../update-delivery/outbox.js";

// handle a handoff
// - provisions a GameServer
// - sends Game to GameServer
// - sends Record<ClaimId, PendingSession> to GameServer
//
// - sends GameServerAddress to Players
// - sends GameServerSessionClaimToken to Players
//
// handle disconnection
// - delete the user's session and create a DisconnectedSession from its data
// - pause acceptance of user inputs until reconnection is established or a timeout has passed
// - tell the lobby server that a user in this game has disconnected with their session's associated UserId or GuestId
// - lobby records in a Map<UserId,DisconnectedSession> or Map<GuestId, DisconnectedSession>
// - lobby has a disconnected sessions cleanup loop to delete any expired disconnected sessions
//
// handle a reconnection
// - guests provide GuestId (UUID) from their local storage
// - if authenticated user, lobby server gets their UserId from lobby's auth service
// - lobby checks disconnected session lists for that GuestId or UserId
// - lobby ensures the game associated with this disconnected session is still active
// - lobby tells game server to create a new PendingReconnectionSession with new SessionClaimId
// - game server checks its DisconnectedSession list for matching
// - lobby provides a new GameServerSessionClaimToken with new SessionClaimId and GameServerAddress to client
// - client connects to the GameServerAddress with their new GameServerSessionClaimToken
// - GameServer unpauses input acceptance
//
// GameServer
// - heartbeats to Lobby so the lobby can keep record of active games for reconnection
// - missed heartbeats cause "stale" status but don't delete game record yet
// - several missed heartbeats delete the game record
//
// Tokens
// - must be single use
// - must expire

interface GameServerSessionClaimToken {
  readonly gameId: string; // UUID
  readonly sessionClaimId: string; // UUID
  // newly generate guest username or current auth username. Including this ensures that if a user
  // changed their username or were assigned a different guest username in between disconnecting and
  // reconnecting that they will show as the correct name in the game
  readonly username: string;
  readonly expiresAt: number;
  readonly signature: string; // HMAC or asymmetric signature
}

interface DisconnectedSession {
  readonly gameId: string; // UUID
  // if both guestId and userId are null, this is invalid
  readonly userId: null | IdentityProviderId; // UUID
  readonly guestId: null | string; // UUID
  readonly expiresAt: number;
  readonly signature: string; // asymmetric signature, lobby holds private key, game servers hold public key
}

export class GameServer {
  private readonly randomNumberGenerator = new BasicRandomNumberGenerator();
  private readonly updateGateway = new GameStateUpdateGateway();
  readonly userSessionRegistry = new UserSessionRegistry();
  private readonly gameStateUpdateDispatchFactory = new GameStateUpdateDispatchFactory(
    this.userSessionRegistry
  );
  public readonly sessionAuthManager: SessionAuthorizationManager;

  // controllers
  // public readonly gameLifecycleController: GameLifecycleController;
  // public readonly sessionLifecycleController: SessionLifecycleController;
  // public readonly savedCharactersController: SavedCharactersController;

  constructor(
    public readonly game: SpeedDungeonGame,
    private readonly clientIntentReceiver: ClientIntentReceiver
    // private readonly externalServices: LobbyExternalServices
  ) {
    this.clientIntentReceiver.initialize(this);
    this.clientIntentReceiver.listen();

    this.sessionAuthManager = new SessionAuthorizationManager(externalServices.profileService);
  }

  // private intentHandlers = createLobbyClientIntentHandlers(this);

  // async handleConnection(
  //   transportEndpoint: ConnectionEndpoint<GameStateUpdate, ClientIntent>,
  //   identityResolutionContext: IdentityResolutionContext
  // ) {
  //   const newSession = await this.sessionLifecycleController.createUserSession(
  //     transportEndpoint.id,
  //     identityResolutionContext
  //   );

  //   if (newSession.userId !== null) {
  //     this.externalServices.profileService.createProfileIfUserHasNone(newSession.userId);
  //   }

  //   const outbox = await this.sessionLifecycleController.connectionHandler(
  //     newSession,
  //     transportEndpoint
  //   );
  //   this.dispatchOutboxMessages(outbox);
  // }

  async handleIntent(clientIntent: ClientIntent, connectionId: ConnectionId) {
    const handlerOption = this.intentHandlers[clientIntent.type];

    if (handlerOption === undefined) {
      throw new Error("Lobby is not configured to handle this type of ClientIntent");
    }

    const fromUser = this.userSessionRegistry.getExpectedSession(connectionId);

    // a workaround is to use "as never" for some reason
    const outbox = await handlerOption(clientIntent.data as never, fromUser);
    this.dispatchOutboxMessages(outbox);
  }

  private dispatchOutboxMessages(outbox: GameStateUpdateDispatchOutbox) {
    for (const dispatch of outbox.toDispatches()) {
      switch (dispatch.type) {
        case GameStateUpdateDispatchType.Single:
          this.updateGateway.submitToConnection(dispatch.connectionId, dispatch.update);
          break;
        case GameStateUpdateDispatchType.FanOut:
          this.updateGateway.submitToConnections(dispatch.connectionIds, dispatch.update);
          break;
      }
    }
  }
}
