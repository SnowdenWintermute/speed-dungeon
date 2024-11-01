import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { LobbyState } from "@/stores/lobby-store";
import { MutateState } from "@/stores/mutate-state";
import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  ServerToClientEvent,
} from "@speed-dungeon/common";
import { Socket } from "socket.io-client";

export default function setUpBasicLobbyEventHandlers(
  socket: Socket<ServerToClientEventTypes, ClientToServerEventTypes>,
  mutateGameStore: MutateState<GameState>,
  mutateLobbyStore: MutateState<LobbyState>,
  mutateAlertStore: MutateState<AlertState>
) {
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
