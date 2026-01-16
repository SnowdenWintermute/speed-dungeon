import { GuestSessionReconnectionToken, IdentityProviderId } from "../../../aliases.js";
import { DisconnectedSession } from "../../sessions/disconnected-session.js";
import { DisconnectedSessionStoreService, ReconnectionKey, ReconnectionKeyType } from "./index.js";

export class InMemoryDisconnectedSessionStoreService implements DisconnectedSessionStoreService {
  private byIdentityProviderId = new Map<IdentityProviderId, DisconnectedSession>();
  private byReconnectionToken = new Map<GuestSessionReconnectionToken, DisconnectedSession>();

  async writeDisconnectedSession(
    reconnectionKey: ReconnectionKey,
    record: DisconnectedSession
  ): Promise<void> {
    console.log("setting reconnectionKey:", reconnectionKey, record);
    switch (reconnectionKey.type) {
      case ReconnectionKeyType.Auth:
        this.byIdentityProviderId.set(reconnectionKey.userId, record);
        return;
      case ReconnectionKeyType.Guest:
        this.byReconnectionToken.set(reconnectionKey.reconnectionToken, record);
        return;
    }
  }
  async getDisconnectedSession(
    reconnectionKey: ReconnectionKey
  ): Promise<DisconnectedSession | null> {
    console.log(
      "attempting to get DisconnectedSession with key:",
      reconnectionKey,
      this.byIdentityProviderId,
      this.byReconnectionToken
    );
    switch (reconnectionKey.type) {
      case ReconnectionKeyType.Auth:
        return this.byIdentityProviderId.get(reconnectionKey.userId) || null;
      case ReconnectionKeyType.Guest:
        return this.byReconnectionToken.get(reconnectionKey.reconnectionToken) || null;
    }
  }
  async deleteDisconnectedSession(reconnectionKey: ReconnectionKey): Promise<void> {
    switch (reconnectionKey.type) {
      case ReconnectionKeyType.Auth:
        this.byIdentityProviderId.delete(reconnectionKey.userId);
        break;
      case ReconnectionKeyType.Guest:
        this.byReconnectionToken.delete(reconnectionKey.reconnectionToken);
        break;
    }
  }
}
