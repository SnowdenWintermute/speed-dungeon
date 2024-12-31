"use client";
import { setAlert } from "@/app/components/alerts";
import { useGameStore } from "@/stores/game-store";
import { useLobbyStore } from "@/stores/lobby-store";
import {
  ClientToServerEvent,
  ClientToServerEventTypes,
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

// TESTING
// export const TEST_ITEMS: Item[] = [];
// websocketConnection.on(ServerToClientEvent.TestItems, (items) => {
//   console.log("got items: ", items);
//   TEST_ITEMS.length = 0;
//   TEST_ITEMS.push(...items);
//   const currGameWorld = gameWorld.current;
//   if (currGameWorld) spawnEquipmentModelsFromItemList(currGameWorld, TEST_ITEMS);
// });

websocketConnection.on("connect", () => {
  console.log("connected");
  useGameStore.getState().mutateState((state) => {
    state.game = null;
  });
  useLobbyStore.getState().mutateState((state) => {
    state.websocketConnected = true;
  });
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
  setAlert(message);
});

websocketConnection.on(ServerToClientEvent.ActionCommandPayloads, (payloads) => {
  if (!gameWorld.current)
    return console.error("Got action command payloads but no game world was found");

  console.log("enqueing message to process action commands: ", payloads);
  gameWorld.current.modelManager.modelActionQueue.enqueueMessage({
    type: ModelActionType.ProcessActionCommands,
    actionCommandPayloads: payloads,
  });
});

setUpBasicLobbyEventHandlers(websocketConnection);
setUpGameLobbyEventHandlers(websocketConnection);
setUpGameEventHandlers(websocketConnection);
setUpSavedCharacterEventListeners(websocketConnection);
