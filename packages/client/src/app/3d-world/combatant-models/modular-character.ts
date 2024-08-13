import { AbstractMesh, Color4, ISceneLoaderAsyncResult, Quaternion, Vector3 } from "babylonjs";
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
import processActiveModelActions from "../game-world/process-active-model-actions";
import startNewModelActions from "./start-new-model-actions";

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
  constructor(
    public entityId: string,
    public world: GameWorld,
    public skeleton: ISceneLoaderAsyncResult,
    startPosition: Vector3 = Vector3.Zero(),
    startRotation: number = 0
  ) {
    const rootMesh = skeleton.meshes[0];
    if (rootMesh === undefined) throw new Error(ERROR_MESSAGES.GAME_WORLD.INCOMPLETE_SKELETON_FILE);
    this.rootMesh = rootMesh;
    this.rootMesh.rotate(Vector3.Up(), Math.PI / 2 + startRotation);
    this.rootMesh.position = startPosition;
    while (skeleton.meshes.length > 1) skeleton.meshes.pop()!.dispose();

    const rotation = rootMesh.rotationQuaternion;
    if (!rotation) throw new Error(ERROR_MESSAGES.GAME_WORLD.MISSING_ROTATION_QUATERNION);
    this.homeLocation = { position: this.rootMesh.position, rotation };

    skeleton.animationGroups[0]?.stop();
    this.getAnimationGroupByName("Idle")?.start(true);

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

  getAnimationGroupByName(name: string) {
    for (let index = 0; index < this.skeleton.animationGroups.length; index++) {
      if (!this.skeleton.animationGroups[index]) continue;
      if (this.skeleton.animationGroups[index]!.name === name) {
        return this.skeleton.animationGroups[index];
      }
    }
  }
}
