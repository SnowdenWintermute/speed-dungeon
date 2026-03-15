import { Scene } from "@babylonjs/core";
import { ConsumableItemSceneEntity } from "./consumable-item-scene-entity";
import { EquipmentSceneEntity } from "./equipment-scene-entity";
import { MaterialPool } from "@/xxNEW-game-world-view/materials/material-pool";
import { Item } from "@speed-dungeon/common";

export class ItemSceneEntityFactory {
  constructor(
    private scene: Scene,
    private materials: MaterialPool
  ) {}

  async create(
    item: Item,
    createUniqueMaterialInstances: boolean
  ): Promise<EquipmentSceneEntity | ConsumableItemSceneEntity> {
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
  }
}
