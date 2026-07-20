import {
  GameId,
  GameServerName,
  GameSessionConnectionStatus,
  GlobalGameSession,
  GuestSessionReconnectionToken,
  TaggedUserId,
  UserGlobalGameSessionStore,
  UserIdType,
  UserSession,
} from "@speed-dungeon/common";
import { ValkeyManager } from "../kv-store/valkey-manager.js";

const AUTH_SESSIONS_HASH = "global-game-session:auth";
const GUEST_SESSIONS_HASH = "global-game-session:guest";

// auth ids are numeric brands, so the hash field is their string form
function userIdField(taggedUserId: TaggedUserId): string {
  return String(taggedUserId.id);
}

export class ValkeyUserGlobalGameSessionStore extends UserGlobalGameSessionStore {
  constructor(private readonly valkeyManager: ValkeyManager) {
    super();
  }

  async registerSession(
    localUserSession: UserSession,
    gameServerName: GameServerName,
    connectionStatus: GameSessionConnectionStatus
  ): Promise<void> {
    const { taggedUserId } = localUserSession;
    const sessionAlreadyExists = await this.hasExistingSession(taggedUserId);
    if (sessionAlreadyExists) {
      throw new Error(
        `Tried to register a new GlobalAuthGameSession but one already existed for user id ${taggedUserId}`
      );
    }
    const newGlobalSession = GlobalGameSession.fromUserSession(
      localUserSession,
      gameServerName,
      connectionStatus
    );
    await this.writeSession(taggedUserId, newGlobalSession);
  }

  async getSessionOption(taggedUserId: TaggedUserId): Promise<GlobalGameSession | undefined> {
    const raw = await this.valkeyManager.hGet(
      this.hashForUserType(taggedUserId),
      userIdField(taggedUserId)
    );
    if (raw == null) {
      return undefined;
    }
    return GlobalGameSession.fromSerialized(JSON.parse(raw));
  }

  async hasExistingSession(taggedUserId: TaggedUserId): Promise<boolean> {
    const option = await this.getSessionOption(taggedUserId);
    return !!option;
  }

  async requireSession(taggedUserId: TaggedUserId): Promise<GlobalGameSession> {
    const expected = await this.getSessionOption(taggedUserId);
    if (!expected) {
      throw new Error("Expected GlobalAuthGameSession not found");
    }
    return expected;
  }

  async updateSessionConnectionStatus(
    taggedUserId: TaggedUserId,
    value: GameSessionConnectionStatus
  ): Promise<void> {
    const expected = await this.requireSession(taggedUserId);
    expected.connectionStatus = value;
    await this.writeSession(taggedUserId, expected);
  }

  async updateGuestReconnectionToken(
    taggedUserId: TaggedUserId,
    value: GuestSessionReconnectionToken | null
  ): Promise<void> {
    const expected = await this.requireSession(taggedUserId);
    expected.guestSessionReconnectionToken = value;
    await this.writeSession(taggedUserId, expected);
  }

  async clearSession(taggedUserId: TaggedUserId): Promise<void> {
    await this.valkeyManager.hDel(this.hashForUserType(taggedUserId), userIdField(taggedUserId));
  }

  async clearSessionsInGame(gameId: GameId): Promise<void> {
    await this.clearSessionsInGameFromHash(AUTH_SESSIONS_HASH, gameId);
    await this.clearSessionsInGameFromHash(GUEST_SESSIONS_HASH, gameId);
  }

  private hashForUserType(taggedUserId: TaggedUserId): string {
    switch (taggedUserId.type) {
      case UserIdType.Auth:
        return AUTH_SESSIONS_HASH;
      case UserIdType.Guest:
        return GUEST_SESSIONS_HASH;
    }
  }

  private async writeSession(taggedUserId: TaggedUserId, session: GlobalGameSession) {
    await this.valkeyManager.hSet(
      this.hashForUserType(taggedUserId),
      userIdField(taggedUserId),
      JSON.stringify(session.toSerialized())
    );
  }

  private async clearSessionsInGameFromHash(hash: string, gameId: GameId) {
    const all = await this.valkeyManager.hGetAll(hash);
    const idsToRemove: string[] = [];
    for (const [userId, raw] of Object.entries(all)) {
      const session = GlobalGameSession.fromSerialized(JSON.parse(raw));
      if (session.gameId === gameId) {
        idsToRemove.push(userId);
      }
    }
    if (idsToRemove.length > 0) {
      await this.valkeyManager.hDel(hash, idsToRemove);
    }
  }
}
