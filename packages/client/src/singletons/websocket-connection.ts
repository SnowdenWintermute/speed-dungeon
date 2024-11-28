import { setAlert } from "@/app/components/alerts";
import { useGameStore } from "@/stores/game-store";
import { useLobbyStore } from "@/stores/lobby-store";
import getFocusedCharacter from "@/utils/getFocusedCharacter";
import {
  ClientToServerEvent,
  ClientToServerEventTypes,
  Item,
  ServerToClientEvent,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { Socket, io } from "socket.io-client";
import { enqueueClientActionCommands } from "./action-command-manager";
import setUpBasicLobbyEventHandlers from "@/app/WebsocketManager/basic-lobby-event-handlers";
import setUpGameLobbyEventHandlers from "@/app/WebsocketManager/lobby-event-handlers";
import setUpGameEventHandlers from "@/app/WebsocketManager/game-event-handlers";
import setUpSavedCharacterEventListeners from "@/app/WebsocketManager/saved-character-event-handlers";
import { gameWorld } from "@/app/3d-world/SceneManager";
import { spawnEquipmentModelsFromItemList } from "@/app/3d-world/game-world/spawn-test-equipment-models";

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
export const TEST_ITEMS: Item[] = [];
websocketConnection.on(ServerToClientEvent.TestItems, (items) => {
  console.log("got items: ", items);
  TEST_ITEMS.length = 0;
  TEST_ITEMS.push(...items);
  const currGameWorld = gameWorld.current;
  if (currGameWorld) spawnEquipmentModelsFromItemList(currGameWorld, TEST_ITEMS);
});

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

websocketConnection.on(ServerToClientEvent.ActionCommandPayloads, (entityId, payloads) => {
  const focusedCharacteResult = getFocusedCharacter();
  if (focusedCharacteResult instanceof Error) return console.trace(focusedCharacteResult);

  useGameStore.getState().mutateState((state) => {
    if (entityId === focusedCharacteResult.entityProperties.id) state.stackedMenuStates = [];
  });
  enqueueClientActionCommands(entityId, payloads);
});

setUpBasicLobbyEventHandlers(websocketConnection);
setUpGameLobbyEventHandlers(websocketConnection);
setUpGameEventHandlers(websocketConnection);
setUpSavedCharacterEventListeners(websocketConnection);

console.log("all listeners set up");
