import { DisconnectedSession } from "../../sessions/disconnected-session.js";
import { DisconnectedSessionStoreService, ReconnectionKey } from "./index.js";

export class InMemoryDisconnectedSessionStoreService implements DisconnectedSessionStoreService {
  writeDisconnectedSession(
    reconnectionKey: ReconnectionKey,
    record: DisconnectedSession
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getDisconnectedSession(reconnectionKey: ReconnectionKey): Promise<DisconnectedSession | null> {
    throw new Error("Method not implemented.");
  }
  deleteDisconnectedSession(reconnectionKey: ReconnectionKey): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
