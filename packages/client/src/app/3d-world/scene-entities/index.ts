import { AbstractMesh, AssetContainer, Quaternion, TransformNode, Vector3 } from "@babylonjs/core";
import { CosmeticEffectManager } from "./cosmetic-effect-manager";
import { ModelMovementManager } from "./model-movement-manager";
import { EntityId } from "@speed-dungeon/common";
import { disposeAsyncLoadedScene } from "../utils";
import { plainToInstance } from "class-transformer";
import { SkeletalAnimationManager } from "./model-animation-managers/skeletal-animation-manager";
import { DynamicAnimationManager } from "./model-animation-managers/dynamic-animation-manager";

export abstract class SceneEntity {
  public skeletalAnimationManager: SkeletalAnimationManager;
  public dynamicAnimationManager: DynamicAnimationManager;
  public movementManager: ModelMovementManager;
  public cosmeticEffectManager = new CosmeticEffectManager();
  public rootMesh: AbstractMesh;
  public rootTransformNode: TransformNode;

  public visibility: number = 0;

  constructor(
    public entityId: EntityId,
    public assetContainer: AssetContainer,
    startPosition: Vector3,
    startRotation: Quaternion
  ) {
    this.rootTransformNode = new TransformNode(`${this.entityId}-root-transform-node`);
    this.rootTransformNode.position = plainToInstance(Vector3, startPosition);
    this.movementManager = new ModelMovementManager(this.rootTransformNode);

    const rootMesh = this.initRootMesh(assetContainer);
    this.rootMesh = rootMesh;
    this.rootMesh.setParent(this.rootTransformNode);
    // this.rootMesh.position.copyFrom(Vector3.Zero());

    this.rootMesh.setPositionWithLocalVector(Vector3.Zero());

    this.rootTransformNode.rotationQuaternion = plainToInstance(Quaternion, startRotation);

    this.skeletalAnimationManager = new SkeletalAnimationManager(entityId, this.assetContainer);
    this.dynamicAnimationManager = new DynamicAnimationManager(this.assetContainer);
  }

  abstract initRootMesh(assetContainer: AssetContainer): AbstractMesh;
  abstract customCleanup(): void;

  cleanup(options: { softCleanup: boolean }) {
    if (options.softCleanup) this.softCleanup();
    else this.dispose();
  }

  private softCleanup() {
    disposeAsyncLoadedScene(this.assetContainer);
    this.cosmeticEffectManager.softCleanup();
  }

  private dispose() {
    this.customCleanup();
    this.assetContainer.dispose();
    this.rootTransformNode.dispose(false);
  }
}
