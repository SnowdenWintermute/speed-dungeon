import { ISceneLoaderAsyncResult, TransformNode, Vector3 } from "@babylonjs/core";
import { ERROR_MESSAGES, EntityId, MobileVfxName } from "@speed-dungeon/common";
import { disposeAsyncLoadedScene, importMesh } from "../utils";
import { ModelMovementManager } from "../model-movement-manager";
import { gameWorld } from "../SceneManager";
import { MOBILE_VFX_NAME_TO_MODEL_PATH } from "./vfx-model-paths";

export class VfxManager {
  mobile: { [id: EntityId]: MobileVfxModel } = {};
  constructor() {}
  register(vfx: MobileVfxModel) {
    if (vfx instanceof MobileVfxModel) this.mobile[vfx.id] = vfx;
  }

  unregister(id: EntityId) {
    this.mobile[id]?.dispose();
    delete this.mobile[id];
  }

  getMobile() {
    return Object.values(this.mobile);
  }
}

export class VfxModel {
  constructor(
    public readonly id: EntityId,
    protected scene: ISceneLoaderAsyncResult,
    protected transformNode: TransformNode
  ) {}

  dispose() {
    disposeAsyncLoadedScene(this.scene);
  }
}

export class MobileVfxModel extends VfxModel {
  public movementManager: ModelMovementManager;
  constructor(id: EntityId, scene: ISceneLoaderAsyncResult, startPosition: Vector3) {
    const transformNode = scene.transformNodes[0];
    if (!transformNode) throw new Error("Expected transform node was missing in scene");
    super(id, scene, transformNode);
    this.movementManager = new ModelMovementManager(this.transformNode);
    this.movementManager.instantlyMove(startPosition);
  }
}

export async function spawnMobileVfxModel(vfxName: MobileVfxName) {
  const modelPath = MOBILE_VFX_NAME_TO_MODEL_PATH[vfxName];
  const scene = gameWorld.current?.scene;
  if (!scene) throw new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);
  const model = await importMesh(modelPath, scene);
  const parentMesh = model.meshes[0];
  if (!parentMesh) throw new Error("expected mesh was missing in imported scene");

  const transformNode = new TransformNode("arrow");
  transformNode.position.copyFrom(parentMesh.position);
  parentMesh.setParent(transformNode);
  model.transformNodes.push(transformNode);
  return model;
}
