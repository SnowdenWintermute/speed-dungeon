import { AbstractMesh, AssetContainer, Quaternion, Vector3 } from "@babylonjs/core";
import { SkeletalAnimationManager } from "../model-animation-managers/skeletal-animation-manager";
import { SceneEntity } from "..";
import { AnimationGroup } from "@babylonjs/core";
import { ERROR_MESSAGES, Item } from "@speed-dungeon/common";
import { getChildMeshByName } from "../../utils";

export class ItemModel extends SceneEntity<AnimationGroup, SkeletalAnimationManager> {
  constructor(
    public readonly item: Item,
    assetContainer: AssetContainer,
    public readonly isUsingUniqueMaterialInstances: boolean
  ) {
    super(item.entityProperties.id, assetContainer, Vector3.Zero(), new Quaternion());

    this.rootMesh.rotate(Vector3.Backward(), Math.PI);

    // if (!assetContainer.meshes[0]) throw new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_ITEM_FILE);
    // const rootBone = getChildMeshByName(assetContainer.meshes[0], "Handle");
    // if (rootBone) {
    //   let asAbstractMesh = rootBone as AbstractMesh;
    //   console.log("found bone named handle in item model");
    //   asAbstractMesh.setParent(this.rootTransformNode);
    //   asAbstractMesh.setPositionWithLocalVector(Vector3.Zero());
    // }
  }

  initRootMesh(assetContainer: AssetContainer): AbstractMesh {
    if (!assetContainer.meshes[0]) throw new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_ITEM_FILE);
    return assetContainer.meshes[0];
  }

  initAnimationManager(assetContainer: AssetContainer): SkeletalAnimationManager {
    return new SkeletalAnimationManager(this.entityId, assetContainer);
  }

  customCleanup(): void {
    //
  }
}
