import { CharacterModel } from "@/app/3d-world/scene-entities/character-models";
import { HoldableSlotType } from "@speed-dungeon/common";

export function removeHoldableModelFromCharacterModel(
  modularCharacter: CharacterModel,
  slot: HoldableSlotType
) {
  const modelOption = modularCharacter.equipment.holdables[slot];
  if (!modelOption) return;
  modelOption.cleanup({ softCleanup: false });
  delete modularCharacter.equipment.holdables[slot];
}
