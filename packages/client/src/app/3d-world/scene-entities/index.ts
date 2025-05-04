import { AbstractMesh, AssetContainer, TransformNode, Vector3 } from "@babylonjs/core";
import { CosmeticEffectManager } from "./cosmetic-effect-manager";
import { AnimationManager } from "./model-animation-managers";
import { ModelMovementManager } from "./model-movement-manager";
import { EntityId } from "@speed-dungeon/common";
import { disposeAsyncLoadedScene } from "../utils";

export abstract class SceneEntity<T, U extends AnimationManager<T>> {
  public animationManager: U;
  public movementManager: ModelMovementManager;
  public cosmeticEffectManager = new CosmeticEffectManager();
  private rootMesh: AbstractMesh;
  private rootTransformNode: TransformNode;
  public visibility: number = 0;
  constructor(
    public entityId: EntityId,
    private assetContainer: AssetContainer,
    startPosition: Vector3
  ) {
    this.rootMesh = this.initRootMesh(this.assetContainer);

    this.rootTransformNode = new TransformNode(`${this.entityId}-root-transform-node`);
    this.rootTransformNode.position = startPosition;

    this.rootMesh.setParent(this.rootTransformNode);
    this.rootMesh.position.copyFrom(Vector3.Zero());

    this.movementManager = new ModelMovementManager(this.rootTransformNode);
    this.animationManager = this.initAnimationManager(this.assetContainer);
    this.movementManager.instantlyMove(startPosition);
  }

  abstract initRootMesh(assetContainer: AssetContainer): AbstractMesh;
  abstract initAnimationManager(assetContainer: AssetContainer): U;

  cleanup(options: { softCleanup: boolean }) {
    if (options.softCleanup) this.softCleanup();
    else this.dispose();
  }

  private softCleanup() {
    disposeAsyncLoadedScene(this.assetContainer);
    this.cosmeticEffectManager.softCleanup();
  }

  private dispose() {
    disposeAsyncLoadedScene(this.assetContainer);
    this.rootTransformNode.dispose(false);
  }
}
