import {
  AssetContainer,
  MeshBuilder,
  TransformNode,
  Vector3,
  Quaternion,
  AbstractMesh,
} from "@babylonjs/core";
import {
  ActionEntityBaseChildTransformNodeName,
  ActionEntityName,
  ERROR_MESSAGES,
  EntityId,
} from "@speed-dungeon/common";
import { getGameWorld } from "../../SceneManager";
import { SceneEntity } from "..";
import { ACTION_ENTITY_MODEL_FACTORIES } from "./action-entity-model-factories";

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

  findOne(entityId: EntityId): ActionEntityModel {
    const modelOption = this.models[entityId];
    if (!modelOption) throw new Error(ERROR_MESSAGES.GAME_WORLD.NO_ACTION_ENTITY_MODEL);
    return modelOption;
  }

  getAll() {
    return Object.values(this.models);
  }
}

export class ActionEntityModel extends SceneEntity {
  childTransformNodes: Partial<Record<ActionEntityBaseChildTransformNodeName, TransformNode>> = {};
  constructor(
    public id: EntityId,
    assetContainer: AssetContainer,
    startPosition: Vector3,
    public name: ActionEntityName
  ) {
    super(id, assetContainer, startPosition, new Quaternion());

    this.initChildTransformNodes();
  }

  initChildTransformNodes(): void {
    this.childTransformNodes[ActionEntityBaseChildTransformNodeName.EntityRoot] =
      this.rootTransformNode;
  }

  createDebugLines(startPosition: Vector3) {
    const sceneOption = getGameWorld().scene;
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

  customCleanup(): void {}
}

export async function spawnActionEntityModel(
  actionEntityName: ActionEntityName,
  position: Vector3
) {
  const model = await ACTION_ENTITY_MODEL_FACTORIES[actionEntityName](position);

  const parentMesh = model.meshes[0];
  if (!parentMesh) throw new Error("expected mesh was missing in imported scene");

  const transformNode = new TransformNode("");
  transformNode.position.copyFrom(parentMesh.position);
  parentMesh.setParent(transformNode);
  model.transformNodes.push(transformNode);
  return model;
}
