import { ISceneLoaderAsyncResult, MeshBuilder, TransformNode, Vector3 } from "@babylonjs/core";
import {
  ERROR_MESSAGES,
  EntityId,
  MOBILE_VFX_NAME_STRINGS,
  MobileVfxName,
  formatVector3,
} from "@speed-dungeon/common";
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
  constructor(
    id: EntityId,
    scene: ISceneLoaderAsyncResult,
    startPosition: Vector3,
    public name: MobileVfxName
  ) {
    const transformNode = scene.transformNodes[0];
    if (!transformNode) throw new Error("Expected transform node was missing in scene");
    super(id, scene, transformNode);
    this.movementManager = new ModelMovementManager(this.transformNode);
    console.log("INSTANTLY MOVING TO ", startPosition, MOBILE_VFX_NAME_STRINGS[name]);
    this.movementManager.instantlyMove(startPosition);
  }
}

export async function spawnMobileVfxModel(vfxName: MobileVfxName, position: Vector3) {
  const modelPath = MOBILE_VFX_NAME_TO_MODEL_PATH[vfxName];

  let model: ISceneLoaderAsyncResult;
  if (!modelPath) {
    // @TODO - organize custom mesh creators for self-made vfx
    const mesh = MeshBuilder.CreateIcoSphere("", { radius: 0.5 });
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
