import { GuestSingleUseReconnectionKey, GuestUserId } from "../../../aliases.js";

export class GuestSessionReconnectionToken {
  constructor(
    public readonly guestUserId: GuestUserId,
    public readonly singleUseReconnectionKey: GuestSingleUseReconnectionKey
  ) {}
}
