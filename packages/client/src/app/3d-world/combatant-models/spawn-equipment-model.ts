import { Item, ItemPropertiesType } from "@speed-dungeon/common";
import { equipmentBaseItemToModelPath } from "./equipment-base-item-to-model-path";
import { GameWorld } from "../game-world";
import setDefaultMaterials from "../game-world/materials/set-default-materials";
import { assignEquipmentMaterials } from "../game-world/materials/assign-equipment-materials";

export default async function spawnEquipmentModel(world: GameWorld, item: Item) {
  if (item.itemProperties.type !== ItemPropertiesType.Equipment)
    return new Error("Tried to spawn equipment model for non-equipment");
  const { equipmentProperties } = item.itemProperties;
  const modelPath = equipmentBaseItemToModelPath(
    equipmentProperties.equipmentBaseItemProperties.type,
    equipmentProperties.equipmentBaseItemProperties.baseItem
  );
  if (modelPath === null) return new Error("No model path");
  const equipmentModel = await world.importMesh(modelPath);
  setDefaultMaterials(world, equipmentModel);
  assignEquipmentMaterials(world, item, equipmentModel);
  if (!equipmentModel) return new Error("Model not successfully spawned");
  return equipmentModel;
}
