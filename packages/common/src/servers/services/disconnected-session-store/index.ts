import { DisconnectedSession } from "../../sessions/disconnected-session.js";
import { UserId } from "../../sessions/user-ids.js";

export interface DisconnectedSessionStoreService {
  writeDisconnectedSession(userId: UserId, record: DisconnectedSession): Promise<void>;
  getDisconnectedSession(userId: UserId): Promise<DisconnectedSession | null>;
  deleteDisconnectedSession(userId: UserId): Promise<void>;
}
