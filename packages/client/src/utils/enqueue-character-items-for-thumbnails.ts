import { gameWorld } from "@/app/3d-world/SceneManager";
import { ImageManagerRequestType } from "@/app/3d-world/game-world/image-manager";
import {
  Combatant,
  Consumable,
  ConsumableType,
  formatConsumableType,
  iterateNumericEnum,
} from "@speed-dungeon/common";

export function enqueueCharacterItemsForThumbnails(character: Combatant) {
  for (const item of character.combatantProperties.inventory.equipment.concat(
    Object.values(character.combatantProperties.equipment)
  )) {
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
