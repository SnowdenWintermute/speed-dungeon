import {
  Color3,
  ISceneLoaderAsyncResult,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { ERROR_MESSAGES, EntityId, MobileVfxName } from "@speed-dungeon/common";
import { disposeAsyncLoadedScene, importMesh } from "../utils";
import { ModelMovementManager } from "../model-movement-manager";
import { gameWorld } from "../SceneManager";
import { MOBILE_VFX_NAME_TO_MODEL_PATH } from "./vfx-model-paths";
import { DynamicAnimationManager } from "../combatant-models/animation-manager/dynamic-animation-manager";
import { ClientOnlyVfxManager } from "../client-only-vfx-manager";

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
  public animationManager: DynamicAnimationManager;
  public clientOnlyVfxManager = new ClientOnlyVfxManager();
  // public animationManager: AnimationManager
  constructor(
    id: EntityId,
    scene: ISceneLoaderAsyncResult,
    startPosition: Vector3,
    public name: MobileVfxName,
    public pointTowardEntity?: EntityId
  ) {
    const transformNode = scene.transformNodes[0];
    if (!transformNode) throw new Error("Expected transform node was missing in scene");
    super(id, scene, transformNode);
    this.movementManager = new ModelMovementManager(this.transformNode);
    this.animationManager = new DynamicAnimationManager(this.scene);
    // this.animationManager = new AnimationManager()
    this.movementManager.instantlyMove(startPosition);
  }
}

export async function spawnMobileVfxModel(vfxName: MobileVfxName, position: Vector3) {
  const modelPath = MOBILE_VFX_NAME_TO_MODEL_PATH[vfxName];

  let model: ISceneLoaderAsyncResult;
  if (!modelPath) {
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
