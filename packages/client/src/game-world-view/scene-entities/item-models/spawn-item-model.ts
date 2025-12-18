import { Consumable, Equipment, Item } from "@speed-dungeon/common";
import { equipmentBaseItemToModelPath } from "./equipment-base-item-to-model-path";
import { Scene } from "@babylonjs/core";
import { consumableItemToModelPath } from "./consumable-item-to-model-path";
import { SavedMaterials } from "@/game-world-view/materials/create-default-materials";
import { ConsumableModel, EquipmentModel } from ".";
import { importMesh } from "@/game-world-view/game-world-view-utils";
import { BASE_FILE_PATH } from "../character-models/modular-character-parts-model-manager/modular-character-parts";
import {
  assignConsumableMaterials,
  assignEquipmentMaterials,
} from "@/game-world-view/materials/assign-item-materials";

export async function spawnItemModel(
  item: Item,
  scene: Scene,
  materials: SavedMaterials,
  createUniqueMaterialInstances: boolean
): Promise<Error | EquipmentModel | ConsumableModel> {
  const modelPath = (() => {
    if (item instanceof Equipment) {
      return equipmentBaseItemToModelPath(item.equipmentBaseItemProperties.taggedBaseEquipment);
    } else if (item instanceof Consumable) {
      return consumableItemToModelPath(item.consumableType);
    }
    throw new Error("not an instance of item");
  })();

  if (modelPath === null || modelPath === BASE_FILE_PATH) {
    return new Error(`No model path was found for item [${item.entityProperties.name}]`);
  }

  const itemAssetContainer = await importMesh(modelPath, scene);

  if (item instanceof Equipment) {
    assignEquipmentMaterials(
      item,
      itemAssetContainer,
      materials,
      scene,
      createUniqueMaterialInstances
    );

    return new EquipmentModel(item, itemAssetContainer, createUniqueMaterialInstances);
  } else if (item instanceof Consumable) {
    assignConsumableMaterials(item, itemAssetContainer, materials, scene);
    return new ConsumableModel(item, itemAssetContainer, createUniqueMaterialInstances);
  }

  return new Error("Unexpected item class type");
}
