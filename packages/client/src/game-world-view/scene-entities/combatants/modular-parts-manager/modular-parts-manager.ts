import {
  AssetId,
  ClientAppAssetService,
  ERROR_MESSAGES,
  NormalizedPercentage,
  invariant,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { AssetContainer, Scene, TransformNode } from "@babylonjs/core";
import { CharacterModelPartCategory } from "./modular-parts";
import { CombatantSceneEntity } from "..";
import { loadAssetContainerIntoScene } from "@/xxNEW-game-world-view/utils/load-asset-container-into-scene";
import { requireTransformNodeByName } from "@/xxNEW-game-world-view/utils";
import { ARMATURE_ROOT_BONE_NAME } from "@/xxNEW-game-world-view/game-world-view-consts";

export class CombatantSceneEntityModularPartsManager {
  parts: Record<CharacterModelPartCategory, null | AssetContainer> = {
    [CharacterModelPartCategory.Head]: null,
    [CharacterModelPartCategory.Torso]: null,
    [CharacterModelPartCategory.Legs]: null,
    [CharacterModelPartCategory.Full]: null,
  };
  private armatureRoot: TransformNode;

  constructor(
    private assetService: ClientAppAssetService,
    private sceneEntity: CombatantSceneEntity
  ) {
    const { assetContainer } = this.sceneEntity;
    this.armatureRoot = requireTransformNodeByName(assetContainer, ARMATURE_ROOT_BONE_NAME);
  }

  async attachPart(scene: Scene, partCategory: CharacterModelPartCategory, assetId: AssetId) {
    const { assetContainer } = this.sceneEntity;

    const part = await loadAssetContainerIntoScene(this.assetService, scene, assetId);

    if (!assetContainer.skeletons[0]) {
      throw new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_SKELETON_FILE);
    }

    for (const mesh of part.meshes) {
      // attach part
      if (mesh.skeleton) mesh.skeleton = assetContainer.skeletons[0];
      mesh.visibility = this.sceneEntity.getVisibility();
      invariant(parent !== undefined);
      mesh.parent = this.armatureRoot;
    }

    part.skeletons[0]?.dispose();

    this.removePart(partCategory);

    // we need to save a reference to the part so we can dispose of it when switching to a different part
    this.parts[partCategory] = part;

    this.sceneEntity.bounding.updateBox();

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
    for (const part of Object.values(this.parts)) {
      part?.dispose();
    }
  }
}
