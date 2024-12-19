import { HoldableHotswapSlot } from "@speed-dungeon/common";
import { ModularCharacter } from "./index.js";

export type HotswapSlotWithIndex = { index: number; slot: HoldableHotswapSlot };

export async function handleHotswapSlotChanged(
  this: ModularCharacter,
  hotswapSlots: HoldableHotswapSlot[],
  selectedIndex: number
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
}
