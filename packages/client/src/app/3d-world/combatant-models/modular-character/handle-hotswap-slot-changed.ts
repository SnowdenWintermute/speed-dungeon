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
  // keep list of holdables by entity id
  // on equipment change or hotswap action
  // go through list of holdables on combatant
  //

  let i = 0;
  console.log(
    "selectedIndex:",
    selectedIndex,
    "index to display as holstered: ",
    getIndexForDisplayedHolsteredSlot(hotswapSlots, selectedIndex)
  );
  // make sure models that are supposed to exist do
  // despawn models that shouldn't exist
  const holsteredSlotIndex = getIndexForDisplayedHolsteredSlot(hotswapSlots, selectedIndex);
  for (const hotswapSlot of Object.values(hotswapSlots)) {
    for (const [slot, equipment] of iterateNumericEnumKeyedRecord(hotswapSlot.holdables)) {
      if (i === selectedIndex || i === holsteredSlotIndex) {
        const modelResult = await spawnItemModelIfNotAlready(this, equipment);
        if (modelResult instanceof Error) return modelResult;

        console.log(
          "current index considering: ",
          i,
          "should holster:",
          holsteredSlotIndex,
          "hasModel:",
          !!modelResult
        );
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

  // if missing a model that is within the first 2 hotswap indices, spawn it
  // attach and position holdables to appropriate locations
  // go through list of holdables on modular character
  // if a model exists that is not within the first 2 hotswap slots, despawn it
  // from 1->2 or 2->1 : swap held with holstered
  // from 3->1|2 : delete held, spawn swapped models if not holstered, else move holstered to held and spawn holstered from whichever 1 or 2 is now not held
  // from 1|2->3 : delete held and spawn 3
  // if slot switching away from is NOT in the first two indices, despawn the models
  // because we've nowhere to show models beyond a stowed and equipped set
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
