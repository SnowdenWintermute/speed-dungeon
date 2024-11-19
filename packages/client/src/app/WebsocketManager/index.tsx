import { useLobbyStore } from "@/stores/lobby-store";
import { ClientToServerEvent, ServerToClientEvent } from "@speed-dungeon/common";
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

function SocketManager() {
  const mutateLobbyStore = useLobbyStore().mutateState;
  const mutateGameStore = useGameStore().mutateState;
  const gameName = useGameStore().gameName;
  const socketOption = websocketConnection;

  useEffect(() => {
    socketOption.connect();
    return () => {
      socketOption.disconnect();
    };
  }, []);

  useEffect(() => {
    const socket = socketOption;

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
      Object.values(ServerToClientEvent).forEach((value) => {
        socketOption.off(value);
      });
    };
  }, [socketOption, gameName]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div id="websocket-manager"></div>;
}

export default SocketManager;
