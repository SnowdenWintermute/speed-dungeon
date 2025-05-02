import {
  Color3,
  AssetContainer,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { ActionEntityName, ERROR_MESSAGES, EntityId } from "@speed-dungeon/common";
import { disposeAsyncLoadedScene, importMesh } from "../../utils";
import { ModelMovementManager } from "../model-movement-manager";
import { gameWorld } from "../../SceneManager";
import { ACTION_ENTITY_NAME_TO_MODEL_PATH } from "./action-entity-model-paths";
import { CosmeticEffectManager } from "../cosmetic-effect-manager";
import { DynamicAnimationManager } from "../model-animation-managers/dynamic-animation-manager";

export class ActionEntityManager {
  models: { [id: EntityId]: ActionEntityModel } = {};
  constructor() {}
  register(model: ActionEntityModel) {
    if (model instanceof ActionEntityModel) this.models[model.id] = model;
  }

  unregister(id: EntityId) {
    this.models[id]?.softCleanup();
    delete this.models[id];
  }

  get() {
    return Object.values(this.models);
  }
}

export class ActionEntityModel {
  public movementManager: ModelMovementManager;
  public animationManager: DynamicAnimationManager;
  public cosmeticEffectManager = new CosmeticEffectManager();
  private transformNode: TransformNode;
  // public animationManager: AnimationManager
  constructor(
    public id: EntityId,
    public scene: AssetContainer,
    startPosition: Vector3,
    public name: ActionEntityName,
    public pointTowardEntity?: EntityId
  ) {
    const modelRootTransformNode = scene.transformNodes[0];
    if (!modelRootTransformNode) throw new Error("Expected transform node was missing in scene");

    this.transformNode = new TransformNode("");
    this.transformNode.setAbsolutePosition(startPosition);
    modelRootTransformNode.setParent(this.transformNode);
    modelRootTransformNode.setPositionWithLocalVector(Vector3.Zero());

    this.movementManager = new ModelMovementManager(this.transformNode);
    this.animationManager = new DynamicAnimationManager(this.scene);
    // this.animationManager = new AnimationManager()
    this.movementManager.instantlyMove(startPosition);
  }

  softCleanup() {
    disposeAsyncLoadedScene(this.scene);
    this.cosmeticEffectManager.softCleanup();
  }

  cleanup() {
    this.dispose();
  }

  dispose() {
    disposeAsyncLoadedScene(this.scene);
    this.transformNode.dispose(false);
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
          model = {
            meshes: [mesh],
            particleSystems: [],
            skeletons: [],
            animationGroups: [],
            transformNodes: [],
            geometries: [],
            lights: [],
            spriteManagers: [],
          };
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
          model = {
            meshes: [mesh],
            particleSystems: [],
            skeletons: [],
            animationGroups: [],
            transformNodes: [],
            geometries: [],
            lights: [],
            spriteManagers: [],
          };
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
