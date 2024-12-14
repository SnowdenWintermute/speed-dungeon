import { useGameStore } from "@/stores/game-store";
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
import characterDroppedItemHandler from "./character-dropped-item-handler";
import characterDroppedEquippedItemHandler from "./character-dropped-equipped-item-handler";
import characterUnequippedSlotHandler from "./character-unequipped-slot-handler";
import characterEquippedItemHandler from "./character-equipped-item-handler";
import characterSelectedCombatActionHandler from "./character-selected-combat-action-handler";
import characterCycledTargetsHandler from "./character-cycled-targets-handler";
import characterCycledTargetingSchemesHandler from "./character-cycled-targeting-schemes-handler";
import getCurrentParty from "@/utils/getCurrentParty";
import characterIncrementedAttributePointHandler from "./character-incremented-attribute-point-handler";
import gameProgressMessageHandler from "./game-progress-message-handler";
import characterPickedUpItemsHandler from "./character-picked-up-items-handler";

export default function setUpGameEventHandlers(
  socket: Socket<ServerToClientEventTypes, ClientToServerEventTypes>
) {
  socket.on(
    ServerToClientEvent.PlayerToggledReadyToDescendOrExplore,
    playerToggledReadyToDescendOrExploreHandler
  );
  socket.on(
    ServerToClientEvent.DungeonRoomTypesOnCurrentFloor,
    newDungeonRoomTypesOnCurrentFloorHandler
  );
  socket.on(ServerToClientEvent.DungeonRoomUpdate, newDungeonRoomHandler);
  socket.on(ServerToClientEvent.BattleFullUpdate, battleFullUpdateHandler);
  socket.on(ServerToClientEvent.CharacterDroppedItem, characterDroppedItemHandler);
  socket.on(ServerToClientEvent.CharacterDroppedEquippedItem, characterDroppedEquippedItemHandler);
  socket.on(ServerToClientEvent.CharacterUnequippedItem, characterUnequippedSlotHandler);
  socket.on(ServerToClientEvent.CharacterEquippedItem, characterEquippedItemHandler);
  socket.on(ServerToClientEvent.CharacterPickedUpItems, characterPickedUpItemsHandler);
  socket.on(
    ServerToClientEvent.CharacterSelectedCombatAction,
    characterSelectedCombatActionHandler
  );
  socket.on(ServerToClientEvent.CharacterCycledTargets, characterCycledTargetsHandler);
  socket.on(
    ServerToClientEvent.CharacterCycledTargetingSchemes,
    characterCycledTargetingSchemesHandler
  );
  socket.on(ServerToClientEvent.DungeonFloorNumber, (newFloorNumber) => {
    useGameStore.getState().mutateState((state) => {
      if (!state.username) return console.error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
      const partyOption = getCurrentParty(state, state.username);
      if (!partyOption) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);
      partyOption.currentFloor = newFloorNumber;
    });
  });
  socket.on(
    ServerToClientEvent.CharacterSpentAttributePoint,
    characterIncrementedAttributePointHandler
  );
  socket.on(ServerToClientEvent.GameMessage, gameProgressMessageHandler);
  console.log("game listeners set up");
}
