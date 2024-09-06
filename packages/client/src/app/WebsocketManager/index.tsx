import { useLobbyStore } from "@/stores/lobby-store";
import { useWebsocketStore } from "@/stores/websocket-store";
import {
  ActionCommand,
  AdventuringParty,
  CharacterAndItem,
  CharacterAndSlot,
  ClientToServerEvent,
  CombatAction,
  ERROR_MESSAGES,
  EquipItemPacket,
  NextOrPrevious,
  ServerToClientEvent,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
} from "@speed-dungeon/common";
import React, { use, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import characterCreationHandler from "./lobby-event-handlers/character-creation-handler";
import characterDeletionHandler from "./lobby-event-handlers/character-deletion-handler";
import { useAlertStore } from "@/stores/alert-store";
import { setAlert } from "../components/alerts";
import playerToggledReadyToStartGameHandler from "./lobby-event-handlers/player-toggled-ready-to-start-game-handler";
import { useGameStore } from "@/stores/game-store";
import playerToggledReadyToDescendOrExploreHandler from "./game-event-handlers/player-toggled-ready-to-descend-or-explore-handler";
import newDungeonRoomTypesOnCurrentFloorHandler from "./game-event-handlers/new-dungeon-room-types-on-current-floor-handler";
import newDungeonRoomHandler from "./game-event-handlers/new-dungeon-room-handler";
import battleFullUpdateHandler from "./game-event-handlers/battle-full-update-handler";
import battleReportHandler from "./game-event-handlers/battle-report-handler";
import gameMessageHandler from "./game-event-handlers/game-message-handler";
import characterDroppedItemHandler from "./game-event-handlers/character-dropped-item-handler";
import characterDroppedEquippedItemHandler from "./game-event-handlers/character-dropped-equipped-item-handler";
import characterUnequippedSlotHandler from "./game-event-handlers/character-unequipped-slot-handler";
import characterEquippedItemHandler from "./game-event-handlers/character-equipped-item-handler";
import characterPickedUpItemHandler from "./game-event-handlers/character-picked-up-item-handler";
import gameStartedHandler from "./game-event-handlers/game-started-handler";
import { useNextBabylonMessagingStore } from "@/stores/next-babylon-messaging-store";
import characterCycledTargetsHandler from "./game-event-handlers/character-cycled-targets-handler";
import characterSelectedCombatActionHandler from "./game-event-handlers/character-selected-combat-action-handler";
import characterCycledTargetingSchemesHandler from "./game-event-handlers/character-cycled-targeting-schemes-handler";
import playerLeftGameHandler from "./player-left-game-handler";
import { ClientActionCommandReceiver } from "../client-action-command-receiver";
import getCurrentParty from "@/utils/getCurrentParty";

// const socketAddress = process.env.NODE_ENV === "production" ? SOCKET_ADDRESS_PRODUCTION : process.env.NEXT_PUBLIC_SOCKET_API;
const socketAddress = "http://localhost:8080";

function SocketManager() {
  const mutateWebsocketStore = useWebsocketStore().mutateState;
  const mutateLobbyStore = useLobbyStore().mutateState;
  const mutateGameStore = useGameStore().mutateState;
  const mutateAlertStore = useAlertStore().mutateState;
  const mutateNextBabylonMessagingStore = useNextBabylonMessagingStore().mutateState;
  const socketOption = useWebsocketStore().socketOption;

  const actionCommandReceiverRef = useRef<null | ClientActionCommandReceiver>();

  // useEffect(() => {
  //   actionCommandReceiverRef.current = new ClientActionCommandReceiver(
  //     mutateGameStore,
  //     mutateAlertStore,
  //     mutateNextBabylonMessagingStore
  //   );
  //   return () => {
  //     actionCommandReceiverRef.current = null;
  //   };
  // }, []);

  useEffect(() => {
    actionCommandReceiverRef.current?.mutateGameState((state) => {
      state.testText += JSON.stringify("a" + Math.random().toFixed(2));
    });
  }, []);

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

    actionCommandReceiverRef.current = new ClientActionCommandReceiver(
      mutateGameStore,
      mutateAlertStore,
      mutateNextBabylonMessagingStore
    );

    socket.emit(ClientToServerEvent.RequestsGameList);

    socket.on("connect", () => {
      mutateGameStore((state) => {
        state.game = null;
      });
    });

    socket.on(ServerToClientEvent.ActionCommandPayloads, (entityId, payloads) => {
      mutateGameStore((gameState) => {
        const game = gameState.game;
        if (game === null) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
        if (!gameState.username) return console.error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
        const partyOption = getCurrentParty(gameState, gameState.username);
        if (partyOption === undefined)
          return setAlert(mutateAlertStore, ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);
        const party = partyOption;
        if (actionCommandReceiverRef.current === undefined)
          return setAlert(mutateAlertStore, "No action command receiver exists");

        const actionCommands = payloads.map(
          (payload) =>
            new ActionCommand(game.name, entityId, payload, actionCommandReceiverRef.current!)
        );

        if (gameState.combatantModelsAwaitingSpawn.length === 0)
          party.actionCommandManager.enqueueNewCommands(actionCommands);
        else gameState.actionCommandWaitingArea.push(...actionCommands);
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
      playerLeftGameHandler(mutateGameStore, username);
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

        // ignore if game already started. this is a relic of the fact we remove them
        // from their party when leaving a lobby game, but it is an unhandled crash
        // to remove them from a party when still in a game
        if (!state.game.timeStarted) {
          SpeedDungeonGame.removePlayerFromParty(state.game, username);
          if (partyName === null) return;
          SpeedDungeonGame.putPlayerInParty(state.game, partyName, username);
        }
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
      gameStartedHandler(mutateGameStore, mutateNextBabylonMessagingStore, timeStarted);
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
      battleFullUpdateHandler(mutateGameStore, mutateAlertStore, battleOption);
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
    socket.on(
      ServerToClientEvent.CharacterDroppedEquippedItem,
      (characterAndSlot: CharacterAndSlot) => {
        characterDroppedEquippedItemHandler(
          socket,
          mutateGameStore,
          mutateAlertStore,
          characterAndSlot
        );
      }
    );
    socket.on(ServerToClientEvent.CharacterUnequippedItem, (characterAndSlot: CharacterAndSlot) => {
      characterUnequippedSlotHandler(mutateGameStore, mutateAlertStore, characterAndSlot);
    });
    socket.on(ServerToClientEvent.CharacterEquippedItem, (packet: EquipItemPacket) => {
      characterEquippedItemHandler(mutateGameStore, mutateAlertStore, packet);
    });
    socket.on(ServerToClientEvent.CharacterPickedUpItem, (packet: CharacterAndItem) => {
      characterPickedUpItemHandler(mutateGameStore, mutateAlertStore, packet);
    });
    socket.on(
      ServerToClientEvent.CharacterSelectedCombatAction,
      (characterId: string, combatActionOption: null | CombatAction) => {
        characterSelectedCombatActionHandler(
          mutateGameStore,
          mutateAlertStore,
          characterId,
          combatActionOption
        );
      }
    );
    socket.on(
      ServerToClientEvent.CharacterCycledTargets,
      (characterId: string, direction: NextOrPrevious, playerUsername: string) => {
        characterCycledTargetsHandler(
          mutateGameStore,
          mutateAlertStore,
          characterId,
          direction,
          playerUsername
        );
      }
    );
    socket.on(
      ServerToClientEvent.CharacterCycledTargetingSchemes,
      (characterId: string, playerUsername: string) => {
        characterCycledTargetingSchemesHandler(
          mutateGameStore,
          mutateAlertStore,
          characterId,
          playerUsername
        );
      }
    );

    return () => {
      actionCommandReceiverRef.current = null;

      if (socketOption) {
        Object.values(ServerToClientEvent).forEach((value) => {
          socketOption.off(value);
        });
      }
    };
  }, [socketOption]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div id="websocket-manager"></div>;
}

export default SocketManager;
