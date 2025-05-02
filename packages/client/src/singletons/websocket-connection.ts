"use client";
import { setAlert } from "@/app/components/alerts";
import { useGameStore } from "@/stores/game-store";
import { useLobbyStore } from "@/stores/lobby-store";
import {
  ClientToServerEvent,
  ClientToServerEventTypes,
  InputLock,
  ServerToClientEvent,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { Socket, io } from "socket.io-client";
import setUpBasicLobbyEventHandlers from "@/app/websocket-manager/basic-lobby-event-handlers";
import { setUpGameLobbyEventHandlers } from "@/app/websocket-manager/lobby-event-handlers";
import setUpGameEventHandlers from "@/app/websocket-manager/game-event-handlers";
import setUpSavedCharacterEventListeners from "@/app/websocket-manager/saved-character-event-handlers";
import getCurrentParty from "@/utils/getCurrentParty";

const socketAddress = process.env.NEXT_PUBLIC_WS_SERVER_URL;

export const websocketConnection: Socket<ServerToClientEventTypes, ClientToServerEventTypes> = io(
  socketAddress || "",
  {
    transports: ["websocket"],
    withCredentials: true,
    autoConnect: false,
  }
);

export function resetWebsocketConnection() {
  websocketConnection.disconnect();
  websocketConnection.connect();
  console.log("reconnecting");
}

websocketConnection.on("connect", () => {
  console.log("connected");
  useGameStore.getState().mutateState((state) => {
    state.game = null;
  });
  useLobbyStore.getState().mutateState((state) => {
    state.websocketConnected = true;
  });
  // gameWorld.current?.modelManager.clearAllModels();
  websocketConnection.emit(ClientToServerEvent.RequestsGameList);
  websocketConnection.emit(ClientToServerEvent.GetSavedCharactersList);
});

websocketConnection.on("disconnect", () => {
  console.log("disconnected");
  useLobbyStore.getState().mutateState((state) => {
    state.websocketConnected = false;
  });
});
websocketConnection.on(ServerToClientEvent.ErrorMessage, (message) => {
  setAlert(new Error(message));

  // this is a quick and dirty fix until we have a way to associate errors
  // with certain actions, which would also be good to associate responses with
  // certain actions so we can show the buttons in a loading state
  useGameStore.getState().mutateState((state) => {
    const partyOption = getCurrentParty(state, state.username || "");
    if (partyOption) InputLock.unlockInput(partyOption.inputLock);
  });
});

setUpBasicLobbyEventHandlers(websocketConnection);
setUpGameLobbyEventHandlers(websocketConnection);
setUpGameEventHandlers(websocketConnection);
setUpSavedCharacterEventListeners(websocketConnection);
