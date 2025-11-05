import { AppStore } from "@/mobx-stores/app-store";
import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  ServerToClientEvent,
} from "@speed-dungeon/common";
import { Socket } from "socket.io-client";

export function setUpBasicLobbyEventHandlers(
  socket: Socket<ServerToClientEventTypes, ClientToServerEventTypes>
) {
  const { lobbyStore, gameStore } = AppStore.get();

  socket.on(ServerToClientEvent.ChannelFullUpdate, lobbyStore.updateChannel);
  socket.on(ServerToClientEvent.ClientUsername, (username) => {
    gameStore.setUsername(username);
  });
  socket.on(ServerToClientEvent.UserJoinedChannel, lobbyStore.handleUserJoinedChannel);
  socket.on(ServerToClientEvent.UserLeftChannel, lobbyStore.handleUserLeftChannel);
  socket.on(ServerToClientEvent.GameList, (gameList) => {
    lobbyStore.setGameList(gameList);
  });
}
