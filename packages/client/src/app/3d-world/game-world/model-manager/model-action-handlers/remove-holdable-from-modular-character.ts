import { disposeAsyncLoadedScene } from "@/app/3d-world/utils";
import { ModularCharacter } from "@/app/3d-world/combatant-models/modular-character";

export function removeHoldableModelFromModularCharacter(
  modularCharacter: ModularCharacter,
  entityId: string,
  holdableId: string
) {
  const modelOption = modularCharacter.equipment.holdables[holdableId];
  if (!modelOption) return;
  disposeAsyncLoadedScene(modelOption);
  delete modularCharacter.equipment.holdables[entityId];
}
