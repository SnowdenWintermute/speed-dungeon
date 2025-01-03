import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  ClientToServerEvent,
} from "@speed-dungeon/common";
import SocketIO from "socket.io";
import { applyMiddlewares } from "../event-middleware/index.js";
import toggleReadyToExploreHandler from "./toggle-ready-to-explore-handler.js";
import { playerInGame } from "../event-middleware/get-player-associated-data.js";
import { toggleReadyToDescendHandler } from "./toggle-ready-to-descend-handler/index.js";
import { getCharacterAssociatedData } from "../event-middleware/get-character-associated-data.js";
import { prohibitIfDead } from "../event-middleware/prohibit-if-dead.js";
import dropItemHandler from "./drop-item-handler.js";
import dropEquippedItemHandler from "./drop-equipped-item-handler.js";
import unequipSlotHandler from "./unequip-slot-handler.js";
import equipItemHandler from "./equip-item-handler.js";
import { pickUpItemsHandler } from "./pick-up-items-handler.js";
import acknowledgeReceiptOfItemOnGroundHandler from "./acknowledge-receipt-of-item-on-ground-handler.js";
import selectCombatActionHandler from "./select-combat-action-handler.js";
import cycleTargetsHandler from "./cycle-targets-handler.js";
import cycleTargetingSchemesHandler from "./cycle-targeting-schemes-handler.js";
import useSelectedCombatActionHandler from "./character-uses-selected-combat-action-handler/index.js";
import characterSpentAttributePointHandler from "./character-spent-attribute-point-handler.js";
import selectHoldableHotswapSlotHandler from "./select-holdable-hotswap-slot-handler.js";
import { prohibitInCombat } from "../event-middleware/prohibit-in-combat.js";
import { convertItemsToShardsHandler } from "./convert-items-to-shards-handler.js";

export default function initiateGameEventListeners(
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  socket.on(
    ClientToServerEvent.ToggleReadyToExplore,
    applyMiddlewares(playerInGame)(socket, toggleReadyToExploreHandler)
  );
  socket.on(
    ClientToServerEvent.ToggleReadyToDescend,
    applyMiddlewares(playerInGame)(socket, toggleReadyToDescendHandler)
  );
  socket.on(
    ClientToServerEvent.DropItem,
    applyMiddlewares(getCharacterAssociatedData, prohibitIfDead)(socket, dropItemHandler)
  );
  socket.on(
    ClientToServerEvent.DropEquippedItem,
    applyMiddlewares(
      getCharacterAssociatedData,
      prohibitIfDead,
      prohibitInCombat
    )(socket, dropEquippedItemHandler)
  );
  socket.on(
    ClientToServerEvent.UnequipSlot,
    applyMiddlewares(
      getCharacterAssociatedData,
      prohibitIfDead,
      prohibitInCombat
    )(socket, unequipSlotHandler)
  );
  socket.on(
    ClientToServerEvent.EquipInventoryItem,
    applyMiddlewares(
      getCharacterAssociatedData,
      prohibitIfDead,
      prohibitInCombat
    )(socket, equipItemHandler)
  );
  socket.on(
    ClientToServerEvent.PickUpItems,
    applyMiddlewares(getCharacterAssociatedData, prohibitIfDead)(socket, pickUpItemsHandler)
  );
  socket.on(
    ClientToServerEvent.AcknowledgeReceiptOfItemOnGroundUpdate,
    applyMiddlewares(playerInGame)(socket, acknowledgeReceiptOfItemOnGroundHandler)
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
  socket.on(
    ClientToServerEvent.SelectHoldableHotswapSlot,
    applyMiddlewares(getCharacterAssociatedData, prohibitIfDead)(
      socket,
      selectHoldableHotswapSlotHandler
    )
  );
  socket.on(
    ClientToServerEvent.ConvertItemsToShards,
    applyMiddlewares(getCharacterAssociatedData, prohibitIfDead)(
      socket,
      convertItemsToShardsHandler
    )
  );
}
