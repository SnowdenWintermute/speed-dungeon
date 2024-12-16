import { Consumable, Equipment, Item } from "@speed-dungeon/common";
import { equipmentBaseItemToModelPath } from "./equipment-base-item-to-model-path";
import { Scene } from "@babylonjs/core";
import { SavedMaterials } from "../game-world/materials/create-default-materials";
import { importMesh } from "../utils";
import { consumableItemToModelPath } from "./consumable-item-to-model-path";
import {
  assignConsumableMaterials,
  assignEquipmentMaterials,
} from "../game-world/materials/assign-item-materials";

export async function spawnItemModel(item: Item, scene: Scene, materials: SavedMaterials) {
  const modelPath = (() => {
    if (item instanceof Equipment) {
      return equipmentBaseItemToModelPath(
        item.equipmentBaseItemProperties.type,
        item.equipmentBaseItemProperties.baseItem
      );
    } else if (item instanceof Consumable) {
      return consumableItemToModelPath(item.consumableType);
    }
    return "";
  })();

  if (modelPath === null)
    return new Error(`No model path was found for item [${item.entityProperties.name}]`);
  const itemModel = await importMesh(modelPath, scene);

  if (item instanceof Equipment) assignEquipmentMaterials(item, itemModel, materials, scene);
  else if (item instanceof Consumable) assignConsumableMaterials(item, itemModel, materials, scene);

  if (!itemModel) return new Error("Model not successfully spawned");
  return itemModel;
}
