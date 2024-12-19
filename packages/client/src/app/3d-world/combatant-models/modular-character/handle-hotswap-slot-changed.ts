import {
  Equipment,
  HoldableHotswapSlot,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { ModularCharacter } from "./index.js";
import { spawnItemModel } from "../../item-models/spawn-item-model";
import { ISceneLoaderAsyncResult } from "@babylonjs/core";
import {
  attachHoldableModelToHolsteredPosition,
  attachHoldableModelToSkeleton,
} from "./attach-holdables";
import { disposeAsyncLoadedScene } from "../../utils";

export async function handleHotswapSlotChanged(
  this: ModularCharacter,
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
        const modelResult = await spawnItemModelIfNotAlready(this, equipment);
        if (modelResult instanceof Error) return modelResult;

        if (modelResult && i === selectedIndex)
          attachHoldableModelToSkeleton(this, modelResult, slot, equipment);
        else if (modelResult && i === holsteredSlotIndex) {
          attachHoldableModelToHolsteredPosition(this, modelResult, slot, equipment);
        }
      } else {
        const modelOption = this.equipment.holdables[equipment.entityProperties.id];
        if (modelOption) disposeAsyncLoadedScene(modelOption, this.world.scene);
        delete this.equipment.holdables[equipment.entityProperties.id];
      }
    }

    i += 1;
  }
}

async function spawnItemModelIfNotAlready(
  modularCharacter: ModularCharacter,
  equipment: Equipment
) {
  const entityId = equipment.entityProperties.id;
  let model: ISceneLoaderAsyncResult | undefined = modularCharacter.equipment.holdables[entityId];
  if (model !== undefined) return model;

  const modelResult = await spawnItemModel(
    equipment,
    modularCharacter.world.scene,
    modularCharacter.world.defaultMaterials
  );
  if (modelResult instanceof Error) return modelResult;
  modularCharacter.equipment.holdables[entityId] = modelResult;
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
