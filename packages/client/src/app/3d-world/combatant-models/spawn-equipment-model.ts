import { Item, ItemPropertiesType } from "@speed-dungeon/common";
import { equipmentBaseItemToModelPath } from "./equipment-base-item-to-model-path";
import { assignEquipmentMaterials } from "../game-world/materials/assign-equipment-materials";
import { Scene } from "@babylonjs/core";
import { SavedMaterials } from "../game-world/materials/create-default-materials";
import { importMesh } from "../utils";

export default async function spawnEquipmentModel(
  item: Item,
  scene: Scene,
  materials: SavedMaterials
) {
  if (item.itemProperties.type !== ItemPropertiesType.Equipment)
    return new Error("Tried to spawn equipment model for non-equipment");
  const { equipmentProperties } = item.itemProperties;
  const modelPath = equipmentBaseItemToModelPath(
    equipmentProperties.equipmentBaseItemProperties.type,
    equipmentProperties.equipmentBaseItemProperties.baseItem
  );
  if (modelPath === null) return new Error("No model path");
  const equipmentModel = await importMesh(modelPath, scene);

  assignEquipmentMaterials(item, equipmentModel, materials, scene);
  console.log("num materials: ", scene.materials.length);
  if (!equipmentModel) return new Error("Model not successfully spawned");
  return equipmentModel;
}
