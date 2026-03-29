import { Scene } from "@babylonjs/core";
import { ConsumableItemSceneEntity } from "./consumable-item-scene-entity";
import { EquipmentSceneEntity } from "./equipment-scene-entity";
import { ClientAppAssetService, Consumable, Equipment, Item } from "@speed-dungeon/common";
import { equipmentBaseItemToAssetId } from "./equipment-base-item-to-asset-id";
import { consumableItemToAssetId } from "./consumable-models";
import { loadAssetContainerIntoScene } from "@/game-world-view/utils/load-asset-container-into-scene";
import { MaterialManager } from "@/game-world-view/materials/material-manager";
import { FloatingMessageService } from "@/client-application/event-log/floating-messages-service";

export class ItemSceneEntityFactory {
  constructor(
    private assetService: ClientAppAssetService,
    private floatingMessageService: FloatingMessageService,
    private scene: Scene,
    private materialManager: MaterialManager
  ) {}

  async create(item: Item, createUniqueMaterialInstances: boolean) {
    const assetId = (() => {
      if (item instanceof Equipment) {
        return equipmentBaseItemToAssetId(item.equipmentBaseItemProperties.taggedBaseEquipment);
      } else if (item instanceof Consumable) {
        return consumableItemToAssetId(item.consumableType);
      }
      throw new Error("not an instance of item");
    })();

    if (assetId === null) {
      throw new Error(`No model path was found for item [${item.entityProperties.name}]`);
    }

    const itemAssetContainer = await loadAssetContainerIntoScene(
      this.assetService,
      this.scene,
      assetId
    );

    if (item instanceof Equipment) {
      this.materialManager.assignEquipmentMaterials(
        item,
        itemAssetContainer,
        createUniqueMaterialInstances
      );
      return new EquipmentSceneEntity(
        item,
        this.scene,
        itemAssetContainer,
        this.floatingMessageService,
        createUniqueMaterialInstances
      );
    } else if (item instanceof Consumable) {
      this.materialManager.assignConsumableMaterials(item, itemAssetContainer);
      return new ConsumableItemSceneEntity(
        item,
        this.scene,
        itemAssetContainer,
        this.floatingMessageService,
        createUniqueMaterialInstances
      );
    }

    throw new Error("Item was not a known item instance type");
  }
}
