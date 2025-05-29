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
  NormalizedPercentage,
  SceneEntityChildTransformNodeIdentifier,
  SceneEntityIdentifier,
  SceneEntityType,
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

  protected visibility: NormalizedPercentage = 0;

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

  setVisibility(visibility: NormalizedPercentage) {
    this.visibility = visibility;
    this.assetContainer.meshes.forEach((mesh) => (mesh.visibility = this.visibility));
  }

  getVisibility = () => this.visibility;

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

  static getFromIdentifier(identifier: SceneEntityIdentifier) {
    const { type } = identifier;
    let toReturn;

    switch (type) {
      case SceneEntityType.ActionEntityModel:
        const actionEntity = getGameWorld().actionEntityManager.findOne(identifier.entityId);
        toReturn = actionEntity;
        break;
      case SceneEntityType.CharacterModel:
        const combatantEntity = getGameWorld().modelManager.findOne(identifier.entityId);
        toReturn = combatantEntity;
        break;
      case SceneEntityType.CharacterEquipmentModel:
        const combatantEntityWithHoldable = getGameWorld().modelManager.findOne(
          identifier.characterModelId
        );
        const { slot } = identifier;
        const holdableModelOption =
          combatantEntityWithHoldable.equipmentModelManager.getHoldableModelInSlot(slot);
        if (!holdableModelOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_EQUIPMENT_MODEL);
        toReturn = holdableModelOption;
        break;
    }

    if (!toReturn) throw new Error("No scene entity found");
    return toReturn;
  }

  static getChildTransformNodeFromIdentifier(
    identifier: SceneEntityChildTransformNodeIdentifier
  ): TransformNode {
    const { sceneEntityIdentifier, transformNodeName } = identifier;

    const sceneEntity = SceneEntity.getFromIdentifier(sceneEntityIdentifier);

    // it can't seem to figure out that our nested tagged type guarantees the correct transformNodeName type
    // @ts-ignore
    return sceneEntity.childTransformNodes[transformNodeName];
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
