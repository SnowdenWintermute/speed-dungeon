import { useLobbyStore } from "@/stores/lobby-store";
import { ClientToServerEvent, Item, ServerToClientEvent } from "@speed-dungeon/common";
import React, { useEffect } from "react";
import { setAlert } from "../components/alerts";
import { useGameStore } from "@/stores/game-store";
import { websocketConnection } from "@/singletons/websocket-connection";
import setUpSavedCharacterEventListeners from "./saved-character-event-handlers";
import setUpGameLobbyEventHandlers from "./lobby-event-handlers";
import setUpGameEventHandlers from "./game-event-handlers";
import { enqueueClientActionCommands } from "@/singletons/action-command-manager";
import setUpBasicLobbyEventHandlers from "./basic-lobby-event-handlers";
import getFocusedCharacter from "@/utils/getFocusedCharacter";
import { gameWorld } from "../3d-world/SceneManager";
import { spawnEquipmentModelsFromItemList } from "../3d-world/game-world/spawn-test-equipment-models";

export const TEST_ITEMS: Item[] = [];

export default function WebsocketManager() {
  const mutateLobbyStore = useLobbyStore().mutateState;
  const mutateGameStore = useGameStore().mutateState;

  useEffect(() => {
    websocketConnection.connect();
    return () => {
      websocketConnection.disconnect();
    };
  }, []);

  useEffect(() => {
    const socket = websocketConnection;

    socket.on(ServerToClientEvent.TestItems, (items) => {
      console.log("got items: ", items);
      TEST_ITEMS.length = 0;
      TEST_ITEMS.push(...items);
      const currGameWorld = gameWorld.current;
      if (currGameWorld) spawnEquipmentModelsFromItemList(currGameWorld, TEST_ITEMS);
    });

    socket.on("connect", () => {
      mutateGameStore((state) => {
        state.game = null;
      });
      mutateLobbyStore((state) => {
        state.websocketConnected = true;
      });
      socket.emit(ClientToServerEvent.RequestsGameList);
      socket.emit(ClientToServerEvent.GetSavedCharactersList);
    });

    socket.on("disconnect", () => {
      mutateLobbyStore((state) => {
        state.websocketConnected = false;
      });
    });
    socket.on(ServerToClientEvent.ErrorMessage, (message) => {
      setAlert(message);
    });

    socket.on(ServerToClientEvent.ActionCommandPayloads, (entityId, payloads) => {
      const focusedCharacteResult = getFocusedCharacter();
      if (focusedCharacteResult instanceof Error) return console.trace(focusedCharacteResult);

      mutateGameStore((state) => {
        if (entityId === focusedCharacteResult.entityProperties.id) state.stackedMenuStates = [];
      });
      enqueueClientActionCommands(entityId, payloads);
    });

    setUpBasicLobbyEventHandlers(socket);
    setUpGameLobbyEventHandlers(socket);
    setUpGameEventHandlers(socket);
    setUpSavedCharacterEventListeners(socket);

    return () => {
      websocketConnection.off("connect");

      Object.values(ServerToClientEvent).forEach((value) => {
        websocketConnection.off(value);
      });
    };
  }, []);

  return <div id="websocket-manager" />;
}
