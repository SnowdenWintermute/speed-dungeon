import { GameName, IdentityProviderId } from "../../../aliases.js";
import { GameServerSessionClaimToken } from "../../lobby-server/game-handoff/session-claim-token.js";
import {
  GlobalAuthGameSession,
  TaggedGameSessionConnectionStatus,
} from "../../sessions/global-auth-game-session.js";

export abstract class GlobalAuthGameSessionStore {
  abstract registerSession(
    identityProviderId: IdentityProviderId,
    initialGameServerSessionClaimToken: GameServerSessionClaimToken
  ): Promise<void>;
  abstract getSessionOption(
    identityProviderId: IdentityProviderId
  ): Promise<undefined | GlobalAuthGameSession>;
  abstract hasExistingSession(identityProviderId: IdentityProviderId): Promise<boolean>;
  abstract requireSession(identityProviderId: IdentityProviderId): Promise<GlobalAuthGameSession>;
  abstract updateSessionConnectionStatus(
    identityProviderId: IdentityProviderId,
    value: TaggedGameSessionConnectionStatus
  ): Promise<void>;
  abstract clearSession(identityProviderId: IdentityProviderId): Promise<void>;
  abstract clearSessionsInGame(gameName: GameName): Promise<void>;
}

export class InMemoryGlobalAuthGameSessionStore extends GlobalAuthGameSessionStore {
  private _sessions = new Map<IdentityProviderId, GlobalAuthGameSession>();

  async registerSession(
    identityProviderId: IdentityProviderId,
    initialGameServerSessionClaimToken: GameServerSessionClaimToken
  ): Promise<void> {
    const sessionAlreadyExists = await this.hasExistingSession(identityProviderId);
    if (sessionAlreadyExists) {
      throw new Error(
        `Tried to register a new GlobalAuthGameSession but one already existed for user id ${identityProviderId}`
      );
    }
    this._sessions.set(
      identityProviderId,
      new GlobalAuthGameSession(initialGameServerSessionClaimToken)
    );
  }

  async getSessionOption(
    identityProviderId: IdentityProviderId
  ): Promise<GlobalAuthGameSession | undefined> {
    return this._sessions.get(identityProviderId);
  }
  async hasExistingSession(identityProviderId: IdentityProviderId): Promise<boolean> {
    const option = await this.getSessionOption(identityProviderId);
    return !!option;
  }
  async requireSession(identityProviderId: IdentityProviderId): Promise<GlobalAuthGameSession> {
    const expected = await this.getSessionOption(identityProviderId);
    if (!expected) {
      throw new Error("Expected GlobalAuthGameSession not found");
    }
    return expected;
  }
  async updateSessionConnectionStatus(
    identityProviderId: IdentityProviderId,
    value: TaggedGameSessionConnectionStatus
  ): Promise<void> {
    const expected = await this.requireSession(identityProviderId);
    expected.connectionStatus = value;
  }
  async clearSession(identityProviderId: IdentityProviderId): Promise<void> {
    this._sessions.delete(identityProviderId);
  }

  async clearSessionsInGame(gameName: GameName): Promise<void> {
    for (const [authId, session] of this._sessions.entries()) {
      if (session.connectionStatus.gameName === gameName) {
        this.clearSession(authId);
      }
    }
  }
}
