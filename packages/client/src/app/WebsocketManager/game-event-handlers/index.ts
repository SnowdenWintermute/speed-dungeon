import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  ServerToClientEvent,
  ERROR_MESSAGES,
} from "@speed-dungeon/common";
import { Socket } from "socket.io-client";
import playerToggledReadyToDescendOrExploreHandler from "./player-toggled-ready-to-descend-or-explore-handler";
import newDungeonRoomTypesOnCurrentFloorHandler from "./new-dungeon-room-types-on-current-floor-handler";
import newDungeonRoomHandler from "./new-dungeon-room-handler";
import battleFullUpdateHandler from "./battle-full-update-handler";
import battleReportHandler from "./battle-report-handler";
import characterDroppedItemHandler from "./character-dropped-item-handler";
import characterDroppedEquippedItemHandler from "./character-dropped-equipped-item-handler";
import characterUnequippedSlotHandler from "./character-unequipped-slot-handler";
import characterEquippedItemHandler from "./character-equipped-item-handler";
import characterPickedUpItemHandler from "./character-picked-up-item-handler";
import characterSelectedCombatActionHandler from "./character-selected-combat-action-handler";
import characterCycledTargetsHandler from "./character-cycled-targets-handler";
import characterCycledTargetingSchemesHandler from "./character-cycled-targeting-schemes-handler";
import getCurrentParty from "@/utils/getCurrentParty";
import characterIncrementedAttributePointHandler from "./character-incremented-attribute-point-handler";
import gameProgressMessageHandler from "./game-progress-message-handler";

export default function setUpGameEventHandlers(
  socket: Socket<ServerToClientEventTypes, ClientToServerEventTypes>,
  mutateGameStore: MutateState<GameState>,
  mutateAlertStore: MutateState<AlertState>
) {
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
  socket.on(ServerToClientEvent.BattleReport, (report) => {
    battleReportHandler(socket, mutateGameStore, report);
  });
  socket.on(ServerToClientEvent.CharacterDroppedItem, (characterAndItem) => {
    characterDroppedItemHandler(socket, mutateGameStore, mutateAlertStore, characterAndItem);
  });
  socket.on(ServerToClientEvent.CharacterDroppedEquippedItem, (characterAndSlot) => {
    characterDroppedEquippedItemHandler(
      socket,
      mutateGameStore,
      mutateAlertStore,
      characterAndSlot
    );
  });
  socket.on(ServerToClientEvent.CharacterUnequippedItem, (characterAndSlot) => {
    characterUnequippedSlotHandler(mutateGameStore, mutateAlertStore, characterAndSlot);
  });
  socket.on(ServerToClientEvent.CharacterEquippedItem, (packet) => {
    characterEquippedItemHandler(mutateGameStore, mutateAlertStore, packet);
  });
  socket.on(ServerToClientEvent.CharacterPickedUpItem, (packet) => {
    characterPickedUpItemHandler(mutateGameStore, mutateAlertStore, packet);
  });
  socket.on(
    ServerToClientEvent.CharacterSelectedCombatAction,
    (characterId, combatActionOption) => {
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
    (characterId, direction, playerUsername) => {
      characterCycledTargetsHandler(
        mutateGameStore,
        mutateAlertStore,
        characterId,
        direction,
        playerUsername
      );
    }
  );
  socket.on(ServerToClientEvent.CharacterCycledTargetingSchemes, (characterId, playerUsername) => {
    characterCycledTargetingSchemesHandler(
      mutateGameStore,
      mutateAlertStore,
      characterId,
      playerUsername
    );
  });
  socket.on(ServerToClientEvent.DungeonFloorNumber, (newFloorNumber) => {
    mutateGameStore((state) => {
      if (!state.username) return console.error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
      const partyOption = getCurrentParty(state, state.username);
      if (!partyOption) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);
      partyOption.currentFloor = newFloorNumber;
    });
  });
  socket.on(ServerToClientEvent.CharacterSpentAttributePoint, (characterId, attribute) => {
    characterIncrementedAttributePointHandler(
      mutateGameStore,
      mutateAlertStore,
      characterId,
      attribute
    );
  });
  socket.on(ServerToClientEvent.GameMessage, (message) =>
    gameProgressMessageHandler(mutateGameStore, message)
  );
}
