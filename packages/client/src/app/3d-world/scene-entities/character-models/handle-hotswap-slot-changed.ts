import {
  Equipment,
  HoldableHotswapSlot,
  HoldableSlotType,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { CharacterModel } from "./index.js";
import { spawnItemModel } from "../../item-models/spawn-item-model";
import {
  attachHoldableModelToHolsteredPosition,
  attachHoldableModelToSkeleton,
} from "./attach-holdables";
import { ConsumableModel, EquipmentModel } from "../item-models";

export async function handleHotswapSlotChanged(
  this: CharacterModel,
  hotswapSlots: HoldableHotswapSlot[],
  selectedIndex: number
) {
  let i = 0;
  // make sure models that are supposed to exist do
  // despawn models that shouldn't exist
  const holsteredSlotIndex = getIndexForDisplayedHolsteredSlot(hotswapSlots, selectedIndex);

  for (const hotswapSlot of Object.values(hotswapSlots)) {
    for (const [slot, equipment] of iterateNumericEnumKeyedRecord(hotswapSlot.holdables)) {
      if (i === selectedIndex || i === holsteredSlotIndex) {
        const modelResult = await spawnItemModelIfNotAlready(this, equipment, slot);
        if (modelResult instanceof Error) return modelResult;

        if (i === selectedIndex) attachHoldableModelToSkeleton(this, modelResult, slot, equipment);
        else if (i === holsteredSlotIndex)
          attachHoldableModelToHolsteredPosition(this, modelResult, slot, equipment);
      } else {
        const modelOption = this.equipment.holdables[slot];
        console.log("disposing undisplayed hotswap models", modelOption);
        if (modelOption) modelOption.cleanup({ softCleanup: false });
        delete this.equipment.holdables[slot];
      }
    }

    i += 1;
  }

  if (this.isIdling()) this.startIdleAnimation(500);
  else console.log("wasn't idling on hotswap change");
}

async function spawnItemModelIfNotAlready(modularCharacter: CharacterModel, equipment: Equipment) {
  let model: EquipmentModel | undefined | null = undefined;

  for (const existingEquipmentOption of Object.values(modularCharacter.equipment.holstered).concat(
    Object.values(modularCharacter.equipment.holdables).concat(
      Object.values(modularCharacter.equipment.wearables)
    )
  )) {
    if (existingEquipmentOption?.entityId === equipment.entityProperties.id) {
      model = existingEquipmentOption;
      break;
    }
  }

  if (model?.entityId === equipment.entityProperties.id) return model;

  const modelResult = await spawnItemModel(
    equipment,
    modularCharacter.world.scene,
    modularCharacter.world.defaultMaterials,
    true
  );

  if (modelResult instanceof Error) return modelResult;
  if (modelResult instanceof ConsumableModel) return new Error("unexpected item model type");

  return modelResult;
}

function getIndexForDisplayedHolsteredSlot(
  hotswapSlots: HoldableHotswapSlot[],
  selectedIndex: number
): number {
  if (selectedIndex > 1) {
    if (hotswapSlots[1] && Object.entries(hotswapSlots[1].holdables).length) {
      return 1;
    } else {
      return 0;
    }
  } else if (selectedIndex === 1) {
    return 0;
  } else {
    return 1;
  }
}
