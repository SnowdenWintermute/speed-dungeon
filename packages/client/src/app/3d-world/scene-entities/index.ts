import {
  AbstractMesh,
  AssetContainer,
  Mesh,
  Quaternion,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { CosmeticEffectManager } from "./cosmetic-effect-manager";
import { ModelMovementManager } from "./model-movement-manager";
import {
  ERROR_MESSAGES,
  EntityId,
  SceneEntityChildTransformNodeIdentifier,
  SceneEntityChildTransformNodeType,
} from "@speed-dungeon/common";
import { disposeAsyncLoadedScene, getChildMeshByName } from "../utils";
import { plainToInstance } from "class-transformer";
import { SkeletalAnimationManager } from "./model-animation-managers/skeletal-animation-manager";
import { DynamicAnimationManager } from "./model-animation-managers/dynamic-animation-manager";
import { getGameWorld } from "../SceneManager";

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
  abstract initChildTransformNodes(): void;

  static createTransformNodeChildOfBone(
    rootMesh: Mesh | AbstractMesh,
    name: string,
    boneName: string
  ) {
    const bone = getChildMeshByName(rootMesh, boneName);
    if (!bone) return;
    const newTransformNode = new TransformNode(name);
    newTransformNode.setParent(bone);
    newTransformNode.setPositionWithLocalVector(Vector3.Zero());
    newTransformNode.rotationQuaternion = new Quaternion();
    return newTransformNode;
  }

  static getChildTransformNodeFromIdentifier(identifier: SceneEntityChildTransformNodeIdentifier) {
    const { type, entityId, transformNodeName } = identifier;

    let toReturn;

    switch (type) {
      case SceneEntityChildTransformNodeType.ActionEntityBase:
        const actionEntity = getGameWorld().actionEntityManager.findOne(entityId);
        toReturn = actionEntity.childTransformNodes[transformNodeName];
        break;
      case SceneEntityChildTransformNodeType.CombatantBase:
        const combatantEntity = getGameWorld().modelManager.findOne(entityId);
        toReturn = combatantEntity.childTransformNodes[transformNodeName];
        break;
      case SceneEntityChildTransformNodeType.CombatantEquippedHoldable:
        const combatantEntityWithHoldable = getGameWorld().modelManager.findOne(entityId);
        const { holdableSlot } = identifier;
        const holdableModelOption = combatantEntityWithHoldable.equipment.holdables[holdableSlot];
        if (!holdableModelOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_EQUIPMENT_MODEL);
        toReturn = holdableModelOption.childTransformNodes[transformNodeName];
        break;
    }

    if (!toReturn) throw new Error("No transform node found");
    return toReturn;
  }

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
