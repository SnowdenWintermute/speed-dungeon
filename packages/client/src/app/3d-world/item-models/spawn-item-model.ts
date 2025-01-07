import { Consumable, Equipment, Item } from "@speed-dungeon/common";
import { equipmentBaseItemToModelPath } from "./equipment-base-item-to-model-path";
import { ISceneLoaderAsyncResult, Scene } from "@babylonjs/core";
import { SavedMaterials } from "../game-world/materials/create-default-materials";
import { importMesh } from "../utils";
import { consumableItemToModelPath } from "./consumable-item-to-model-path";
import {
  assignConsumableMaterials,
  assignEquipmentMaterials,
} from "../game-world/materials/assign-item-materials";
import { BASE_FILE_PATH } from "../combatant-models/modular-character/modular-character-parts";

export async function spawnItemModel(
  item: Item,
  scene: Scene,
  materials: SavedMaterials,
  createUniqueMaterialInstances: boolean
): Promise<Error | ISceneLoaderAsyncResult> {
  const modelPath = (() => {
    if (item instanceof Equipment) {
      return equipmentBaseItemToModelPath(item.equipmentBaseItemProperties.baseItem);
    } else if (item instanceof Consumable) {
      return consumableItemToModelPath(item.consumableType);
    }
    throw new Error("not an instance of item");
  })();

  if (modelPath === null || modelPath === BASE_FILE_PATH)
    return new Error(`No model path was found for item [${item.entityProperties.name}]`);

  const itemModel = await importMesh(modelPath, scene);

  if (item instanceof Equipment)
    assignEquipmentMaterials(item, itemModel, materials, scene, createUniqueMaterialInstances);
  else if (item instanceof Consumable) assignConsumableMaterials(item, itemModel, materials, scene);

  if (!itemModel) return new Error("Model not successfully spawned");
  return itemModel;
}
