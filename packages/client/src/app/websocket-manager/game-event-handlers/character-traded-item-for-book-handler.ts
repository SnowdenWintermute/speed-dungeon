import {
  CharacterAssociatedData,
  CombatantProperties,
  Consumable,
  EntityId,
  TaggedEquipmentSlot,
  getSkillBookName,
} from "@speed-dungeon/common";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";
import { setAlert } from "../../components/alerts";
import { getGameWorld } from "@/app/3d-world/SceneManager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";
import { plainToInstance } from "class-transformer";

export function characterTradedItemForBookHandler(eventData: {
  characterId: EntityId;
  itemIdTraded: EntityId;
  book: Consumable;
}) {
  const slotsUnequipped: TaggedEquipmentSlot[] = [];
  const { characterId, itemIdTraded, book } = eventData;

  characterAssociatedDataProvider(characterId, ({ character }: CharacterAssociatedData) => {
    const { combatantProperties } = character;
    // unequip it if is equipped
    const equippedItems = combatantProperties.equipment.getAllEquippedItems({
      includeUnselectedHotswapSlots: true,
    });

    for (const item of equippedItems) {
      if (item.entityProperties.id === itemIdTraded) {
        const slot = combatantProperties.equipment.getSlotItemIsEquippedTo(
          item.entityProperties.id
        );
        if (slot !== null) {
          CombatantProperties.unequipSlots(combatantProperties, [slot]);
          slotsUnequipped.push(slot);
        }
      }
    }

    const removedItemResult = combatantProperties.inventory.removeStoredOrEquipped(itemIdTraded);
    if (removedItemResult instanceof Error) setAlert(removedItemResult);
    else {
      const asClassInstance = plainToInstance(Consumable, book);
      const { inventory } = combatantProperties;
      inventory.insertItem(asClassInstance);
      setAlert(`Obtained ${getSkillBookName(book.consumableType, book.itemLevel)}`, true);
    }
  });

  getGameWorld().modelManager.modelActionQueue.enqueueMessage({
    type: ModelActionType.SynchronizeCombatantEquipmentModels,
    entityId: characterId,
  });
}
