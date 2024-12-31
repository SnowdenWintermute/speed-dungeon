import { disposeAsyncLoadedScene } from "@/app/3d-world/utils";
import { GameWorld } from "../..";
import { iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";
import { ModularCharacter } from "@/app/3d-world/combatant-models/modular-character";

export function despawnModularCharacter(
  world: GameWorld,
  toRemove: ModularCharacter
): Error | void {
  if (!toRemove) return new Error("tried to remove a combatant model that doesn't exist");
  toRemove.rootTransformNode.dispose();
  if (toRemove.debugMeshes)
    for (const mesh of Object.values(toRemove.debugMeshes)) {
      mesh.dispose();
    }
  disposeAsyncLoadedScene(toRemove.skeleton, world.scene);
  for (const part of Object.values(toRemove.parts)) {
    disposeAsyncLoadedScene(part, world.scene);
  }

  for (const [_slotType, model] of iterateNumericEnumKeyedRecord(toRemove.equipment.wearables)) {
    if (!model) continue;
    disposeAsyncLoadedScene(model.scene, world.scene);
  }

  for (const model of Object.values(toRemove.equipment.holdables)) {
    disposeAsyncLoadedScene(model, world.scene);
  }

  toRemove.modelActionManager.removeActiveModelAction();
}
