import { gameWorld } from "@/app/3d-world/SceneManager";
import { ImageManagerRequestType } from "@/app/3d-world/game-world/image-manager";
import {
  Combatant,
  CombatantEquipment,
  Consumable,
  ConsumableType,
  formatConsumableType,
  iterateNumericEnum,
} from "@speed-dungeon/common";

export function enqueueCharacterItemsForThumbnails(character: Combatant) {
  const itemsToCreateThumbnailsFor = [];
  itemsToCreateThumbnailsFor.push(...character.combatantProperties.inventory.equipment);
  const hotswapSets = CombatantEquipment.getHoldableHotswapSlots(character.combatantProperties);
  if (hotswapSets)
    for (const hotswapSet of hotswapSets)
      itemsToCreateThumbnailsFor.push(...Object.values(hotswapSet.holdables));
  itemsToCreateThumbnailsFor.push(
    ...Object.values(character.combatantProperties.equipment.wearables)
  );

  for (const item of itemsToCreateThumbnailsFor) {
    gameWorld.current?.imageManager.enqueueMessage({
      type: ImageManagerRequestType.ItemCreation,
      item: item,
    });
  }
}

export function enqueueConsumableGenericThumbnailCreation() {
  for (const consumableType of iterateNumericEnum(ConsumableType)) {
    const item = new Consumable(
      { id: formatConsumableType(consumableType), name: "" },
      0,
      {},
      consumableType,
      1
    );

    gameWorld.current?.imageManager.enqueueMessage({
      type: ImageManagerRequestType.ItemCreation,
      item: item,
    });
  }
}
