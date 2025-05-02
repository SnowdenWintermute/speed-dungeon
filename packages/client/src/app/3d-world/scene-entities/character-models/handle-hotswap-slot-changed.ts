import {
  Equipment,
  HoldableHotswapSlot,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { CharacterModel } from "./index.js";
import { spawnItemModel } from "../../item-models/spawn-item-model";
import { AssetContainer } from "@babylonjs/core";
import {
  attachHoldableModelToHolsteredPosition,
  attachHoldableModelToSkeleton,
} from "./attach-holdables";
import { disposeAsyncLoadedScene } from "../../utils";

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
        const modelResult = await spawnItemModelIfNotAlready(this, equipment);
        if (modelResult instanceof Error) return modelResult;

        if (i === selectedIndex) attachHoldableModelToSkeleton(this, modelResult, slot, equipment);
        else if (i === holsteredSlotIndex)
          attachHoldableModelToHolsteredPosition(this, modelResult, slot, equipment);
      } else {
        const modelOption = this.equipment.holdables[equipment.entityProperties.id];
        console.log("disposing undisplayed hotswap models", modelOption);
        if (modelOption) disposeAsyncLoadedScene(modelOption);
        delete this.equipment.holdables[equipment.entityProperties.id];
      }
    }

    i += 1;
  }

  if (this.isIdling()) this.startIdleAnimation(500);
  else console.log("wasn't idling on hotswap change");
}

async function spawnItemModelIfNotAlready(
  modularCharacter: CharacterModel,
  equipment: Equipment
) {
  const entityId = equipment.entityProperties.id;
  let model: AssetContainer | undefined = modularCharacter.equipment.holdables[entityId];
  if (model !== undefined) return model;

  const modelResult = await spawnItemModel(
    equipment,
    modularCharacter.world.scene,
    modularCharacter.world.defaultMaterials,
    true
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
