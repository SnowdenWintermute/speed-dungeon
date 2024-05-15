import { useGameStore } from "@/stores/game-store";
import { useLobbyStore } from "@/stores/lobby-store";
import { useWebsocketStore } from "@/stores/websocket-store";
import {
  AdventuringParty,
  ClientToServerEvent,
  ServerToClientEvent,
  SocketNamespaces,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
} from "@speed-dungeon/common";
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

// const socketAddress = process.env.NODE_ENV === "production" ? SOCKET_ADDRESS_PRODUCTION : process.env.NEXT_PUBLIC_SOCKET_API;
const socketAddress = "http://localhost:8080";

function SocketManager() {
  const mutateWebsocketStore = useWebsocketStore().mutateState;
  const mutateLobbyStore = useLobbyStore().mutateState;
  const mutateGameStore = useGameStore().mutateState;
  const mainSocketOption = useWebsocketStore().mainSocketOption;
  const [connected, setConnected] = useState(false);

  // setup socket
  useEffect(() => {
    mutateWebsocketStore((state) => {
      state.mainSocketOption = io(socketAddress || "", {
        transports: ["websocket"],
      });
      state.partySocketOption = io(`${socketAddress}${SocketNamespaces.Party}` || "", {
        transports: ["websocket"],
      });
    });
    console.log("socket address: ", socketAddress);
    return () => {
      mutateWebsocketStore((state) => {
        state.mainSocketOption?.disconnect();
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    console.log("setting up listeners");
    if (mainSocketOption) {
      mainSocketOption.emit(ClientToServerEvent.RequestsGameList);

      mainSocketOption.on("connect", () => {
        mutateGameStore((state) => {
          state.game = null;
        });
      });
      mainSocketOption.on(
        ServerToClientEvent.ChannelFullUpdate,
        (channelName, usernamesInChannel) => {
          mutateWebsocketStore((state) => {
            state.mainChannelName = channelName;
            state.usernamesInMainChannel = new Set();
            usernamesInChannel.forEach((username) => {
              console.log(username);
              state.usernamesInMainChannel.add(username);
            });
          });
        }
      );
      mainSocketOption.on(ServerToClientEvent.UserJoinedChannel, (username) => {
        mutateWebsocketStore((state) => {
          console.log("user joined ", username);
          state.usernamesInMainChannel.add(username);
        });
      });
      mainSocketOption.on(ServerToClientEvent.UserLeftChannel, (username) => {
        mutateWebsocketStore((state) => {
          console.log("user left ", username);
          state.usernamesInMainChannel.delete(username);
        });
      });
      mainSocketOption.on(ServerToClientEvent.GameList, (gameList) => {
        mutateLobbyStore((state) => {
          state.gameList = gameList;
        });
      });
      mainSocketOption.on(ServerToClientEvent.GameFullUpdate, (game) => {
        mutateGameStore((state) => {
          if (game === null) state.game = null;
          else {
            state.game = new SpeedDungeonGame(game.name);
            state.game.applyFullUpdate(game);
          }
        });
      });
      mainSocketOption.on(ServerToClientEvent.PlayerJoinedGame, (username) => {
        mutateGameStore((state) => {
          if (state.game) state.game.players[username] = new SpeedDungeonPlayer(username);
        });
      });
      mainSocketOption.on(ServerToClientEvent.PlayerLeftGame, (username) => {
        mutateGameStore((state) => {
          state.game?.removePlayer(username);
        });
      });
      mainSocketOption.on(ServerToClientEvent.PartyCreated, (partyName) => {
        mutateGameStore((state) => {
          if (state.game) {
            console.log("updating party list to include ", partyName);
            state.game.adventuringParties[partyName] = new AdventuringParty(partyName);
            console.log(state.game.adventuringParties);
          }
        });
      });
    }

    return () => {
      if (mainSocketOption) {
        Object.values(ServerToClientEvent).forEach((value) => {
          mainSocketOption.off(value);
        });
      }
    };
  }, [mainSocketOption, connected]); // eslint-disable-line react-hooks/exhaustive-deps

  return <></>;
}

export default SocketManager;
