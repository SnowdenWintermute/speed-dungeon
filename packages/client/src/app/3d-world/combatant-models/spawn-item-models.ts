import { Item, ItemPropertiesType } from "@speed-dungeon/common";
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
    switch (item.itemProperties.type) {
      case ItemPropertiesType.Equipment:
        const { equipmentProperties } = item.itemProperties;
        return equipmentBaseItemToModelPath(
          equipmentProperties.equipmentBaseItemProperties.type,
          equipmentProperties.equipmentBaseItemProperties.baseItem
        );
      case ItemPropertiesType.Consumable:
        const { consumableProperties } = item.itemProperties;
        return consumableItemToModelPath(consumableProperties.consumableType);
    }
  })();

  if (modelPath === null)
    return new Error(`No model path was found for item [${item.entityProperties.name}]`);
  const itemModel = await importMesh(modelPath, scene);

  switch (item.itemProperties.type) {
    case ItemPropertiesType.Equipment:
      assignEquipmentMaterials(item, itemModel, materials, scene);
      break;
    case ItemPropertiesType.Consumable:
      assignConsumableMaterials(item, itemModel, materials, scene);
      break;
  }

  if (!itemModel) return new Error("Model not successfully spawned");
  return itemModel;
}
