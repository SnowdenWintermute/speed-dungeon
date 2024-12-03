import { gameWorld } from "@/app/3d-world/SceneManager";
import { ImageManagerRequestType } from "@/app/3d-world/game-world/image-manager";
import {
  Combatant,
  ConsumableType,
  Item,
  ItemPropertiesType,
  iterateNumericEnum,
} from "@speed-dungeon/common";

export function enqueueCharacterItemsForThumbnails(character: Combatant) {
  for (const item of character.combatantProperties.inventory.items.concat(
    Object.values(character.combatantProperties.equipment)
  )) {
    if (item.itemProperties.type !== ItemPropertiesType.Equipment) continue;
    gameWorld.current?.imageManager.enqueueMessage({
      type: ImageManagerRequestType.ItemCreation,
      item: item,
    });
  }
}

export function enqueueConsumableGenericThumbnailCreation() {
  //
  for (const consumableType of iterateNumericEnum(ConsumableType)) {
    const item = new Item(
      { id: "", name: "" },
      0,
      {},
      {
        type: ItemPropertiesType.Consumable,
        consumableProperties: { consumableType, usesRemaining: 1 },
      }
    );

    gameWorld.current?.imageManager.enqueueMessage({
      type: ImageManagerRequestType.ItemCreation,
      item: item,
    });
  }
}
