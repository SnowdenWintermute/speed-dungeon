import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";
import { getGameWorld } from "@/app/3d-world/SceneManager";
import { useGameStore } from "@/stores/game-store";
import { useLobbyStore } from "@/stores/lobby-store";
import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  ServerToClientEvent,
} from "@speed-dungeon/common";
import { Socket } from "socket.io-client";

export default function setUpBasicLobbyEventHandlers(
  socket: Socket<ServerToClientEventTypes, ClientToServerEventTypes>
) {
  const mutateGameStore = useGameStore.getState().mutateState;
  const mutateLobbyStore = useLobbyStore.getState().mutateState;

  socket.on("connect", () => {
    mutateGameStore((state) => {
      state.game = null;
    });
    mutateLobbyStore((state) => {
      state.websocketConnected = true;
    });

    getGameWorld().modelManager.modelActionQueue.clear();
    getGameWorld().modelManager.modelActionQueue.enqueueMessage({
      type: ModelActionType.ClearAllModels,
    });
    getGameWorld().replayTreeManager.clear();
  });

  socket.on("disconnect", () => {
    mutateLobbyStore((state) => {
      state.websocketConnected = false;
    });
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
}
