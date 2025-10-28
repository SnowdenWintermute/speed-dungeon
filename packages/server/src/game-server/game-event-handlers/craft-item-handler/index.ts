import {
  CharacterAssociatedData,
  DungeonRoomType,
  ERROR_MESSAGES,
  EntityId,
  Equipment,
  GameMode,
  ServerToClientEvent,
  applyEquipmentEffectWhileMaintainingResourcePercentages,
  getCraftingActionPrice,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../../singletons/index.js";
import { CraftingAction } from "@speed-dungeon/common";
import { writePlayerCharactersInGameToDb } from "../../saved-character-event-handlers/write-player-characters-in-game-to-db.js";
import { repairEquipment } from "./repair-equipment.js";
import { makeNonMagicalItemMagical } from "./make-non-magical-item-magical.js";
import { replaceExistingWithNewRandomAffixes } from "./replace-existing-with-new-random-affixes.js";
import { randomizeExistingAffixRolls } from "./randomize-existing-affix-rolls.js";
import { addAffixToItem } from "./add-affix-to-item.js";
import { randomizeBaseItemRollableProperties } from "./randomize-base-item-rollable-properties.js";

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
  const itemResult = character.combatantProperties.inventory.getStoredOrEquipped(itemId);
  if (itemResult instanceof Error) return itemResult;
  // make sure it is an equipment
  if (!(itemResult instanceof Equipment)) return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);

  // get price for crafting action
  const price = getCraftingActionPrice(craftingAction, itemResult);
  // deny if not enough shards
  if (inventory.shards < price) return new Error(ERROR_MESSAGES.COMBATANT.NOT_ENOUGH_SHARDS);

  // modify the item in inventory
  let actionResult: Error | void = new Error("Action callback never called");

  let percentRepairedBeforeModification = 1;
  const durabilityOption = Equipment.getDurability(itemResult);
  if (durabilityOption) {
    percentRepairedBeforeModification = durabilityOption.current / durabilityOption.max;
  }

  applyEquipmentEffectWhileMaintainingResourcePercentages(character.combatantProperties, () => {
    const actionHandler = craftingActionHandlers[craftingAction];
    const floorNumber = party.dungeonExplorationManager.getCurrentFloor();
    actionResult = actionHandler(itemResult, floorNumber);
  });
  if (actionResult instanceof Error) return actionResult;

  if (craftingAction !== CraftingAction.Repair) {
    const durabilityOptionAfter = Equipment.getDurability(itemResult);
    if (durabilityOptionAfter && itemResult.durability) {
      itemResult.durability.current = Math.round(
        durabilityOptionAfter.max * percentRepairedBeforeModification
      );
    }
  }

  // deduct the price from their inventory (do this after in case of error, like trying to imbue an already magical item)
  inventory.shards -= price;

  // save character
  if (game.mode === GameMode.Progression) {
    const saveResult = await writePlayerCharactersInGameToDb(game, player);
    if (saveResult instanceof Error) return saveResult;
  }

  // emit item
  gameServer.io
    .to(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.CharacterPerformedCraftingAction, {
      characterId,
      item: itemResult,
      craftingAction,
    });
}

const craftingActionHandlers: Record<
  CraftingAction,
  (equipment: Equipment, itemLevelLimiter: number) => void | Error
> = {
  [CraftingAction.Repair]: repairEquipment,
  [CraftingAction.Imbue]: makeNonMagicalItemMagical,
  [CraftingAction.Augment]: addAffixToItem,
  [CraftingAction.Tumble]: replaceExistingWithNewRandomAffixes,
  [CraftingAction.Reform]: randomizeBaseItemRollableProperties,
  [CraftingAction.Shake]: randomizeExistingAffixRolls,
};
