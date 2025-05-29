import { getTransformNodeByName, importMesh } from "@/app/3d-world/utils";
import { CharacterModelPartCategory } from "./modular-character-parts";
import { BONE_NAMES, BoneName } from "../skeleton-structure-variables";
import {
  ERROR_MESSAGES,
  NormalizedPercentage,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { AssetContainer } from "@babylonjs/core";
import { getGameWorld } from "@/app/3d-world/SceneManager";
import { CharacterModel } from "..";

export class ModularCharacterPartsModelManager {
  parts: Record<CharacterModelPartCategory, null | AssetContainer> = {
    [CharacterModelPartCategory.Head]: null,
    [CharacterModelPartCategory.Torso]: null,
    [CharacterModelPartCategory.Legs]: null,
    [CharacterModelPartCategory.Full]: null,
  };

  constructor(private characterModel: CharacterModel) {}

  async attachPart(partCategory: CharacterModelPartCategory, partPath: string) {
    const { assetContainer } = this.characterModel;

    const part = await importMesh(partPath, getGameWorld().scene);
    const parent = getTransformNodeByName(assetContainer, BONE_NAMES[BoneName.Armature]);

    if (!assetContainer.skeletons[0])
      return new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_SKELETON_FILE);

    for (const mesh of part.meshes) {
      // attach part
      if (mesh.skeleton) mesh.skeleton = assetContainer.skeletons[0];
      mesh.visibility = this.characterModel.getVisibility();
      mesh.parent = parent!;
    }

    part.skeletons[0]?.dispose();

    this.removePart(partCategory);

    // we need to save a reference to the part so we can dispose of it when switching to a different part
    this.parts[partCategory] = part;

    this.characterModel.updateBoundingBox();

    return part;
  }

  removePart(partCategory: CharacterModelPartCategory) {
    this.parts[partCategory]?.dispose();
    this.parts[partCategory] = null;
  }

  setVisibility(visibility: NormalizedPercentage) {
    for (const [_partCategory, scene] of iterateNumericEnumKeyedRecord(this.parts)) {
      scene?.meshes.forEach((mesh) => {
        mesh.visibility = visibility;
      });
    }
  }

  cleanup() {
    for (const part of Object.values(this.parts)) part?.dispose();
  }
}
