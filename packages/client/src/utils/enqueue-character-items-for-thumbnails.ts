import { getGameWorld } from "@/app/3d-world/SceneManager";
import { ImageManagerRequestType } from "@/app/3d-world/game-world/image-manager";
import {
  CONSUMABLE_TYPE_STRINGS,
  Combatant,
  CombatantEquipment,
  Consumable,
  ConsumableType,
  iterateNumericEnum,
} from "@speed-dungeon/common";

export function enqueueCharacterItemsForThumbnails(character: Combatant) {
  const itemsToCreateThumbnailsFor = [];
  itemsToCreateThumbnailsFor.push(...character.combatantProperties.inventory.equipment);
  const hotswapSets = CombatantEquipment.getHoldableHotswapSlots(character.getEquipmentOption());
  if (hotswapSets)
    for (const hotswapSet of hotswapSets)
      itemsToCreateThumbnailsFor.push(...Object.values(hotswapSet.holdables));
  itemsToCreateThumbnailsFor.push(
    ...Object.values(character.combatantProperties.equipment.wearables)
  );

  for (const item of itemsToCreateThumbnailsFor) {
    getGameWorld().imageManager.enqueueMessage({
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

    getGameWorld().imageManager.enqueueMessage({
      type: ImageManagerRequestType.ItemCreation,
      item: item,
    });
  }
}
