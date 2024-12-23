import { disposeAsyncLoadedScene } from "@/app/3d-world/utils";
import { ModelManager } from "..";

export function removeHoldableModelFromModularCharacter(
  modelManager: ModelManager,
  entityId: string,
  holdableId: string
) {
  const modularCharacter = modelManager.combatantModels[entityId];
  const modelOption = modularCharacter?.equipment.holdables[holdableId];
  if (!modelOption) return;
  disposeAsyncLoadedScene(modelOption, modelManager.world.scene);
  delete modularCharacter.equipment.holdables[entityId];
}
