import {
  EquipmentSlotType,
  HoldableHotswapSlot,
  HoldableSlotType,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { ModularCharacter } from "./modular-character";
import { spawnItemModel } from "./spawn-item-models";
import { ISceneLoaderAsyncResult, Vector3 } from "@babylonjs/core";
import attachEquipmentModelToSkeleton from "./attach-equipment-model-to-skeleton";

export type HotswapSlotWithIndex = { index: number; slot: HoldableHotswapSlot };

export async function handleEquipHotswapSlot(
  this: ModularCharacter,
  slotSwitchingAwayFrom: HotswapSlotWithIndex,
  newlySelectedSlot: HotswapSlotWithIndex
) {
  console.log("trying to unequip HotswapSlotWithIndex models");

  let unequippedModels: Partial<
    Record<
      HoldableSlotType,
      {
        entityId: string;
        scene: ISceneLoaderAsyncResult;
      } | null
    >
  > | null = null;
  // if slot switching away from is NOT in the first two indices, despawn the models
  // because we've nowhere to show models beyond a stowed and equipped set
  if (slotSwitchingAwayFrom.index > 1) {
    console.log("despawning unquipped slot due to it being not in the first 2 slot indices");
    for (const [slot, _equipment] of iterateNumericEnumKeyedRecord(
      slotSwitchingAwayFrom.slot.holdables
    )) {
      await this.world.modelManager.handleEquipmentChange(this.entityId, {
        type: EquipmentSlotType.Holdable,
        slot,
      });
    }
  } else {
    // save a ref to the current models in the equipped models ref slot
    // so later we can
    // move the models in the equipped holdables model reference slot to the holstered slot
    unequippedModels = this.equipment.equippedHoldables;
    this.equipment.equippedHoldables = null;
    console.log("setting current holdable models as unequipped: ", unequippedModels);
  }

  if (!this.equipment.equippedHoldables) this.equipment.equippedHoldables = {};

  for (const [slot, equipment] of iterateNumericEnumKeyedRecord(newlySelectedSlot.slot.holdables)) {
    // check if models exists
    let existingModel;
    if (this.equipment.holsteredHoldables)
      for (const [slot, item] of iterateNumericEnumKeyedRecord(this.equipment.holsteredHoldables)) {
        if (item?.entityId === equipment.entityProperties.id) {
          existingModel = item.scene;
          console.log("found existing model for ", equipment.entityProperties.name);
          break;
        }
      }
    // if not, spawn it
    if (!existingModel) {
      console.log("no existing model found for", equipment.entityProperties.name);
      const equipmentModelResult = await spawnItemModel(
        equipment,
        this.world.scene,
        this.world.defaultMaterials
      );
      if (equipmentModelResult instanceof Error)
        return console.log("equipment model error: ", equipmentModelResult.message);

      existingModel = equipmentModelResult;
    }

    // attach it to equipped position and store its reference in the equipped holdables model reference spot
    this.equipment.equippedHoldables[slot] = {
      entityId: equipment.entityProperties.id,
      scene: existingModel,
    };

    console.log("attaching model to skeleton");
    attachEquipmentModelToSkeleton(
      this,
      existingModel,
      { type: EquipmentSlotType.Holdable, slot },
      equipment
    );
  }

  if (unequippedModels) {
    console.log("unequippedModels", unequippedModels);
    this.equipment.holsteredHoldables = unequippedModels;
    for (const [slot, model] of iterateNumericEnumKeyedRecord(unequippedModels)) {
      if (model) {
        const parentMesh = model.scene.meshes[0];
        console.log("parent mesh:", parentMesh);
        if (parentMesh) {
          parentMesh.parent = null;
          parentMesh.position = Vector3.Zero();
        }
      }
    }
  }
}
