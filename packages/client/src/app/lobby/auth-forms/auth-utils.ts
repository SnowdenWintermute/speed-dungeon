import { TabMessageType, broadcastChannel, sessionFetcher } from "@/singletons/broadcast-channel";
import { lobbyClientSingleton } from "@/singletons/lobby-client";

export function reconnectWebsocketInAllTabs() {
  // message to have their other tabs reconnect with new cookie
  // to keep socket connections consistent with current authorization
  lobbyClientSingleton.get().resetConnection(); // this should assign their username in the connection handler
  broadcastChannel.postMessage({ type: TabMessageType.ReconnectSocket });
}

export function refetchAuthSessionInAllTabs() {
  if (sessionFetcher.fromZustand) sessionFetcher.fromZustand();
  broadcastChannel.postMessage({ type: TabMessageType.RefetchAuthSession });
}
