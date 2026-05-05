import { IdentityProviderId } from "../../../aliases.js";
import {
  GameSessionConnectionStatus,
  GlobalAuthGameSession,
} from "../../sessions/global-auth-game-session.js";

export abstract class GlobalAuthGameSessionStore {
  abstract registerSession(
    identityProviderId: IdentityProviderId,
    value: GlobalAuthGameSession
  ): Promise<void>;
  abstract getSessionOption(
    identityProviderId: IdentityProviderId
  ): Promise<undefined | GlobalAuthGameSession>;
  abstract hasExistingSession(identityProviderId: IdentityProviderId): Promise<boolean>;
  abstract requireSession(identityProviderId: IdentityProviderId): Promise<GlobalAuthGameSession>;
  abstract updateSessionConnectionStatus(
    identityProviderId: IdentityProviderId,
    value: GameSessionConnectionStatus
  ): Promise<void>;
  abstract clearSession(identityProviderId: IdentityProviderId): Promise<void>;
}

export class InMemoryGlobalAuthGameSessionStore extends GlobalAuthGameSessionStore {
  private _sessions = new Map<IdentityProviderId, GlobalAuthGameSession>();

  async registerSession(identityProviderId: IdentityProviderId): Promise<void> {
    this._sessions.set(identityProviderId, new GlobalAuthGameSession());
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
    value: GameSessionConnectionStatus
  ): Promise<void> {
    const expected = await this.requireSession(identityProviderId);
    expected.connectionStatus = value;
  }
  async clearSession(identityProviderId: IdentityProviderId): Promise<void> {
    this._sessions.delete(identityProviderId);
  }
}
