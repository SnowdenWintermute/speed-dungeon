import { IdentityProviderId } from "../../aliases.js";

export enum UserIdType {
  Auth,
  Guest,
}

export interface AuthUserId {
  type: UserIdType.Auth;
  id: IdentityProviderId;
}

export interface GuestUserId {
  type: UserIdType.Guest;
  id: string;
}

export type UserId = AuthUserId | GuestUserId;
