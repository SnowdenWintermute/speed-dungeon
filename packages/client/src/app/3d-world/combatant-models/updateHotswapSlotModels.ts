import {
  EquipmentSlotType,
  HoldableHotswapSlot,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { ModularCharacter } from "./modular-character";

export async function handleEquipHotswapSlot(
  this: ModularCharacter,
  slotSwitchingAwayFrom: { index: number; slot: HoldableHotswapSlot },
  newlySelectedSlot: { index: number; slot: HoldableHotswapSlot }
) {
  // if slot switching away from is NOT in the first two indices, despawn the models
  // because we've nowhere to show models beyond a stowed and equipped set
  if (slotSwitchingAwayFrom.index > 1) {
    for (const [slot, _equipment] of iterateNumericEnumKeyedRecord(
      slotSwitchingAwayFrom.slot.holdables
    )) {
      await this.world.modelManager.handleEquipmentChange(this.entityId, {
        type: EquipmentSlotType.Holdable,
        slot,
      });
    }
  }

  for (const [slot, equipment] of iterateNumericEnumKeyedRecord(newlySelectedSlot.slot.holdables)) {
    // check if models exists
    let existingModel;
    for (const [slot, item] of iterateNumericEnumKeyedRecord(this.equipment.holsteredHoldables)) {
      // if()
    }
    // if not, spawn it
    // attach it to equipped position
  }

  // if newly equipped items don't have models, spawn them

  // the lowest index slot that is not selected should be displayed in "holsters"
  // find lowest index non selected slot
  // check if item ids in that slot have existing models
  // spawn them if not
  // change their positions to holster positions
  // check if newly swapped to items have models
  // spawn them if not
  // change their positions to equipped positions
}
