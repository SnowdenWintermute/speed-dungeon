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
// import processActiveModelActions from "./process-active-model-actions";
import { AnimationManager } from "./animation-manager";
import { MonsterType } from "@speed-dungeon/common/src/monsters/monster-types";
import { MONSTER_SCALING_SIZES } from "./monster-scaling-sizes";
import processActiveModelActions from "./process-active-model-actions";
import { MutateState } from "@/stores/mutate-state";
import { GameState } from "@/stores/game-store";
import { BabylonControlledCombatantData } from "@/stores/game-store/babylon-controlled-combatant-data";

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
    public monsterType: null | MonsterType,
    public skeleton: ISceneLoaderAsyncResult,
    // public modelDomPositionRef: React.MutableRefObject<HTMLDivElement | null> | null,
    public modelDomPositionRef: HTMLDivElement | null,
    startPosition: Vector3 = Vector3.Zero(),
    startRotation: number = 0
  ) {
    this.animationManager = new AnimationManager(this.skeleton);
    while (skeleton.meshes.length > 1) skeleton.meshes.pop()!.dispose();
    const rootMesh = skeleton.meshes[0];
    if (rootMesh === undefined) throw new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_SKELETON_FILE);

    if (monsterType !== null) {
      rootMesh.scaling = Vector3.One().scale(MONSTER_SCALING_SIZES[monsterType]);
      startRotation += Math.PI;
    }

    this.rootMesh = rootMesh;
    this.rootMesh.rotate(Vector3.Up(), Math.PI / 2 + startRotation);
    this.rootMesh.position = startPosition;

    const rotation = rootMesh.rotationQuaternion;
    if (!rotation) throw new Error(ERROR_MESSAGES.GAME_WORLD.MISSING_ROTATION_QUATERNION);
    this.homeLocation = { position: this.rootMesh.position, rotation };

    // this.setShowBones();
  }

  enqueueNewModelActionsFromActionResults = enqueueNewModelActionsFromActionResults;
  startNewModelActions = startNewModelActions;
  processActiveModelActions = processActiveModelActions;

  updateDomRefPosition() {
    const boundingBox = this.getClientRectFromMesh(this.rootMesh);
    // if (this.modelDomPositionRef?.current) {
    //   this.modelDomPositionRef.current.setAttribute(
    //     "style",
    //     `height: ${boundingBox.height}px;
    //      width: ${boundingBox.width}px;
    //      top: ${boundingBox.top}px;
    //      left: ${boundingBox.left}px;`
    //   );
    // }
    if (this.modelDomPositionRef) {
      this.modelDomPositionRef.setAttribute(
        "style",
        `height: ${boundingBox.height}px;
         width: ${boundingBox.width}px;
         top: ${boundingBox.top}px;
         left: ${boundingBox.left}px;`
      );
    }
  }

  updateBoundingBox() {
    // this.rootMesh.setBoundingInfo(new BoundingInfo(Vector3.Zero(), Vector3.Zero(), Matrix.Zero()));
    // const {min, max} = this.rootMesh.getHierarchyBoundingVectors(true, (mesh) => mesh.name !== "__Root__")
    // this.rootMesh.setBoundingInfo(new BoundingInfo(min, max))
    let minimum: null | Vector3 = null;
    let maximum: null | Vector3 = null;

    for (const part of Object.values(this.parts)) {
      if (part === null) continue;
      for (const mesh of part.meshes) {
        // if (mesh.name === "__root__") continue;
        // Update root mesh bounding box
        mesh.refreshBoundingInfo({ applySkeleton: true, applyMorph: true });
        if (minimum === null) minimum = mesh.getBoundingInfo().minimum;
        if (maximum === null) maximum = mesh.getBoundingInfo().maximum;

        const partMeshBoundingInfo = mesh.getBoundingInfo();

        minimum = Vector3.Minimize(minimum, partMeshBoundingInfo.minimum);
        maximum = Vector3.Maximize(maximum, partMeshBoundingInfo.maximum);
      }
    }
    if (minimum === null || maximum === null) return console.log("no mesh bounding info found");
    this.rootMesh.setBoundingInfo(
      new BoundingInfo(minimum, maximum, this.rootMesh.getWorldMatrix())
    );
  }

  async attachPart(partCategory: ModularCharacterPartCategory, partPath: string) {
    const part = await this.world.importMesh(partPath);
    const parent = getTransformNodeByName(this.skeleton, "CharacterArmature");
    if (!this.skeleton.skeletons[0])
      return new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_SKELETON_FILE);

    for (const mesh of part.meshes) {
      // attach part
      if (!mesh.skeleton) continue;
      mesh.skeleton = this.skeleton.skeletons[0];
      mesh.parent = parent!;
    }

    part.skeletons[0]?.dispose();

    this.removePart(partCategory);

    // we need to save a reference to the part so we can dispose of it when switching to a different part
    this.parts[partCategory] = part;

    this.updateBoundingBox();
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
