import { disposeAsyncLoadedScene } from "@/app/3d-world/utils";
import { GameWorld } from "../..";
import { iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";
import { CharacterModel } from "@/app/3d-world/scene-entities/character-models";

export function despawnCharacterModel(
  world: GameWorld,
  toRemove: CharacterModel
): Error | void {
  if (!toRemove) return new Error("tried to remove a combatant model that doesn't exist");

  toRemove.cosmeticEffectManager.cleanup();

  toRemove.rootTransformNode.dispose();
  if (toRemove.debugMeshes)
    for (const mesh of Object.values(toRemove.debugMeshes)) {
      mesh.dispose();
    }
  disposeAsyncLoadedScene(toRemove.skeleton);
  for (const part of Object.values(toRemove.parts)) {
    disposeAsyncLoadedScene(part);
  }

  for (const [_slotType, model] of iterateNumericEnumKeyedRecord(toRemove.equipment.wearables)) {
    if (!model) continue;
    disposeAsyncLoadedScene(model.scene);
  }

  for (const model of Object.values(toRemove.equipment.holdables)) {
    disposeAsyncLoadedScene(model);
  }
}
