import { AbstractMesh, AssetContainer, Quaternion, Vector3 } from "@babylonjs/core";
import { SkeletalAnimationManager } from "../model-animation-managers/skeletal-animation-manager";
import { SceneEntity } from "..";
import { AnimationGroup } from "@babylonjs/core";
import { ERROR_MESSAGES, Item } from "@speed-dungeon/common";

export class ItemModel extends SceneEntity<AnimationGroup, SkeletalAnimationManager> {
  constructor(
    public readonly item: Item,
    assetContainer: AssetContainer,
    public readonly isUsingUniqueMaterialInstances: boolean,
    homePosition: Vector3,
    homeRotation: Quaternion
  ) {
    super(item.entityProperties.id, assetContainer, homePosition, homeRotation);
  }

  initRootMesh(assetContainer: AssetContainer): AbstractMesh {
    if (!assetContainer.meshes[0]) throw new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_ITEM_FILE);
    return assetContainer.meshes[0];
  }

  initAnimationManager(assetContainer: AssetContainer): SkeletalAnimationManager {
    return new SkeletalAnimationManager(this.entityId, assetContainer);
  }
}
