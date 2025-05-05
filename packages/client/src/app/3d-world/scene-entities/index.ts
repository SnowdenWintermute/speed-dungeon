import { AbstractMesh, AssetContainer, Quaternion, TransformNode, Vector3 } from "@babylonjs/core";
import { CosmeticEffectManager } from "./cosmetic-effect-manager";
import { AnimationManager } from "./model-animation-managers";
import { ModelMovementManager } from "./model-movement-manager";
import { EntityId } from "@speed-dungeon/common";
import { disposeAsyncLoadedScene } from "../utils";
import { plainToInstance } from "class-transformer";

export abstract class SceneEntity<T, U extends AnimationManager<T>> {
  public animationManager: U;
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
    this.rootMesh.position.copyFrom(Vector3.Zero());

    this.rootTransformNode.rotationQuaternion = plainToInstance(Quaternion, startRotation);

    this.animationManager = this.initAnimationManager(this.assetContainer);
  }

  abstract initRootMesh(assetContainer: AssetContainer): AbstractMesh;
  abstract initAnimationManager(assetContainer: AssetContainer): U;
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
