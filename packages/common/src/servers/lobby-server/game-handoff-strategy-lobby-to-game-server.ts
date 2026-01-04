import {
  ChannelName,
  ConnectionId,
  GameName,
  PartyName,
  Seconds,
  SessionClaimId,
  Username,
} from "../../aliases.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { SpeedDungeonPlayer } from "../../game/player.js";
import { GameStateUpdateType } from "../../packets/game-state-updates.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { UserId } from "../sessions/user-ids.js";
import { UserSessionRegistry } from "../sessions/user-session-registry.js";
import { UserSession } from "../sessions/user-session.js";
import { GameStateUpdateDispatchFactory } from "../update-delivery/game-state-update-dispatch-factory.js";
import { GameStateUpdateDispatchOutbox } from "../update-delivery/outbox.js";
import { GameServerNodeDirectory } from "./game-server-node-directory.js";

export enum GameServerConnectionConnectionType {
  Local,
  Remote,
}

export interface LocalGameServerConnectionInstructions {
  type: GameServerConnectionConnectionType.Local;
}

export interface RemoteGameServerConnectionInstructions {
  type: GameServerConnectionConnectionType.Remote;
  url: string;
  sessionClaimToken: GameServerSessionClaimToken;
}

export type GameServerConnectionInstructions =
  | LocalGameServerConnectionInstructions
  | RemoteGameServerConnectionInstructions;

export class PendingGameServerUserSession {
  private readonly channelsSubscribedTo = new Set<ChannelName>();
  readonly expirationTimestamp = PendingGameServerUserSession.createExpirationTimestamp();

  constructor(
    public readonly userId: UserId,
    // username at time of game creation, used to link to the player since games store players
    // by username so we don't leak userIds to clients
    // when creating a reconnection session,
    // including this ensures that if a user changed their username or were assigned a different guest
    // username in between disconnecting and reconnecting that they will show as the correct name in the game
    public readonly playerUsername: Username,
    public currentGameName: GameName,
    public currentPartyName: PartyName
  ) {}

  static readonly TimeToLive: Seconds = 5 * 60;
  static createExpirationTimestamp() {
    return Date.now() + PendingGameServerUserSession.TimeToLive;
  }
}

export class GameServerSessionClaimToken {
  readonly signature: string = ""; // asymmetric signature signed by lobby server's private key
  constructor(
    readonly sessionClaimId: SessionClaimId,
    readonly expirationTimestamp: number
  ) {}
}

// give the set up game to a GameSimulator either a locally owned GameSimulator
// on the client or send it over websockets to a GameServer which owns a GameSimulator
export interface GameHandoffStrategyLobbyToGameServer {
  handoff(game: SpeedDungeonGame): GameSimulatorConnectionInstructions;
}

export class GameHandoffManager {
  constructor(
    private readonly gameServerNodeDirectory: GameServerNodeDirectory,
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly updateFactory: GameStateUpdateDispatchFactory,
    private readonly idGenerator: IdGenerator
  ) {}

  private getPlayerSessionsInGame(game: SpeedDungeonGame) {
    const result = new Map<Username, { session: UserSession; player: SpeedDungeonPlayer }>();

    for (const [username, player] of game.getPlayers()) {
      const session = this.userSessionRegistry.getExpectedSessionInGame(username, game.name);

      result.set(username, { session, player });
    }

    return result;
  }

  private createPendingPlayerSessions(game: SpeedDungeonGame): PendingGameServerUserSession[] {
    const sessionsInGameByUsername = this.getPlayerSessionsInGame(game);
    const result = Array.from(sessionsInGameByUsername).map(([username, { session, player }]) => {
      const partyName = player.getExpectedPartyName();
      return new PendingGameServerUserSession(session.userId, username, game.name, partyName);
    });

    return result;
  }

  private prepareClaimTokens(pendingSessions: PendingGameServerUserSession[]) {
    const pendingSessionsByClaimId = new Map<SessionClaimId, PendingGameServerUserSession>();
    const claimTokensByConnectionId = new Map<ConnectionId, GameServerSessionClaimToken>();

    for (const pendingSession of pendingSessions) {
      const lobbySession = this.userSessionRegistry.getExpectedSessionInGame(
        pendingSession.playerUsername,
        pendingSession.currentGameName
      );
      const claimId = this.idGenerator.generate() as SessionClaimId;
      const claimToken = new GameServerSessionClaimToken(
        claimId,
        pendingSession.expirationTimestamp
      );

      pendingSessionsByClaimId.set(claimId, pendingSession);
      claimTokensByConnectionId.set(lobbySession.connectionId, claimToken);
    }

    return { pendingSessionsByClaimId, claimTokensByConnectionId };
  }

  // handle a handoff from Lobby to GameServer
  handoffGameHandler(game: SpeedDungeonGame) {
    // - checks existing GameServers for the one with the lowest load
    const targetServerNode = this.gameServerNodeDirectory.getLeastBusyGameServerNode();
    // - adds a local record of the game server in the local game server node registry under it's corresponding node
    // - sends Game to GameServerNode
    // - sends Record<ClaimId, PendingSession> to GameServer
    // - pending session should expire same time as SessionClaim token expires
    // - if no session is claimed within the time window, close the game
    const pendingSessions = this.createPendingPlayerSessions(game);
    const { pendingSessionsByClaimId, claimTokensByConnectionId } =
      this.prepareClaimTokens(pendingSessions);
    targetServerNode.handleNewActiveGame(game, pendingSessionsByClaimId);

    // - sends GameServerAddress to Players
    // - sends GameServerSessionClaimToken to Players
    const outbox = new GameStateUpdateDispatchOutbox(this.updateFactory);
    for (const [connectionId, sessionClaimToken] of claimTokensByConnectionId) {
      outbox.pushToConnection(connectionId, {
        type: GameStateUpdateType.GameServerConnectionInstructions,
        data: {
          connectionInstructions: {
            type: GameServerConnectionConnectionType.Remote,
            url: "",
            sessionClaimToken,
          },
        },
      });
    }

    return outbox;
  }
}
