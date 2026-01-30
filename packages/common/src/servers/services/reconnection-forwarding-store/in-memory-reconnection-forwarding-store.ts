import { GuestSessionReconnectionToken, IdentityProviderId } from "../../../aliases.js";
import { GameServerReconnectionForwardingRecord } from "./game-server-reconnection-forwarding-record.js";
import {
  ReconnectionForwardingStoreService,
  ReconnectionKey,
  ReconnectionKeyType,
} from "./index.js";

export class InMemoryReconnectionForwardingStoreService
  implements ReconnectionForwardingStoreService
{
  private byIdentityProviderId = new Map<
    IdentityProviderId,
    GameServerReconnectionForwardingRecord
  >();
  private byReconnectionToken = new Map<
    GuestSessionReconnectionToken,
    GameServerReconnectionForwardingRecord
  >();

  async writeGameServerReconnectionForwardingRecord(
    reconnectionKey: ReconnectionKey,
    record: GameServerReconnectionForwardingRecord
  ): Promise<void> {
    switch (reconnectionKey.type) {
      case ReconnectionKeyType.Auth:
        this.byIdentityProviderId.set(reconnectionKey.userId, record);
        return;
      case ReconnectionKeyType.Guest:
        this.byReconnectionToken.set(reconnectionKey.reconnectionToken, record);
        return;
    }
  }
  async getGameServerReconnectionForwardingRecord(
    reconnectionKey: ReconnectionKey
  ): Promise<GameServerReconnectionForwardingRecord | null> {
    switch (reconnectionKey.type) {
      case ReconnectionKeyType.Auth: {
        return this.byIdentityProviderId.get(reconnectionKey.userId) || null;
      }
      case ReconnectionKeyType.Guest: {
        const stored = this.byReconnectionToken.get(reconnectionKey.reconnectionToken);
        return stored || null;
      }
    }
  }
  async deleteGameServerReconnectionForwardingRecord(
    reconnectionKey: ReconnectionKey
  ): Promise<void> {
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
