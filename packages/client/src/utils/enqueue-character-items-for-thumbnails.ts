import { getGameWorldView } from "@/app/game-world-view-canvas/SceneManager";
import { ImageManagerRequestType } from "@/game-world-view/image-manager";
import {
  CONSUMABLE_TYPE_STRINGS,
  Combatant,
  Consumable,
  ConsumableType,
  iterateNumericEnum,
} from "@speed-dungeon/common";

export function enqueueCharacterItemsForThumbnails(character: Combatant) {
  const itemsToCreateThumbnailsFor = [];
  itemsToCreateThumbnailsFor.push(...character.combatantProperties.inventory.equipment);
  const equipment = character.getEquipmentOption();
  const hotswapSets = equipment.getHoldableHotswapSlots();
  if (hotswapSets) {
    for (const hotswapSet of hotswapSets) {
      itemsToCreateThumbnailsFor.push(...Object.values(hotswapSet.holdables));
      itemsToCreateThumbnailsFor.push(...Object.values(equipment.getWearables()));
    }
  }

  for (const item of itemsToCreateThumbnailsFor) {
    getGameWorldView().imageManager.enqueueMessage({
      type: ImageManagerRequestType.ItemCreation,
      item: item,
    });
  }
}

export function enqueueConsumableGenericThumbnailCreation() {
  for (const consumableType of iterateNumericEnum(ConsumableType)) {
    const item = new Consumable(
      { id: CONSUMABLE_TYPE_STRINGS[consumableType], name: "" },
      0,
      {},
      consumableType,
      1
    );

    getGameWorldView().imageManager.enqueueMessage({
      type: ImageManagerRequestType.ItemCreation,
      item: item,
    });
  }
}
