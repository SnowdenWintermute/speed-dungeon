import { GuestSingleUseReconnectionKey, IdentityProviderId } from "../../../aliases.js";

export enum ReconnectionKeyType {
  Auth,
  Guest,
}

export interface GuestReconnectionKey {
  type: ReconnectionKeyType.Guest;
  reconnectionToken: GuestSingleUseReconnectionKey;
}

export interface AuthReconnectionKey {
  type: ReconnectionKeyType.Auth;
  userId: IdentityProviderId;
}

export type ReconnectionKey = GuestReconnectionKey | AuthReconnectionKey;
