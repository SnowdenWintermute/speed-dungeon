import {
  AbstractMesh,
  BoundingInfo,
  Color4,
  ISceneLoaderAsyncResult,
  Mesh,
  Quaternion,
  Vector3,
} from "babylonjs";
import {
  disposeAsyncLoadedScene,
  getChildMeshByName,
  getTransformNodeByName,
  paintCubesOnNodes,
} from "../utils";
import { ModularCharacterPartCategory } from "./modular-character-parts";
import { GameWorld } from "../game-world";
import { ActionResult, ERROR_MESSAGES } from "@speed-dungeon/common";
import {
  CombatantModelAction,
  CombatantModelActionProgressTracker,
  CombatantModelActionType,
} from "./model-actions";
import enqueueNewModelActionsFromActionResults from "../game-world/enqueue-new-model-actions-from-action-results";
import startNewModelActions from "./start-new-model-actions";
import processActiveModelActions from "./process-active-model-actions";
import { AnimationManager } from "./animation-manager";

export class ModularCharacter {
  rootMesh: AbstractMesh;
  parts: Record<ModularCharacterPartCategory, null | ISceneLoaderAsyncResult> = {
    [ModularCharacterPartCategory.Head]: null,
    [ModularCharacterPartCategory.Torso]: null,
    [ModularCharacterPartCategory.Legs]: null,
    [ModularCharacterPartCategory.Full]: null,
  };
  actionResultsQueue: ActionResult[] = [];
  modelActionQueue: CombatantModelAction[] = [];
  activeModelActions: Partial<
    Record<CombatantModelActionType, CombatantModelActionProgressTracker>
  > = {};
  hitboxRadius: number = 0.5;
  homeLocation: {
    position: Vector3;
    rotation: Quaternion;
  };
  animationManager: AnimationManager;
  constructor(
    public entityId: string,
    public world: GameWorld,
    public skeleton: ISceneLoaderAsyncResult,
    startPosition: Vector3 = Vector3.Zero(),
    startRotation: number = 0
  ) {
    this.animationManager = new AnimationManager(this.skeleton);
    const rootMesh = skeleton.meshes[0];
    if (rootMesh === undefined) throw new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_SKELETON_FILE);
    this.rootMesh = rootMesh;
    this.rootMesh.showBoundingBox = true;
    this.rootMesh.rotate(Vector3.Up(), Math.PI / 2 + startRotation);
    this.rootMesh.position = startPosition;
    while (skeleton.meshes.length > 1) skeleton.meshes.pop()!.dispose();

    const rotation = rootMesh.rotationQuaternion;
    if (!rotation) throw new Error(ERROR_MESSAGES.GAME_WORLD.MISSING_ROTATION_QUATERNION);
    this.homeLocation = { position: this.rootMesh.position, rotation };

    // this.setShowBones();
  }

  enqueueNewModelActionsFromActionResults = enqueueNewModelActionsFromActionResults;
  startNewModelActions = startNewModelActions;
  processActiveModelActions = processActiveModelActions;

  async attachPart(partCategory: ModularCharacterPartCategory, partPath: string) {
    const part = await this.world.importMesh(partPath);
    const parent = getTransformNodeByName(this.skeleton, "CharacterArmature");
    if (!this.skeleton.skeletons[0])
      return new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_SKELETON_FILE);

    for (const mesh of part.meshes) {
      // Update root mesh bounding box
      const partMeshBoundingInfo = mesh.getBoundingInfo();
      const rootMeshBoundingInfo = this.rootMesh.getBoundingInfo();
      let newMinimum = Vector3.Minimize(rootMeshBoundingInfo.minimum, partMeshBoundingInfo.minimum);
      let newMaximum = Vector3.Maximize(rootMeshBoundingInfo.maximum, partMeshBoundingInfo.maximum);
      this.rootMesh.setBoundingInfo(
        new BoundingInfo(newMinimum, newMaximum, this.rootMesh.getWorldMatrix())
      );

      // attach part
      if (!mesh.skeleton) continue;
      mesh.skeleton = this.skeleton.skeletons[0];
      mesh.parent = parent!;
    }

    part.skeletons[0]?.dispose();

    this.removePart(partCategory);

    // we need to save a reference to the part so we can dispose of it when switching to a different part
    this.parts[partCategory] = part;
  }

  async equipWeapon(_partPath: string) {
    const weapon = await this.world.importMesh("sword.glb");
    weapon.meshes[0]?.translate(Vector3.Up(), 0.1);
    weapon.meshes[0]?.translate(Vector3.Forward(), -0.05);
    weapon.meshes[0]?.rotate(Vector3.Backward(), Math.PI / 2);
    const equipmentBone = this.skeleton.meshes[0]
      ? getChildMeshByName(this.skeleton.meshes[0], "Wrist.R")
      : undefined;
    if (equipmentBone && weapon.meshes[0]) weapon.meshes[0].parent = equipmentBone;
  }

  removePart(partCategory: ModularCharacterPartCategory) {
    disposeAsyncLoadedScene(this.parts[partCategory]);
    this.parts[partCategory] = null;
  }

  setShowBones() {
    const cubeSize = 0.02;
    const red = new Color4(255, 0, 0, 1.0);
    if (!this.skeleton.meshes[0]) return;
    const skeletonRootBone = getChildMeshByName(this.skeleton.meshes[0], "Root");
    if (skeletonRootBone !== undefined)
      paintCubesOnNodes(skeletonRootBone, cubeSize, red, this.world.scene);
  }

  // adapted from https://forum.babylonjs.com/t/get-mesh-bounding-box-position-and-size-in-2d-screen-coordinates/1058/3
  getClientRectFromMesh(mesh: Mesh | AbstractMesh): DOMRect {
    // get bounding box of the mesh
    const meshVectors = mesh.getBoundingInfo().boundingBox.vectors;

    // get the matrix and viewport needed to project the vectors onto the screen
    const worldMatrix = mesh.getWorldMatrix();
    const transformMatrix = this.world.scene.getTransformMatrix();
    const viewport = this.world.scene.activeCamera!.viewport;

    // loop though all the vectors and project them against the current camera viewport to get a set of coordinates
    const coordinates = meshVectors.map((v) => {
      const proj = Vector3.Project(v, worldMatrix, transformMatrix, viewport);
      proj.x = proj.x * this.world.canvas.clientWidth;
      proj.y = proj.y * this.world.canvas.clientHeight;
      return proj;
    });

    if (!coordinates[0]) throw new Error("no coordinates on that mesh");
    const extent = {
      minX: coordinates[0].x,
      maxX: coordinates[0].x,
      minY: coordinates[0].y,
      maxY: coordinates[0].y,
    };

    coordinates.forEach((current, i) => {
      if (i === 0) return;
      if (current.x < extent.minX) extent.minX = current.x;
      if (current.x > extent.maxX) extent.maxX = current.x;
      if (current.y < extent.minY) extent.minY = current.y;
      if (current.y > extent.maxY) extent.maxY = current.y;
    });
    const { minX, maxX, minY, maxY } = extent;

    return new DOMRect(minX, minY, maxX - minX, maxY - minY);
  }
}
