import { Color4, ISceneLoaderAsyncResult, Vector3 } from "babylonjs";
import {
  disposeAsyncLoadedScene,
  getChildMeshByName,
  getTransformNodeByName,
  paintCubesOnNodes,
} from "../utils";
import { ModularCharacterPartCategory } from "./modular-character-parts";
import { GameWorld } from "../game-world";

export class ModularCharacter {
  skeleton: ISceneLoaderAsyncResult;
  parts: Record<ModularCharacterPartCategory, null | ISceneLoaderAsyncResult> = {
    [ModularCharacterPartCategory.Head]: null,
    [ModularCharacterPartCategory.Torso]: null,
    [ModularCharacterPartCategory.Legs]: null,
    [ModularCharacterPartCategory.Full]: null,
  };
  world: GameWorld;
  constructor(world: GameWorld, skeleton: ISceneLoaderAsyncResult) {
    this.world = world;

    this.skeleton = skeleton;
    while (skeleton.meshes.length > 1) skeleton.meshes.pop()!.dispose();

    skeleton.animationGroups[0].stop();
    this.getAnimationGroupByName("Idle")?.start(true);

    // this.setShowBones();
  }

  async attachPart(partCategory: ModularCharacterPartCategory, partPath: string) {
    const part = await this.world.importMesh(partPath);
    const parent = getTransformNodeByName(this.skeleton, "CharacterArmature");

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
    weapon.meshes[0].translate(Vector3.Up(), 0.1);
    weapon.meshes[0].translate(Vector3.Forward(), -0.05);
    weapon.meshes[0].rotate(Vector3.Backward(), Math.PI / 2);
    const equipmentBone = getChildMeshByName(this.skeleton.meshes[0], "Wrist.R");
    if (equipmentBone) weapon.meshes[0].parent = equipmentBone;
  }

  removePart(partCategory: ModularCharacterPartCategory) {
    disposeAsyncLoadedScene(this.parts[partCategory]);
    this.parts[partCategory] = null;
  }

  setShowBones() {
    const cubeSize = 0.02;
    const red = new Color4(255, 0, 0, 1.0);
    const skeletonRootBone = getChildMeshByName(this.skeleton.meshes[0], "Root");
    if (skeletonRootBone !== undefined)
      paintCubesOnNodes(skeletonRootBone, cubeSize, red, this.world.scene);
  }

  getAnimationGroupByName(name: string) {
    for (let index = 0; index < this.skeleton.animationGroups.length; index++) {
      if (this.skeleton.animationGroups[index].name === name) {
        return this.skeleton.animationGroups[index];
      }
    }
  }
}
