import { GuestSessionReconnectionToken, IdentityProviderId } from "../../aliases.js";
import {
  ReconnectionKey,
  ReconnectionKeyType,
} from "../services/reconnection-forwarding-store/index.js";
import { ReconnectionOpportunity } from "./reconnection-opportunity.js";

export class ReconnectionOpportunityManager {
  private readonly authReconnectionOpportunities = new Map<
    IdentityProviderId,
    ReconnectionOpportunity
  >();
  private readonly guestReconnectionOpportunities = new Map<
    GuestSessionReconnectionToken,
    ReconnectionOpportunity
  >();

  add(id: ReconnectionKey, opportunity: ReconnectionOpportunity) {
    switch (id.type) {
      case ReconnectionKeyType.Auth:
        return this.authReconnectionOpportunities.set(id.userId, opportunity);
      case ReconnectionKeyType.Guest:
        return this.guestReconnectionOpportunities.set(id.reconnectionToken, opportunity);
    }
  }

  remove(id: ReconnectionKey) {
    switch (id.type) {
      case ReconnectionKeyType.Auth:
        return this.authReconnectionOpportunities.delete(id.userId);
      case ReconnectionKeyType.Guest:
        return this.guestReconnectionOpportunities.delete(id.reconnectionToken);
    }
  }

  get(id: ReconnectionKey) {
    switch (id.type) {
      case ReconnectionKeyType.Auth:
        return this.authReconnectionOpportunities.get(id.userId);
      case ReconnectionKeyType.Guest:
        return this.guestReconnectionOpportunities.get(id.reconnectionToken);
    }
  }
}
