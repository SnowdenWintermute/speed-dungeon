import { GuestSessionReconnectionToken, IdentityProviderId } from "../../../aliases.js";
import { DisconnectedSession } from "../../sessions/disconnected-session.js";

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

export interface DisconnectedSessionStoreService {
  writeDisconnectedSession(
    reconnectionKey: ReconnectionKey,
    record: DisconnectedSession
  ): Promise<void>;
  getDisconnectedSession(reconnectionKey: ReconnectionKey): Promise<DisconnectedSession | null>;
  deleteDisconnectedSession(reconnectionKey: ReconnectionKey): Promise<void>;
}
