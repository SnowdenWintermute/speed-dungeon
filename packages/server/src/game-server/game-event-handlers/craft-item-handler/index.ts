import {
  CharacterAssociatedData,
  CombatantProperties,
  DungeonRoomType,
  ERROR_MESSAGES,
  EntityId,
  Equipment,
  GameMode,
  Inventory,
  ServerToClientEvent,
  getCraftingActionPrice,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../../singletons.js";
import { CraftingAction } from "@speed-dungeon/common";
import writePlayerCharactersInGameToDb from "../../saved-character-event-handlers/write-player-characters-in-game-to-db.js";
import { repairEquipment } from "./repair-equipment.js";
import { makeNonMagicalItemMagical } from "./make-non-magical-item-magical.js";

export async function craftItemHandler(
  eventData: { characterId: EntityId; itemId: EntityId; craftingAction: CraftingAction },
  characterAssociatedData: CharacterAssociatedData
) {
  const gameServer = getGameServer();
  const { game, party, character, player } = characterAssociatedData;
  // deny if not in vending machine room
  if (party.currentRoom.roomType !== DungeonRoomType.VendingMachine)
    return new Error(ERROR_MESSAGES.PARTY.INCORRECT_ROOM_TYPE);

  const { characterId, itemId, craftingAction } = eventData;
  const { inventory } = character.combatantProperties;
  // check if they own the item
  const itemResult = CombatantProperties.getOwnedItemById(character.combatantProperties, itemId);
  console.log("ITEM RESULT: ", itemResult);
  if (itemResult instanceof Error) return itemResult;
  // make sure it is an equipment
  if (!(itemResult instanceof Equipment)) return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);

  // get price for crafting action
  const price = getCraftingActionPrice(craftingAction, itemResult);
  // deny if not enough shards
  if (inventory.shards < price) return new Error(ERROR_MESSAGES.COMBATANT.NOT_ENOUGH_SHARDS);

  // modify the item in inventory
  const actionHandler = craftingActionHandlers[craftingAction];
  const actionResult = actionHandler(itemResult);
  if (actionResult instanceof Error) return actionResult;

  // deduct the price from their inventory (do this after in case of error, like trying to imbue an already magical item)
  inventory.shards -= price;

  // save character
  if (game.mode === GameMode.Progression) {
    const saveResult = await writePlayerCharactersInGameToDb(game, player);
    if (saveResult instanceof Error) return saveResult;
  }

  console.log("modified item");

  // emit item
  gameServer.io
    .to(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.CharacterPerformedCraftingAction, {
      characterId,
      item: itemResult,
      craftingAction,
    });
}

const craftingActionHandlers: Record<CraftingAction, (equipment: Equipment) => void | Error> = {
  [CraftingAction.Repair]: repairEquipment,
  [CraftingAction.Imbue]: makeNonMagicalItemMagical,
  [CraftingAction.Augment]: function (): void | Error {
    throw new Error("Function not implemented.");
  },
  [CraftingAction.Tumble]: function (): void | Error {
    throw new Error("Function not implemented.");
  },
  [CraftingAction.Reform]: function (): void | Error {
    throw new Error("Function not implemented.");
  },
  [CraftingAction.Shake]: function (): void | Error {
    throw new Error("Function not implemented.");
  },
};