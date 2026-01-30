import { GuestSessionReconnectionToken, IdentityProviderId } from "../../../aliases.js";
import { DisconnectedSession } from "../../sessions/disconnected-session.js";
import {
  ReconnectionForwardingStoreService,
  ReconnectionKey,
  ReconnectionKeyType,
} from "./index.js";

export class InMemoryReconnectionForwardingStoreService
  implements ReconnectionForwardingStoreService
{
  private byIdentityProviderId = new Map<IdentityProviderId, DisconnectedSession>();
  private byReconnectionToken = new Map<GuestSessionReconnectionToken, DisconnectedSession>();

  async writeDisconnectedSession(
    reconnectionKey: ReconnectionKey,
    record: DisconnectedSession
  ): Promise<void> {
    switch (reconnectionKey.type) {
      case ReconnectionKeyType.Auth:
        this.byIdentityProviderId.set(reconnectionKey.userId, record);
        return;
      case ReconnectionKeyType.Guest:
        this.byReconnectionToken.set(reconnectionKey.reconnectionToken, record);
        console.log("set disconnected session:", this.byReconnectionToken);
        return;
    }
  }
  async getDisconnectedSession(
    reconnectionKey: ReconnectionKey
  ): Promise<DisconnectedSession | null> {
    switch (reconnectionKey.type) {
      case ReconnectionKeyType.Auth: {
        return this.byIdentityProviderId.get(reconnectionKey.userId) || null;
      }
      case ReconnectionKeyType.Guest: {
        console.log(
          "trying to get DisconnectedSession by guest key:",
          reconnectionKey,
          this.byReconnectionToken
        );
        const stored = this.byReconnectionToken.get(reconnectionKey.reconnectionToken);
        console.log("stored:", stored);
        return this.byReconnectionToken.get(reconnectionKey.reconnectionToken) || null;
      }
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
