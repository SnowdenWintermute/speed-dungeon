import { CharacterModel } from "@/app/3d-world/scene-entities/character-models";

export function removeHoldableModelFromCharacterModel(
  modularCharacter: CharacterModel,
  entityId: string,
  holdableId: string
) {
  const modelOption = modularCharacter.equipment.holdables[holdableId];
  if (!modelOption) return;
  modelOption.cleanup({ softCleanup: false });
  delete modularCharacter.equipment.holdables[entityId];
}
