import { useLobbyStore } from "@/stores/lobby-store";
import {
  ActionCommand,
  ClientToServerEvent,
  ERROR_MESSAGES,
  ServerToClientEvent,
} from "@speed-dungeon/common";
import React, { useEffect } from "react";
import { useAlertStore } from "@/stores/alert-store";
import { setAlert } from "../components/alerts";
import { useGameStore } from "@/stores/game-store";
import { websocketConnection } from "@/singletons/websocket-connection";
import setUpSavedCharacterEventListeners from "./saved-character-event-handlers";
import setUpGameLobbyEventHandlers from "./lobby-event-handlers";
import setUpGameEventHandlers from "./game-event-handlers";
import {
  actionCommandManager,
  actionCommandReceiver,
  actionCommandWaitingArea,
  enqueueClientActionCommand,
} from "@/singletons/action-command-manager";

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

    socket.on(ServerToClientEvent.ActionCommandPayloads, (entityId, payloads) => {
      enqueueClientActionCommand(mutateGameStore, mutateAlertStore, entityId, payloads);
    });

    socket.on(ServerToClientEvent.ErrorMessage, (message) => {
      setAlert(mutateAlertStore, message);
    });
    socket.on(ServerToClientEvent.ChannelFullUpdate, (channelName, usersInChannel) => {
      mutateLobbyStore((state) => {
        state.mainChannelName = channelName;
        state.usersInMainChannel = {};
        usersInChannel.forEach(({ username, userChannelDisplayData }) => {
          state.usersInMainChannel[username] = userChannelDisplayData;
        });
      });
    });
    socket.on(ServerToClientEvent.ClientUsername, (username) => {
      mutateGameStore((state) => {
        state.username = username;
      });
    });
    socket.on(ServerToClientEvent.UserJoinedChannel, (username, userChannelDisplayData) => {
      mutateLobbyStore((state) => {
        state.usersInMainChannel[username] = userChannelDisplayData;
      });
    });
    socket.on(ServerToClientEvent.UserLeftChannel, (username) => {
      mutateLobbyStore((state) => {
        delete state.usersInMainChannel[username];
      });
    });
    socket.on(ServerToClientEvent.GameList, (gameList) => {
      mutateLobbyStore((state) => {
        state.gameList = gameList;
      });
    });

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
