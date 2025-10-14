import { AppStore } from "@/mobx-stores/app-store";
import { useGameStore } from "@/stores/game-store";
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
  const { lobbyStore } = AppStore.get();

  socket.on(ServerToClientEvent.ChannelFullUpdate, lobbyStore.updateChannel);
  socket.on(ServerToClientEvent.ClientUsername, (username) => {
    mutateGameStore((state) => {
      state.username = username;
    });
  });
  socket.on(ServerToClientEvent.UserJoinedChannel, lobbyStore.handleUserJoinedChannel);
  socket.on(ServerToClientEvent.UserLeftChannel, lobbyStore.handleUserLeftChannel);
  socket.on(ServerToClientEvent.GameList, (gameList) => {
    lobbyStore.setGameList(gameList);
  });
}
