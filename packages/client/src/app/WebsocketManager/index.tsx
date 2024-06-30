import { useLobbyStore } from "@/stores/lobby-store";
import { useWebsocketStore } from "@/stores/websocket-store";
import {
  AdventuringParty,
  CharacterAndItem,
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
import playerToggledReadyHandler from "./game-event-handlers/player-toggled-ready-handler";
import playerToggledReadyToDescendOrExploreHandler from "./game-event-handlers/player-toggled-ready-to-descend-or-explore-handler";
import newDungeonRoomTypesOnCurrentFloorHandler from "./game-event-handlers/new-dungeon-room-types-on-current-floor-handler";
import newDungeonRoomHandler from "./game-event-handlers/new-dungeon-room-handler";
import battleFullUpdateHandler from "./game-event-handlers/battle-full-update-handler";
import battleReportHandler from "./game-event-handlers/battle-report-handler";
import gameMessageHandler from "./game-event-handlers/game-message-handler";
import characterDroppedItemHandler from "./game-event-handlers/character-dropped-item-handler";

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
    if (!socketOption) return;
    const socket = socketOption;

    socket.emit(ClientToServerEvent.RequestsGameList);

    socket.on("connect", () => {
      mutateGameStore((state) => {
        state.game = null;
      });
    });
    socket.on(ServerToClientEvent.ErrorMessage, (message) => {
      setAlert(mutateAlertStore, message);
    });
    socket.on(ServerToClientEvent.ChannelFullUpdate, (channelName, usernamesInChannel) => {
      mutateWebsocketStore((state) => {
        state.mainChannelName = channelName;
        state.usernamesInMainChannel = new Set();
        usernamesInChannel.forEach((username) => {
          state.usernamesInMainChannel.add(username);
        });
      });
    });
    socket.on(ServerToClientEvent.ClientUsername, (username) => {
      mutateGameStore((state) => {
        state.username = username;
      });
    });
    socket.on(ServerToClientEvent.UserJoinedChannel, (username) => {
      mutateWebsocketStore((state) => {
        state.usernamesInMainChannel.add(username);
      });
    });
    socket.on(ServerToClientEvent.UserLeftChannel, (username) => {
      mutateWebsocketStore((state) => {
        state.usernamesInMainChannel.delete(username);
      });
    });
    socket.on(ServerToClientEvent.GameList, (gameList) => {
      mutateLobbyStore((state) => {
        state.gameList = gameList;
      });
    });
    socket.on(ServerToClientEvent.GameFullUpdate, (game) => {
      mutateGameStore((state) => {
        if (game === null) state.game = null;
        else {
          state.game = game;
        }
      });
    });
    socket.on(ServerToClientEvent.PlayerJoinedGame, (username) => {
      mutateGameStore((state) => {
        if (state.game) state.game.players[username] = new SpeedDungeonPlayer(username);
      });
    });
    socket.on(ServerToClientEvent.PlayerLeftGame, (username) => {
      mutateGameStore((state) => {
        if (state.game) SpeedDungeonGame.removePlayer(state.game, username);
      });
    });
    socket.on(ServerToClientEvent.PartyCreated, (partyName) => {
      mutateGameStore((state) => {
        if (state.game) {
          state.game.adventuringParties[partyName] = new AdventuringParty(partyName);
        }
      });
    });
    socket.on(ServerToClientEvent.PlayerChangedAdventuringParty, (username, partyName) => {
      mutateGameStore((state) => {
        if (!state.game) return;
        SpeedDungeonGame.removePlayerFromParty(state.game, username);
        if (partyName === null) return;
        SpeedDungeonGame.putPlayerInParty(state.game, partyName, username);
      });
    });
    socket.on(ServerToClientEvent.CharacterCreated, (partyName, username, character) => {
      characterCreationHandler(mutateGameStore, mutateAlertStore, partyName, username, character);
    });
    socket.on(ServerToClientEvent.CharacterDeleted, (partyName, username, characterId) => {
      characterDeletionHandler(mutateGameStore, mutateAlertStore, partyName, username, characterId);
    });
    socket.on(ServerToClientEvent.PlayerToggledReadyToStartGame, (username) => {
      playerToggledReadyToStartGameHandler(mutateGameStore, mutateAlertStore, username);
    });
    socket.on(ServerToClientEvent.GameStarted, (timeStarted) => {
      mutateGameStore((gameState) => {
        if (gameState.game) gameState.game.timeStarted = timeStarted;
      });
    });
    socket.on(
      ServerToClientEvent.PlayerToggledReadyToDescendOrExplore,
      (username, descendOrExplore) => {
        playerToggledReadyToDescendOrExploreHandler(
          mutateGameStore,
          mutateAlertStore,
          username,
          descendOrExplore
        );
      }
    );
    socket.on(ServerToClientEvent.DungeonRoomTypesOnCurrentFloor, (newRoomTypes) => {
      newDungeonRoomTypesOnCurrentFloorHandler(mutateGameStore, mutateAlertStore, newRoomTypes);
    });
    socket.on(ServerToClientEvent.DungeonRoomUpdate, (newRoom) => {
      newDungeonRoomHandler(mutateGameStore, mutateAlertStore, newRoom);
    });
    socket.on(ServerToClientEvent.BattleFullUpdate, (battleOption) => {
      console.log("battle full update");
      battleFullUpdateHandler(mutateGameStore, mutateAlertStore, battleOption);
    });
    socket.on(ServerToClientEvent.TurnResults, () => {
      //todo
    });
    socket.on(ServerToClientEvent.GameMessage, (message) => {
      gameMessageHandler(mutateGameStore, message);
    });
    socket.on(ServerToClientEvent.BattleReport, (report) => {
      battleReportHandler(socket, mutateGameStore, report);
    });
    socket.on(ServerToClientEvent.CharacterDroppedItem, (characterAndItem: CharacterAndItem) => {
      characterDroppedItemHandler(socket, mutateGameStore, mutateAlertStore, characterAndItem);
    });

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
