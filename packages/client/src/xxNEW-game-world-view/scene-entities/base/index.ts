import {
  AbstractMesh,
  AssetContainer,
  Mesh,
  MeshBuilder,
  Quaternion,
  Scene,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { CosmeticEffectManager } from "./cosmetic-effect-manager";
import {
  EntityId,
  NormalizedPercentage,
  SceneEntityChildTransformNodeIdentifier,
  SceneEntityChildTransformNodeIdentifierWithDuration,
  SceneEntityIdentifier,
  SceneEntityType,
  getQuaternionAngleDifference,
} from "@speed-dungeon/common";
import { plainToInstance } from "class-transformer";
import { GameWorldView } from "../..";
import { SceneEntityMovementManager } from "./scene-entity-movement-manager";
import { SkeletalAnimationManager } from "./scene-entity-animation-manager/skeletal-animation-manager";
import { DynamicAnimationManager } from "./scene-entity-animation-manager/dynamic-animation-manager";
import { getChildMeshByName } from "@/xxNEW-game-world-view/utils";
import { FloatingMessageService } from "@/client-application/event-log/floating-messages-service";

/** The base class for most "3d models" */
export abstract class SceneEntity {
  public skeletalAnimationManager: SkeletalAnimationManager;
  public dynamicAnimationManager: DynamicAnimationManager;
  public movementManager: SceneEntityMovementManager;
  public cosmeticEffectManager = new CosmeticEffectManager(this);
  public rootMesh: AbstractMesh;
  public rootTransformNode: TransformNode;

  protected visibility: NormalizedPercentage = 0;

  constructor(
    public entityId: EntityId,
    private scene: Scene,
    public assetContainer: AssetContainer,
    public floatingMessagesService: FloatingMessageService,
    startPosition: Vector3,
    startRotation: Quaternion
  ) {
    this.rootTransformNode = new TransformNode(`${this.entityId}-root-transform-node`);
    this.rootTransformNode.position = plainToInstance(Vector3, startPosition);
    this.movementManager = new SceneEntityMovementManager(this.rootTransformNode);

    const rootMesh = this.initRootMesh(assetContainer);
    this.rootMesh = rootMesh;
    this.rootMesh.setParent(this.rootTransformNode);
    // this.rootMesh.position.copyFrom(Vector3.Zero());

    this.rootMesh.setPositionWithLocalVector(Vector3.Zero());

    this.rootTransformNode.rotationQuaternion = plainToInstance(Quaternion, startRotation);

    this.skeletalAnimationManager = new SkeletalAnimationManager(
      entityId,
      this.assetContainer,
      this.floatingMessagesService
    );
    this.dynamicAnimationManager = new DynamicAnimationManager(this.assetContainer);
  }

  abstract customCleanup(): void;
  abstract initChildTransformNodes(): void;

  initRootMesh(assetContainer: AssetContainer): AbstractMesh {
    const rootMesh = assetContainer.meshes[0];
    if (!rootMesh) {
      throw new Error("no meshes found");
    }
    return rootMesh;
  }

  setVisibility(visibility: NormalizedPercentage) {
    this.visibility = visibility;
    this.iterMeshes().forEach((mesh) => (mesh.visibility = this.visibility));
  }

  iterMeshes() {
    return this.assetContainer.meshes;
  }

  getVisibility = () => this.visibility;

  static createTransformNodeChildOfBone(
    rootMesh: Mesh | AbstractMesh,
    name: string,
    boneName: string
  ) {
    const bone = getChildMeshByName(rootMesh, boneName);
    if (bone === undefined) {
      return;
    }
    const newTransformNode = new TransformNode(name);
    newTransformNode.setParent(bone);
    newTransformNode.setPositionWithLocalVector(Vector3.Zero());
    newTransformNode.rotationQuaternion = new Quaternion();
    return newTransformNode;
  }

  static getFromIdentifier(identifier: SceneEntityIdentifier, gameWorldView: GameWorldView) {
    const { type } = identifier;

    switch (type) {
      case SceneEntityType.ActionEntityModel: {
        return gameWorldView.actionEntitySceneEntityRegistry.requireById(identifier.entityId);
      }
      case SceneEntityType.CharacterModel: {
        return gameWorldView.combatantSceneEntityRegistry.requireById(identifier.entityId);
      }
      case SceneEntityType.CharacterEquipmentModel: {
        const combatantEntityWithHoldable = gameWorldView.combatantSceneEntityRegistry.requireById(
          identifier.characterModelId
        );
        const { slot } = identifier;
        return combatantEntityWithHoldable.equipmentManager.requireHoldableModelInSlot(slot);
      }
    }
  }

  static getChildTransformNodeFromIdentifier(
    identifier: SceneEntityChildTransformNodeIdentifier,
    gameWorldView: GameWorldView
  ): TransformNode {
    const { sceneEntityIdentifier, transformNodeName } = identifier;

    const sceneEntity = SceneEntity.getFromIdentifier(sceneEntityIdentifier, gameWorldView);

    // @ts-expect-error it can't seem to figure out that our nested tagged type guarantees the correct transformNodeName type
    return sceneEntity.childTransformNodes[transformNodeName];
  }

  lockRotationToFaceToward(
    gameWorldView: GameWorldView,
    identifierWithDuration: SceneEntityChildTransformNodeIdentifierWithDuration | null
  ) {
    if (identifierWithDuration === null) {
      this.movementManager.lookingAt = null;
      return;
    }

    const { identifier, duration } = identifierWithDuration;

    const targetTransformNode = SceneEntity.getChildTransformNodeFromIdentifier(
      identifier,
      gameWorldView
    );

    const targetRotation = SceneEntityMovementManager.getRotationToPointTowardToward(
      this.rootTransformNode,
      targetTransformNode.getAbsolutePosition()
    );

    const currentRotation =
      this.rootTransformNode.rotationQuaternion ||
      Quaternion.FromEulerAngles(
        this.rootTransformNode.rotation.x,
        this.rootTransformNode.rotation.y,
        this.rootTransformNode.rotation.z
      );

    const angleDifference = getQuaternionAngleDifference(currentRotation, targetRotation);

    const alignmentSpeed = duration ? angleDifference / duration : 0;

    this.movementManager.lookingAt = {
      target: targetTransformNode,
      alignmentSpeed,
      isLocked: false,
    };
  }

  startPointingTowardEntity(
    gameWorldView: GameWorldView,
    identifierWithDuration: SceneEntityChildTransformNodeIdentifierWithDuration | null
  ) {
    if (identifierWithDuration === null) {
      // @TODO, change how movement managers deal with their trackers so they can only be rotating and translating
      // toward one thing respectively, that way we can cancel it here
      return;
    }
    const { identifier, duration } = identifierWithDuration;

    const targetTransformNode = SceneEntity.getChildTransformNodeFromIdentifier(
      identifier,
      gameWorldView
    );
    const targetPosition = targetTransformNode.getAbsolutePosition();

    const newRotation = SceneEntityMovementManager.getRotationToPointTowardToward(
      this.rootTransformNode,
      targetPosition
    );

    if (duration === 0) {
      this.movementManager.transformNode.rotationQuaternion = newRotation;
    } else {
      this.movementManager.startRotatingTowards(newRotation, duration, () => {
        /**/
      });
    }
  }

  cleanup(options: { softCleanup: boolean }) {
    if (options.softCleanup) this.softCleanup();
    else this.dispose();
  }

  private softCleanup() {
    if (this.cosmeticEffectManager.hasActiveEffects()) {
      this.setVisibility(0);
      this.cosmeticEffectManager.softCleanup(() => {
        this.dispose();
      });
    } else {
      this.dispose();
    }
  }

  private dispose() {
    this.customCleanup();
    this.assetContainer.dispose();
    this.rootTransformNode.dispose(false);
  }

  createDebugLines(startPosition: Vector3) {
    const sceneOption = this.scene;
    const start = startPosition;
    const positiveZ = startPosition.add(new Vector3(0, 0, 1));

    const positiveZline = MeshBuilder.CreateLines(
      "line",
      {
        points: [start, positiveZ],
      },
      sceneOption
    );
    const negativeZ = startPosition.add(new Vector3(0, 0, -1));
    const negativeZline = MeshBuilder.CreateLines(
      "line",
      {
        points: [start, negativeZ],
      },
      sceneOption
    );

    positiveZline.setPositionWithLocalVector(Vector3.Zero());
    positiveZline.setParent(this.rootTransformNode);
    negativeZline.setPositionWithLocalVector(Vector3.Zero());
    negativeZline.setParent(this.rootTransformNode);

    const testMesh = MeshBuilder.CreateBox("", { size: 0.1 });
    testMesh.setParent(this.rootTransformNode);
    testMesh.setPositionWithLocalVector(Vector3.Zero());
  }
}
