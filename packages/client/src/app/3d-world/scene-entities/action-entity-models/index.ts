import {
  Color3,
  AssetContainer,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Vector3,
  Quaternion,
  AbstractMesh,
  Scene,
} from "@babylonjs/core";
import { ActionEntityName, ERROR_MESSAGES, EntityId, Milliseconds } from "@speed-dungeon/common";
import { importMesh } from "../../utils";
import { gameWorld } from "../../SceneManager";
import { ACTION_ENTITY_NAME_TO_MODEL_PATH } from "./action-entity-model-paths";
import {
  DynamicAnimationManager,
  DynamicAnimation,
} from "../model-animation-managers/dynamic-animation-manager";
import { SceneEntity } from "..";
import { ModelMovementManager } from "../model-movement-manager";

export class ActionEntityManager {
  models: { [id: EntityId]: ActionEntityModel } = {};
  constructor() {}
  register(model: ActionEntityModel) {
    if (model instanceof ActionEntityModel) this.models[model.id] = model;
  }

  unregister(id: EntityId) {
    this.models[id]?.cleanup({ softCleanup: true });
    delete this.models[id];
  }

  get() {
    return Object.values(this.models);
  }
}

export class ActionEntityModel extends SceneEntity<DynamicAnimation, DynamicAnimationManager> {
  constructor(
    public id: EntityId,
    assetContainer: AssetContainer,
    startPosition: Vector3,
    public name: ActionEntityName
  ) {
    super(id, assetContainer, startPosition, new Quaternion());

    const sceneOption = gameWorld.current?.scene;
    this.createDebugLines(startPosition, sceneOption);
  }

  createDebugLines(startPosition: Vector3, sceneOption: undefined | Scene) {
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

  initRootMesh(assetContainer: AssetContainer): AbstractMesh {
    const rootMesh = assetContainer.meshes[0];
    if (!rootMesh) throw new Error("no meshes found");
    return rootMesh;
  }
  initAnimationManager(assetContainer: AssetContainer): DynamicAnimationManager {
    return new DynamicAnimationManager(assetContainer);
  }
  customCleanup(): void {}

  startPointingTowardsCombatant(entityId: EntityId, duration: Milliseconds) {
    const combatantModelOption = gameWorld.current?.modelManager.combatantModels[entityId];
    if (!combatantModelOption) throw new Error("Tried to point at an entity with no model");

    const targetBoundingBoxCenter = combatantModelOption.getBoundingInfo().boundingBox.centerWorld;
    // const forward = targetBoundingBoxCenter
    //   .subtract(this.movementManager.transformNode.getAbsolutePosition())
    //   .normalize();

    // const up = Vector3.Up();
    // const lookRotation: Quaternion = Quaternion.FromLookDirectionLH(forward, up);

    const newRotation = ModelMovementManager.getRotationToPointTowardToward(
      this.rootTransformNode,
      targetBoundingBoxCenter
    );

    this.movementManager.startRotatingTowards(newRotation, duration, () => {});
  }
}

export async function spawnActionEntityModel(vfxName: ActionEntityName, position: Vector3) {
  const modelPath = ACTION_ENTITY_NAME_TO_MODEL_PATH[vfxName];

  let model: AssetContainer;
  if (!modelPath) {
    switch (vfxName) {
      case ActionEntityName.IceBurst:
        {
          const mesh = MeshBuilder.CreateGoldberg("", { size: 0.35 });
          const material = new StandardMaterial("");
          material.diffuseColor = new Color3(0.2, 0.3, 0.7);
          material.alpha = 0.5;

          mesh.material = material;
          mesh.position.copyFrom(position);
          model = new AssetContainer();
          model.meshes = [mesh];
        }
        break;
      case ActionEntityName.Arrow:
      case ActionEntityName.IceBolt:
      case ActionEntityName.Explosion:
        {
          // @TODO - organize custom mesh creators for self-made vfx
          const mesh = MeshBuilder.CreateIcoSphere("", { radius: 0.5 });
          const material = new StandardMaterial("");
          material.diffuseColor = new Color3(0.7, 0.3, 0.2);
          material.alpha = 0.5;

          mesh.material = material;
          mesh.position.copyFrom(position);
          model = new AssetContainer();
          model.meshes = [mesh];
        }
        break;
    }
  } else {
    const scene = gameWorld.current?.scene;
    if (!scene) throw new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);
    model = await importMesh(modelPath, scene);
  }

  const parentMesh = model.meshes[0];
  if (!parentMesh) throw new Error("expected mesh was missing in imported scene");

  const transformNode = new TransformNode("");
  transformNode.position.copyFrom(parentMesh.position);
  parentMesh.setParent(transformNode);
  model.transformNodes.push(transformNode);
  return model;
}
