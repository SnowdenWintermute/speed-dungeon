import { useLobbyStore } from "@/stores/lobby-store";
import { useWebsocketStore } from "@/stores/websocket-store";
import {
  AdventuringParty,
  ClientToServerEvent,
  ServerToClientEvent,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
} from "@speed-dungeon/common";
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import characterCreationHandler from "./lobby-event-handlers/character-creation-handler";
import characterDeletionHandler from "./lobby-event-handlers/character-deletion-handler";
import { useAlertStore } from "@/stores/alert-store";
import { setAlert } from "../components/alerts";
import playerToggledReadyToStartGameHandler from "./lobby-event-handlers/player-toggled-ready-to-start-game-handler";
import { useGameStore } from "@/stores/game-store";

// const socketAddress = process.env.NODE_ENV === "production" ? SOCKET_ADDRESS_PRODUCTION : process.env.NEXT_PUBLIC_SOCKET_API;
const socketAddress = "http://localhost:8080";

function SocketManager() {
  const mutateWebsocketStore = useWebsocketStore().mutateState;
  const mutateLobbyStore = useLobbyStore().mutateState;
  const mutateGameStore = useGameStore().mutateState;
  const mutateAlertStore = useAlertStore().mutateState;
  const socketOption = useWebsocketStore().socketOption;
  const [connected, setConnected] = useState(false);

  // setup socket
  useEffect(() => {
    mutateWebsocketStore((state) => {
      state.socketOption = io(socketAddress || "", {
        transports: ["websocket"],
      });
    });
    // console.log("socket address: ", socketAddress);
    return () => {
      mutateWebsocketStore((state) => {
        state.socketOption?.disconnect();
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (socketOption) {
      socketOption.emit(ClientToServerEvent.RequestsGameList);

      socketOption.on("connect", () => {
        mutateGameStore((state) => {
          state.game = null;
        });
      });
      socketOption.on(ServerToClientEvent.ErrorMessage, (message) => {
        setAlert(mutateAlertStore, message);
      });
      socketOption.on(
        ServerToClientEvent.ChannelFullUpdate,
        (channelName, usernamesInChannel) => {
          mutateWebsocketStore((state) => {
            state.mainChannelName = channelName;
            state.usernamesInMainChannel = new Set();
            usernamesInChannel.forEach((username) => {
              state.usernamesInMainChannel.add(username);
            });
          });
        }
      );
      socketOption.on(ServerToClientEvent.ClientUsername, (username) => {
        mutateGameStore((state) => {
          state.username = username;
        });
      });
      socketOption.on(ServerToClientEvent.UserJoinedChannel, (username) => {
        mutateWebsocketStore((state) => {
          state.usernamesInMainChannel.add(username);
        });
      });
      socketOption.on(ServerToClientEvent.UserLeftChannel, (username) => {
        mutateWebsocketStore((state) => {
          state.usernamesInMainChannel.delete(username);
        });
      });
      socketOption.on(ServerToClientEvent.GameList, (gameList) => {
        mutateLobbyStore((state) => {
          state.gameList = gameList;
        });
      });
      socketOption.on(ServerToClientEvent.GameFullUpdate, (game) => {
        mutateGameStore((state) => {
          if (game === null) state.game = null;
          else {
            state.game = game;
          }
        });
      });
      socketOption.on(ServerToClientEvent.PlayerJoinedGame, (username) => {
        mutateGameStore((state) => {
          if (state.game) state.game.players[username] = new SpeedDungeonPlayer(username);
        });
      });
      socketOption.on(ServerToClientEvent.PlayerLeftGame, (username) => {
        mutateGameStore((state) => {
          if (state.game) SpeedDungeonGame.removePlayer(state.game, username);
        });
      });
      socketOption.on(ServerToClientEvent.PartyCreated, (partyName) => {
        mutateGameStore((state) => {
          if (state.game) {
            state.game.adventuringParties[partyName] = new AdventuringParty(partyName);
          }
        });
      });
      socketOption.on(
        ServerToClientEvent.PlayerChangedAdventuringParty,
        (username, partyName) => {
          mutateGameStore((state) => {
            if (!state.game) return;
            SpeedDungeonGame.removePlayerFromParty(state.game, username);
            if (partyName === null) return;
            SpeedDungeonGame.putPlayerInParty(state.game, partyName, username);
          });
        }
      );
      socketOption.on(
        ServerToClientEvent.CharacterCreated,
        (partyName, username, character) => {
          characterCreationHandler(
            mutateGameStore,
            mutateAlertStore,
            partyName,
            username,
            character
          );
        }
      );
      socketOption.on(
        ServerToClientEvent.CharacterDeleted,
        (partyName, username, characterId) => {
          characterDeletionHandler(
            mutateGameStore,
            mutateAlertStore,
            partyName,
            username,
            characterId
          );
        }
      );
      socketOption.on(ServerToClientEvent.PlayerToggledReadyToStartGame, (username) => {
        playerToggledReadyToStartGameHandler(mutateGameStore, mutateAlertStore, username);
      });
      socketOption.on(ServerToClientEvent.GameStarted, (timeStarted) => {
        mutateGameStore((gameState) => {
          if (gameState.game) gameState.game.timeStarted = timeStarted;
        });
      });
    }

    return () => {
      if (socketOption) {
        Object.values(ServerToClientEvent).forEach((value) => {
          socketOption.off(value);
        });
      }
    };
  }, [socketOption, connected]); // eslint-disable-line react-hooks/exhaustive-deps

  return <></>;
}

export default SocketManager;
