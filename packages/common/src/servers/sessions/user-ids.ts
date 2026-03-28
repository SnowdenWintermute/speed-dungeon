import { GuestUserId, IdentityProviderId } from "../../aliases.js";

export enum UserIdType {
  Auth,
  Guest,
}

export interface AuthTaggedUserId {
  type: UserIdType.Auth;
  id: IdentityProviderId;
}

export interface GuestTaggedUserId {
  type: UserIdType.Guest;
  id: GuestUserId;
}

export type UserId = IdentityProviderId | GuestUserId;

export type TaggedUserId = AuthTaggedUserId | GuestTaggedUserId;
