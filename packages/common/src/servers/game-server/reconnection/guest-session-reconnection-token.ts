import { GuestSingleUseReconnectionKey, GuestUserId } from "../../../aliases.js";
import { Serializable, SerializedOf } from "../../../serialization/index.js";

export class GuestSessionReconnectionToken implements Serializable {
  constructor(
    public readonly guestUserId: GuestUserId,
    public readonly singleUseReconnectionKey: GuestSingleUseReconnectionKey
  ) {}

  toSerialized() {
    return {
      guestUserId: this.guestUserId,
      singleUseReconnectionKey: this.singleUseReconnectionKey,
    };
  }

  static fromSerialized(serialized: SerializedOf<GuestSessionReconnectionToken>) {
    return new GuestSessionReconnectionToken(
      serialized.guestUserId,
      serialized.singleUseReconnectionKey
    );
  }
}
