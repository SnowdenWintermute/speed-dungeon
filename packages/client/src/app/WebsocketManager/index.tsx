"use client";
import React, { useEffect } from "react";
import { websocketConnection } from "@/singletons/websocket-connection";
import setUpBasicLobbyEventHandlers from "./basic-lobby-event-handlers";
import setUpGameLobbyEventHandlers from "./lobby-event-handlers";
import setUpGameEventHandlers from "./game-event-handlers";
import setUpSavedCharacterEventListeners from "./saved-character-event-handlers";

export default function WebsocketManager() {
  useEffect(() => {
  setUpBasicLobbyEventHandlers(websocketConnection);
  setUpGameLobbyEventHandlers(websocketConnection);
  setUpGameEventHandlers(websocketConnection);
  setUpSavedCharacterEventListeners(websocketConnection);
  console.log("all listeners set up");
    websocketConnection.connect();
    console.log("attempting connection");
    return () => {
    websocketConnection.removeAllListeners();
      websocketConnection.disconnect();
    };
  }, []);

  return <div id="websocket-manager" />;
}
