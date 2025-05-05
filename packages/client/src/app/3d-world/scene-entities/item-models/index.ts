import { AbstractMesh, AssetContainer, Quaternion, Vector3 } from "@babylonjs/core";
import { SkeletalAnimationManager } from "../model-animation-managers/skeletal-animation-manager";
import { SceneEntity } from "..";
import { AnimationGroup } from "@babylonjs/core";

export class ItemModel extends SceneEntity<AnimationGroup, SkeletalAnimationManager> {
  constructor(
    public entityId: string,
    public assetContainer: AssetContainer,
    public modelDomPositionElement: HTMLDivElement | null,
    homePosition: Vector3,
    homeRotation: Quaternion
  ) {
    super(entityId, assetContainer, homePosition, homeRotation);
  }

  initRootMesh(assetContainer: AssetContainer): AbstractMesh {
    throw new Error("Method not implemented.");
  }
  initAnimationManager(assetContainer: AssetContainer): SkeletalAnimationManager {
    throw new Error("Method not implemented.");
  }
}
