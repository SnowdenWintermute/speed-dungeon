import { DisconnectedSession } from "../../sessions/disconnected-session.js";
import { UserId } from "../../sessions/user-ids.js";
import { DisconnectedSessionStoreService } from "./index.js";

export class InMemoryDisconnectedSessionStoreService implements DisconnectedSessionStoreService {
  writeDisconnectedSession(userId: UserId, record: DisconnectedSession): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getDisconnectedSession(userId: UserId): Promise<DisconnectedSession | null> {
    throw new Error("Method not implemented.");
  }
  deleteDisconnectedSession(userId: UserId): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
