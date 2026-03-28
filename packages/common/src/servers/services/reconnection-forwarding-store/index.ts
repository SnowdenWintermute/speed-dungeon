import { GuestSessionReconnectionToken, IdentityProviderId } from "../../../aliases.js";
import { GameServerReconnectionForwardingRecord } from "./game-server-reconnection-forwarding-record.js";

export enum ReconnectionKeyType {
  Auth,
  Guest,
}

export interface GuestReconnectionKey {
  type: ReconnectionKeyType.Guest;
  reconnectionToken: GuestSessionReconnectionToken;
}

export interface AuthReconnectionKey {
  type: ReconnectionKeyType.Auth;
  userId: IdentityProviderId;
}

export type ReconnectionKey = GuestReconnectionKey | AuthReconnectionKey;

export interface ReconnectionForwardingStoreService {
  writeGameServerReconnectionForwardingRecord(
    reconnectionKey: ReconnectionKey,
    record: GameServerReconnectionForwardingRecord
  ): Promise<void>;
  getGameServerReconnectionForwardingRecord(
    reconnectionKey: ReconnectionKey
  ): Promise<GameServerReconnectionForwardingRecord | null>;
  deleteGameServerReconnectionForwardingRecord(reconnectionKey: ReconnectionKey): Promise<void>;
}
