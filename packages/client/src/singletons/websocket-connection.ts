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
import setUpBasicLobbyEventHandlers from "@/app/WebsocketManager/basic-lobby-event-handlers";
import setUpGameLobbyEventHandlers from "@/app/WebsocketManager/lobby-event-handlers";
import setUpGameEventHandlers from "@/app/WebsocketManager/game-event-handlers";
import setUpSavedCharacterEventListeners from "@/app/WebsocketManager/saved-character-event-handlers";
import { gameWorld } from "@/app/3d-world/SceneManager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";
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

websocketConnection.on(ServerToClientEvent.ActionCommandPayloads, (payloads) => {
  if (!gameWorld.current)
    return console.error("Got action command payloads but no game world was found");

  gameWorld.current.modelManager.modelActionQueue.enqueueMessage({
    type: ModelActionType.ProcessActionCommands,
    actionCommandPayloads: payloads,
  });
});

setUpBasicLobbyEventHandlers(websocketConnection);
setUpGameLobbyEventHandlers(websocketConnection);
setUpGameEventHandlers(websocketConnection);
setUpSavedCharacterEventListeners(websocketConnection);
