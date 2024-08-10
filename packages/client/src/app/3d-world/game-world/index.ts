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
import handleMessageFromNext from "./handle-message-from-next";
import { NextToBabylonMessage } from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";

export class GameWorld {
  scene: Scene;
  engine: Engine;
  characterAnimations: AnimationGroup[] = [];
  camera: ArcRotateCamera | null = null;
  messages: NextToBabylonMessage[] = [];
  mouse: Vector3 = new Vector3(0, 1, 0);
  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);
    this.camera = this.initScene();

    this.engine.runRenderLoop(() => {
      while (this.messages.length > 0) {
        const message = this.messages.pop();
        if (message !== undefined) this.handleMessageFromNext(message);
      }
      this.scene.render();
    });
  }

  initScene = initScene;
  handleMessageFromNext = handleMessageFromNext;

  async importMesh(path: string) {
    return SceneLoader.ImportMeshAsync("", BASE_FILE_PATH, path, this.scene);
  }

  async spawnCharacterModel(
    headPath: string,
    torsoPath: string,
    legsPath: string,
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
