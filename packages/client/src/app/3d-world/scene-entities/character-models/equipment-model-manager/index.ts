import {
  Equipment,
  HoldableSlotType,
  NormalizedPercentage,
  WearableSlotType,
} from "@speed-dungeon/common";
import { EquipmentModel } from "../../item-models";
import { handleHotswapSlotChanged } from "./handle-hotswap-slot-changed";
import { CharacterModel } from "../";

export class EquipmentModelManager {
  equipment: {
    wearables: Record<WearableSlotType, null | EquipmentModel>;
    holdables: Partial<Record<HoldableSlotType, null | EquipmentModel>>[];
  } = {
    wearables: {
      [WearableSlotType.Head]: null,
      [WearableSlotType.Body]: null,
      [WearableSlotType.RingL]: null,
      [WearableSlotType.RingR]: null,
      [WearableSlotType.Amulet]: null,
    },
    holdables: [],
  };
  constructor(public CharacterModel: CharacterModel) {}

  cleanup() {
    //     for (const [_slotType, model] of iterateNumericEnumKeyedRecord(this.equipment.wearables))
    //       model?.cleanup({ softCleanup: false });
    //     for (const holdableHotswapSlot of this.equipment.holdables)
    //       for (const holdable of Object.values(holdableHotswapSlot)) {
    //         holdable?.cleanup({ softCleanup: false });
    //       }
  }

  /** Some hotswap slots may be hidden since we only show two slots but a character may have more that two */
  setVisibilityForShownHotswapSlots(visibility: NormalizedPercentage) {
    //     for (const holdableHotswapSlot of this.equipment.holdables)
    //       for (const holdable of Object.values(holdableHotswapSlot)) {
    //         holdable?.assetContainer.meshes.forEach((mesh) => (mesh.visibility = this.visibility));
    //       }
    //     for (const wearable of Object.values(this.equipment.wearables)) {
    //       wearable?.assetContainer.meshes.forEach((mesh) => (mesh.visibility = this.visibility));
    //     }
  }

  async synchronizeCombatantEquipmentModels() {
    // get the combatant equipment state
    // for each existing model
    // - if not in any hotswap slot, dispose it
    //
    // for each hotswap slot
    // - if no existing model, spawn it
    // - set visibility if should be shown
    // - attach to proper position
  }

  async unequipHoldableModel(slot: HoldableSlotType) {
    // const toDispose = this.equipment.holdables[slot];
    // if (!toDispose) return;
    // toDispose.cleanup({ softCleanup: false });
    // if (this.isIdling()) {
    //   this.startIdleAnimation(500);
    // } else console.log("wasn't idling when unequipping");
  }

  async equipHoldableModel(equipment: Equipment, slot: HoldableSlotType, holstered?: boolean) {
    // const equipmentModelResult = await spawnItemModel(
    //   equipment,
    //   this.world.scene,
    //   this.world.defaultMaterials,
    //   true
    // );
    // if (equipmentModelResult instanceof Error) {
    //   console.log("equipment model error: ", equipmentModelResult.message);
    //   return;
    // }
    // if (equipmentModelResult instanceof ConsumableModel)
    //   return new Error("unexpected item model type");
    // console.log(
    //   "setting",
    //   equipmentModelResult.equipment.entityProperties.name,
    //   "visibility to",
    //   this.visibility
    // );
    // for (const mesh of equipmentModelResult.assetContainer.meshes) {
    //   mesh.visibility = this.visibility;
    // }
    // if (holstered) {
    //   this.equipment.holstered[slot] = equipmentModelResult;
    //   attachHoldableModelToHolsteredPosition(this, equipmentModelResult, slot, equipment);
    // } else {
    //   this.equipment.holdables[slot] = equipmentModelResult;
    //   attachHoldableModelToSkeleton(this, equipmentModelResult, slot, equipment);
    // }
  }

  handleHotswapSlotChanged = handleHotswapSlotChanged;
}
