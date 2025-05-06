import {
  Color3,
  AssetContainer,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Vector3,
  Quaternion,
  AbstractMesh,
} from "@babylonjs/core";
import { ActionEntityName, ERROR_MESSAGES, EntityId } from "@speed-dungeon/common";
import { importMesh } from "../../utils";
import { gameWorld } from "../../SceneManager";
import { ACTION_ENTITY_NAME_TO_MODEL_PATH } from "./action-entity-model-paths";
import {
  DynamicAnimationManager,
  DynamicAnimation,
} from "../model-animation-managers/dynamic-animation-manager";
import { SceneEntity } from "..";

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
    public name: ActionEntityName,
    public pointTowardEntity?: EntityId
  ) {
    super(id, assetContainer, startPosition, new Quaternion());
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

  startPointingTowardsCombatant(entityId: EntityId) {
    const combatantModelOption = gameWorld.current?.modelManager.combatantModels[entityId];
    if (!combatantModelOption) throw new Error("Tried to point at an entity with no model");

    const targetBoundingBoxCenter = combatantModelOption.getBoundingInfo().boundingBox.centerWorld;
    const forward = targetBoundingBoxCenter
      .subtract(this.movementManager.transformNode.getAbsolutePosition())
      .normalize();

    const up = Vector3.Up();
    const lookRotation: Quaternion = Quaternion.FromLookDirectionLH(forward, up);
    this.movementManager.startRotatingTowards(lookRotation, 400, () => {});
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
