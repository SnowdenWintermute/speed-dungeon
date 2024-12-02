import { gameWorld } from "@/app/3d-world/SceneManager";
import { ImageManagerRequestType } from "@/app/3d-world/game-world/image-manager";
import { Combatant, ItemPropertiesType } from "@speed-dungeon/common";

export default function enqueueCharacterItemsForThumbnails(character: Combatant) {
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
