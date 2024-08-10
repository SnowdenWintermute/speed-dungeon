import { Scene, Engine, Vector3, ArcRotateCamera, SceneLoader, AnimationGroup } from "babylonjs";
import "babylonjs-loaders";
import { ModularCharacter } from "../modular-character";
import {
  BASE_FILE_PATH,
  ModularCharacterPart,
  SKELETONS,
} from "../modular-character/modular-character-parts";
import { initScene } from "./init-scene";
import { CombatantSpecies } from "@speed-dungeon/common";
import { NextBabylonMessagingState } from "@/stores/next-babylon-messaging-store";

export class GameWorld {
  scene: Scene;
  engine: Engine;
  characterAnimations: AnimationGroup[] = [];
  camera: ArcRotateCamera | null = null;
  mouse: Vector3 = new Vector3(0, 1, 0);
  constructor(
    private canvas: HTMLCanvasElement,
    nextBabylonMessagingState: NextBabylonMessagingState
  ) {
    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);
    this.camera = this.initScene();

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  initScene = initScene;

  async importMesh(path: string) {
    return SceneLoader.ImportMeshAsync("", BASE_FILE_PATH, path, this.scene);
  }

  async loadCharacterModel(
    legsPath: string,
    torsoPath: string,
    headPath: string,
    startPosition: Vector3 = new Vector3(0, 0, 0),
    startRotation: number = 0
  ): Promise<ModularCharacter> {
    const skeleton = await this.importMesh(SKELETONS[CombatantSpecies.Humanoid]!);
    skeleton.meshes[0].rotate(Vector3.Up(), Math.PI / 2 + startRotation);
    skeleton.meshes[0].position = startPosition;

    const modularCharacter = new ModularCharacter(this, skeleton);

    await modularCharacter.attachPart(ModularCharacterPart.Head, headPath);
    await modularCharacter.attachPart(ModularCharacterPart.Torso, torsoPath);
    await modularCharacter.attachPart(ModularCharacterPart.Legs, legsPath);

    await modularCharacter.equipWeapon("");

    return modularCharacter;
  }
}
