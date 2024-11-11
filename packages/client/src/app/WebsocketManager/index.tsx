import { useLobbyStore } from "@/stores/lobby-store";
import { ClientToServerEvent, ServerToClientEvent } from "@speed-dungeon/common";
import React, { useEffect } from "react";
import { useAlertStore } from "@/stores/alert-store";
import { setAlert } from "../components/alerts";
import { useGameStore } from "@/stores/game-store";
import { websocketConnection } from "@/singletons/websocket-connection";
import setUpSavedCharacterEventListeners from "./saved-character-event-handlers";
import setUpGameLobbyEventHandlers from "./lobby-event-handlers";
import setUpGameEventHandlers from "./game-event-handlers";
import { enqueueClientActionCommand } from "@/singletons/action-command-manager";
import setUpBasicLobbyEventHandlers from "./basic-lobby-event-handlers";

function SocketManager() {
  const mutateLobbyStore = useLobbyStore().mutateState;
  const mutateGameStore = useGameStore().mutateState;
  const gameName = useGameStore().gameName;
  const mutateAlertStore = useAlertStore().mutateState;
  const socketOption = websocketConnection;

  useEffect(() => {
    socketOption.connect();
    return () => {
      socketOption.disconnect();
    };
  }, []);

  useEffect(() => {
    const socket = socketOption;

    socket.emit(ClientToServerEvent.RequestsGameList);

    socket.on("connect", () => {
      mutateGameStore((state) => {
        state.game = null;
      });
      mutateLobbyStore((state) => {
        state.websocketConnected = true;
      });
    });

    socket.on("disconnect", () => {
      mutateLobbyStore((state) => {
        state.websocketConnected = false;
      });
    });
    socket.on(ServerToClientEvent.ErrorMessage, (message) => {
      setAlert(mutateAlertStore, message);
    });

    socket.on(ServerToClientEvent.ActionCommandPayloads, (entityId, payloads) => {
      enqueueClientActionCommand(mutateGameStore, mutateAlertStore, entityId, payloads);
    });

    setUpBasicLobbyEventHandlers(socket, mutateGameStore, mutateLobbyStore, mutateAlertStore);
    setUpGameLobbyEventHandlers(socket, mutateGameStore, mutateAlertStore);
    setUpGameEventHandlers(socket, mutateGameStore, mutateAlertStore);
    setUpSavedCharacterEventListeners(socket, mutateLobbyStore);

    return () => {
      Object.values(ServerToClientEvent).forEach((value) => {
        socketOption.off(value);
      });
    };
  }, [socketOption, gameName]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div id="websocket-manager"></div>;
}

export default SocketManager;
