import { ConnectionId } from "../../aliases.js";
import { ConnectionIdentityResolutionContext } from "../services/identity-provider.js";
import { UserSession } from "../sessions/user-session.js";
import { MessageDispatchOutbox } from "../update-delivery/outbox.js";

export interface SessionLifecycleController<Sendable> {
  createSession(
    connectionId: ConnectionId,
    context: ConnectionIdentityResolutionContext
  ): Promise<UserSession>;

  activateSession(session: UserSession): Promise<MessageDispatchOutbox<Sendable>>;

  cleanupSession(session: UserSession): void;
}
