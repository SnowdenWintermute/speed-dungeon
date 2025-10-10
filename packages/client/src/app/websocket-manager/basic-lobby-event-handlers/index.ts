import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";
import { getGameWorld } from "@/app/3d-world/SceneManager";
import { AppStore } from "@/mobx-stores/app-store";
import { useGameStore } from "@/stores/game-store";
import { useLobbyStore } from "@/stores/lobby-store";
import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  ServerToClientEvent,
} from "@speed-dungeon/common";
import { Socket } from "socket.io-client";

export function setUpBasicLobbyEventHandlers(
  socket: Socket<ServerToClientEventTypes, ClientToServerEventTypes>
) {
  const mutateGameStore = useGameStore.getState().mutateState;
  const mutateLobbyStore = useLobbyStore.getState().mutateState;
  const { lobbyStore } = AppStore.get();

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
  socket.on(ServerToClientEvent.ChannelFullUpdate, lobbyStore.updateChannel);
  socket.on(ServerToClientEvent.ClientUsername, (username) => {
    mutateGameStore((state) => {
      state.username = username;
    });
  });
  socket.on(ServerToClientEvent.UserJoinedChannel, lobbyStore.handleUserJoinedChannel);
  socket.on(ServerToClientEvent.UserLeftChannel, lobbyStore.handleUserLeftChannel);
  socket.on(ServerToClientEvent.GameList, (gameList) => {
    lobbyStore.gameList = gameList;
  });
}
