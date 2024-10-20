import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  ClientToServerEvent,
} from "@speed-dungeon/common";
import SocketIO from "socket.io";
import { GameServer } from "../index.js";
import { applyMiddlewares } from "../event-middleware/index.js";
import toggleReadyToExploreHandler from "./toggle-ready-to-explore-handler.js";
import { getPlayerAssociatedData } from "../event-middleware/get-player-associated-data.js";
import toggleReadyToDescendHandler from "./toggle-ready-to-descend-handler.js";
import { getCharacterAssociatedData } from "../event-middleware/get-character-associated-data.js";
import { prohibitIfDead } from "../event-middleware/prohibit-if-dead.js";
import dropItemHandler from "./drop-item-handler.js";
import dropEquippedItemHandler from "./drop-equipped-item-handler.js";
import unequipSlotHandler from "./unequip-slot-handler.js";
import equipItemHandler from "./equip-item-handler.js";
import pickUpItemHandler from "./pick-up-item-handler.js";
import acknowledgeReceiptOfItemOnGroundHandler from "./acknowledge_receipt_of_item_on_ground_handler.js";
import selectCombatActionHandler from "./select-combat-action-handler.js";
import cycleTargetsHandler from "./cycle-targets-handler.js";
import cycleTargetingSchemesHandler from "./cycle-targeting-schemes-handler.js";
import useSelectedCombatActionHandler from "./character-uses-selected-combat-action-handler/index.js";
import characterSpentAttributePointHandler from "./character-spent-attribute-point-handler.js";

export default function initiateGameEventListeners(
  this: GameServer,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  socket.on(
    ClientToServerEvent.ToggleReadyToExplore,
    applyMiddlewares(getPlayerAssociatedData)(socket, toggleReadyToExploreHandler)
  );
  socket.on(
    ClientToServerEvent.ToggleReadyToDescend,
    applyMiddlewares(getPlayerAssociatedData)(socket, toggleReadyToDescendHandler)
  );
  socket.on(
    ClientToServerEvent.DropItem,
    applyMiddlewares(getCharacterAssociatedData, prohibitIfDead)(socket, dropItemHandler)
  );
  socket.on(
    ClientToServerEvent.DropEquippedItem,
    applyMiddlewares(getCharacterAssociatedData, prohibitIfDead)(socket, dropEquippedItemHandler)
  );
  socket.on(
    ClientToServerEvent.UnequipSlot,
    applyMiddlewares(getCharacterAssociatedData, prohibitIfDead)(socket, unequipSlotHandler)
  );
  socket.on(
    ClientToServerEvent.EquipInventoryItem,
    applyMiddlewares(getCharacterAssociatedData, prohibitIfDead)(socket, equipItemHandler)
  );
  socket.on(
    ClientToServerEvent.PickUpItem,
    applyMiddlewares(getCharacterAssociatedData, prohibitIfDead)(socket, pickUpItemHandler)
  );
  socket.on(
    ClientToServerEvent.AcknowledgeReceiptOfItemOnGroundUpdate,
    applyMiddlewares(getPlayerAssociatedData)(socket, acknowledgeReceiptOfItemOnGroundHandler)
  );
  socket.on(
    ClientToServerEvent.SelectCombatAction,
    applyMiddlewares(getCharacterAssociatedData, prohibitIfDead)(socket, selectCombatActionHandler)
  );
  socket.on(
    ClientToServerEvent.CycleCombatActionTargets,
    applyMiddlewares(getCharacterAssociatedData, prohibitIfDead)(socket, cycleTargetsHandler)
  );
  socket.on(
    ClientToServerEvent.CycleTargetingSchemes,
    applyMiddlewares(getCharacterAssociatedData, prohibitIfDead)(
      socket,
      cycleTargetingSchemesHandler
    )
  );
  socket.on(
    ClientToServerEvent.UseSelectedCombatAction,
    applyMiddlewares(getCharacterAssociatedData, prohibitIfDead)(
      socket,
      useSelectedCombatActionHandler
    )
  );
  socket.on(
    ClientToServerEvent.IncrementAttribute,
    applyMiddlewares(getCharacterAssociatedData, prohibitIfDead)(
      socket,
      characterSpentAttributePointHandler
    )
  );
}
