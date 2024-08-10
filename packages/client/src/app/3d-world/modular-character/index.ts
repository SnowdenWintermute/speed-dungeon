import { Color4, ISceneLoaderAsyncResult, Vector3 } from "babylonjs";
import {
  disposeAsyncLoadedScene,
  getChildMeshByName,
  getTransformNodeByName,
  paintCubesOnNodes,
} from "../utils";
import { ModularCharacterPart } from "./modular-character-parts";
import { GameWorld } from "../game-world";

export class ModularCharacter {
  skeleton: ISceneLoaderAsyncResult;
  parts: Record<ModularCharacterPart, null | ISceneLoaderAsyncResult> = {
    [ModularCharacterPart.Head]: null,
    [ModularCharacterPart.Torso]: null,
    [ModularCharacterPart.Legs]: null,
  };
  world: GameWorld;
  constructor(world: GameWorld, skeleton: ISceneLoaderAsyncResult) {
    this.world = world;

    this.skeleton = skeleton;
    while (skeleton.meshes.length > 1) skeleton.meshes.pop()!.dispose();

    skeleton.animationGroups[0].stop();
    skeleton.animationGroups[4].start(true);

    this.setShowBones(true);
  }

  async attachPart(partCategory: ModularCharacterPart, partPath: string) {
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
    weapon.meshes[0].translate(Vector3.Up(), 0.13);
    weapon.meshes[0].translate(Vector3.Forward(), -0.03);
    weapon.meshes[0].rotate(Vector3.Backward(), Math.PI / 2);
    const equipmentBone = getChildMeshByName(this.skeleton.meshes[0], "Wrist.R");
    if (equipmentBone) weapon.meshes[0].parent = equipmentBone;

    const weapon2 = await this.world.importMesh("sword.glb");
    weapon2.meshes[0].translate(Vector3.Up(), 0.13);
    weapon2.meshes[0].translate(Vector3.Forward(), -0.03);
    weapon2.meshes[0].rotate(Vector3.Backward(), Math.PI / 2);
    const equipmentBone2 = getChildMeshByName(this.skeleton.meshes[0], "Wrist.L");
    if (equipmentBone2) weapon2.meshes[0].parent = equipmentBone2;
  }

  removePart(partCategory: ModularCharacterPart) {
    disposeAsyncLoadedScene(this.parts[partCategory]);
    this.parts[partCategory] = null;
  }

  setShowBones(bool: boolean) {
    const cubeSize = 0.01;
    const red = new Color4(255, 0, 0, 1.0);
    const skeletonRootBone = getChildMeshByName(this.skeleton.meshes[0], "Root");
    if (skeletonRootBone !== undefined)
      paintCubesOnNodes(skeletonRootBone, cubeSize, red, this.world.scene);
  }
}
