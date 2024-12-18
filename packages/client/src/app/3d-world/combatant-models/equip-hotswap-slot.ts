import {
  CombatantEquipment,
  EquipmentSlotType,
  HoldableHotswapSlot,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { ModularCharacter } from "./modular-character";
import { spawnItemModel } from "./spawn-item-models";
import {
  attachEquipmentModelToHolstered,
  attachEquipmentModelToSkeleton,
} from "./attach-equipment-model-to-skeleton";
import { useGameStore } from "@/stores/game-store";
import { disposeAsyncLoadedScene } from "../utils";

export type HotswapSlotWithIndex = { index: number; slot: HoldableHotswapSlot };

export async function handleEquipHotswapSlot(
  this: ModularCharacter,
  slotSwitchingAwayFrom: HotswapSlotWithIndex,
  newlySelectedSlot: HotswapSlotWithIndex
) {
  // keep list of holdables by entity id
  // on equipment change or hotswap action
  // go through list of holdables on combatant
  // if missing a model that is within the first 2 hotswap indices, spawn it
  // attach and position holdables to appropriate locations
  // go through list of holdables on modular character
  // if a model exists that is not within the first 2 hotswap slots, despawn it

  // from 1->2 or 2->1 : swap held with holstered
  // from 3->1|2 : delete held, spawn swapped models if not holstered, else move holstered to held and spawn holstered from whichever 1 or 2 is now not held
  // from 1|2->3 : delete held and spawn 3

  // if slot switching away from is NOT in the first two indices, despawn the models
  // because we've nowhere to show models beyond a stowed and equipped set
  if (newlySelectedSlot.index < 2 && slotSwitchingAwayFrom.index < 2) {
    await swapVisibleHotswapSlotModels(this, newlySelectedSlot, slotSwitchingAwayFrom);
  } else if (newlySelectedSlot.index > 1 && slotSwitchingAwayFrom.index < 2) {
    // 3->1|2

    // delete held,
    if (this.equipment.equippedHoldables)
      for (const [_slotType, modelOption] of iterateNumericEnumKeyedRecord(
        this.equipment.equippedHoldables.models
      )) {
        if (!modelOption) continue;
        disposeAsyncLoadedScene(modelOption.scene, this.world.scene);
      }
    this.equipment.equippedHoldables = null;

    const previouslyHolstered = this.equipment.holsteredHoldables;
    if (newlySelectedSlot.index === previouslyHolstered?.slotIndex) {
      // if currently holstered slot index is newly selected
      // - move models to held
      this.equipment.equippedHoldables = previouslyHolstered;
      for (const [slot, equipment] of iterateNumericEnumKeyedRecord(
        newlySelectedSlot.slot.holdables
      )) {
        const model = previouslyHolstered.models[slot];
        if (!model) continue;
        attachEquipmentModelToSkeleton(
          this,
          model.scene,
          { type: EquipmentSlotType.Holdable, slot },
          equipment
        );
      }
    } else {
      // spawn the models
      // set as held
    }

    const slotIndexToSpawnAsHolstered = newlySelectedSlot.index === 0 ? 1 : 0;
    const characterResult = useGameStore.getState().getCharacter(this.entityId);
    if (characterResult instanceof Error) return console.error(characterResult);
    const slotToSpawnAsHolsteredOption = CombatantEquipment.getHoldableHotswapSlots(
      characterResult.combatantProperties
    )[slotIndexToSpawnAsHolstered];
    if (!slotToSpawnAsHolsteredOption) return console.error("expected slot not found");
    // - spawn models for index 1 or 2 as holstered
  }
}

async function swapVisibleHotswapSlotModels(
  modularCharacter: ModularCharacter,
  newlySelectedSlot: HotswapSlotWithIndex,
  slotSwitchingAwayFrom: HotswapSlotWithIndex
) {
  const previouslyHolstered = modularCharacter.equipment.holsteredHoldables;
  const previouslyHeld = modularCharacter.equipment.equippedHoldables;
  modularCharacter.equipment.holsteredHoldables = null;
  modularCharacter.equipment.equippedHoldables = null;
  modularCharacter.equipment.equippedHoldables = previouslyHolstered;
  modularCharacter.equipment.holsteredHoldables = previouslyHeld;

  for (const [slot, equipment] of iterateNumericEnumKeyedRecord(newlySelectedSlot.slot.holdables)) {
    let model = modularCharacter.equipment.equippedHoldables?.models[slot];

    if (!model) {
      console.log("spawning model for newly swapped to item");
      const equipmentModelResult = await spawnItemModel(
        equipment,
        modularCharacter.world.scene,
        modularCharacter.world.defaultMaterials
      );
      if (equipmentModelResult instanceof Error)
        return console.log("equipment model error: ", equipmentModelResult.message);
      model = { entityId: equipment.entityProperties.id, scene: equipmentModelResult };
    }

    console.log("attaching newly swapped item to skeleton");
    attachEquipmentModelToSkeleton(
      modularCharacter,
      model.scene,
      { type: EquipmentSlotType.Holdable, slot },
      equipment
    );

    if (!modularCharacter.equipment.equippedHoldables)
      modularCharacter.equipment.equippedHoldables = {
        slotIndex: newlySelectedSlot.index,
        models: {},
      };
    modularCharacter.equipment.equippedHoldables.models[slot] = model;
  }

  for (const [slot, equipment] of iterateNumericEnumKeyedRecord(
    slotSwitchingAwayFrom.slot.holdables
  )) {
    let model = modularCharacter.equipment.holsteredHoldables?.models[slot];

    if (!model) {
      console.log("spawning model for newly holstered");
      const equipmentModelResult = await spawnItemModel(
        equipment,
        modularCharacter.world.scene,
        modularCharacter.world.defaultMaterials
      );
      if (equipmentModelResult instanceof Error)
        return console.log("equipment model error: ", equipmentModelResult.message);
      model = { entityId: equipment.entityProperties.id, scene: equipmentModelResult };
    }

    if (!modularCharacter.equipment.holsteredHoldables)
      modularCharacter.equipment.holsteredHoldables = {
        slotIndex: slotSwitchingAwayFrom.index,
        models: {},
      };
    modularCharacter.equipment.holsteredHoldables.models[slot] = model;

    console.log("attaching newly swapped item to holstered");
    attachEquipmentModelToHolstered(
      modularCharacter,
      model.scene,
      { type: EquipmentSlotType.Holdable, slot },
      equipment
    );
  }
}
