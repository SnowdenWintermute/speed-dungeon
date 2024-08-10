import {
  Scene,
  Engine,
  Vector3,
  ArcRotateCamera,
  SceneLoader,
  AnimationGroup,
  ShadowGenerator,
} from "babylonjs";
import "babylonjs-loaders";
import { ModularCharacter } from "../combatant-models/modular-character";
import {
  BASE_FILE_PATH,
  ModularCharacterPart,
  SKELETONS,
} from "../combatant-models/modular-character-parts";
import { initScene } from "./init-scene";
import { CombatantSpecies } from "@speed-dungeon/common";
import handleMessageFromNext from "./handle-message-from-next";
import { NextToBabylonMessage } from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";
import { MutateState } from "@/stores/mutate-state";
import { GameState } from "@/stores/game-store";

export class GameWorld {
  scene: Scene;
  engine: Engine;
  characterAnimations: AnimationGroup[] = [];
  camera: ArcRotateCamera | null = null;
  shadowGenerator: null | ShadowGenerator = null;
  messages: NextToBabylonMessage[] = [];
  mouse: Vector3 = new Vector3(0, 1, 0);
  debug: { debugRef: React.RefObject<HTMLDivElement> | null } = { debugRef: null };
  useShadows: boolean = false;
  constructor(
    canvas: HTMLCanvasElement,
    mutateGameState: MutateState<GameState>,
    debugRef: React.RefObject<HTMLDivElement>
  ) {
    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);
    this.debug.debugRef = debugRef;
    [this.camera, this.shadowGenerator] = this.initScene();

    this.engine.runRenderLoop(() => {
      if (this.debug.debugRef?.current) {
        const fps = `<div>${this.engine.getFps().toFixed()}</div>`;

        if (!this.camera) return;
        const cameraBeta = `<div>camera beta: ${this.camera.beta.toFixed(2)}</div>`;
        const cameraAlpha = `<div>camera alpha: ${this.camera.alpha.toFixed(2)}</div>`;
        const cameraRadius = `<div>camera radius: ${this.camera.radius.toFixed(2)}</div>`;
        const cameraTarget = `<div>camera target:
          x ${this.camera.target.x.toFixed(2)}, 
          y ${this.camera.target.y.toFixed(2)}, 
          z ${this.camera.target.z.toFixed(2)}</div>`;
        this.debug.debugRef.current.innerHTML = [
          fps,
          cameraBeta,
          cameraAlpha,
          cameraRadius,
          cameraTarget,
        ].join("");
      }
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
    const sceneResult = await SceneLoader.ImportMeshAsync("", BASE_FILE_PATH, path, this.scene);
    if (this.useShadows)
      for (const mesh of sceneResult.meshes) this.shadowGenerator?.addShadowCaster(mesh, true);
    return sceneResult;
  }

  async spawnCharacterModel(
    combatantSpecies: CombatantSpecies,
    parts: ModularCharacterPart[],
    startPosition: Vector3 = new Vector3(0, 0, 0),
    startRotation: number = 0
  ): Promise<ModularCharacter> {
    const skeleton = await this.importMesh(SKELETONS[combatantSpecies]!);
    skeleton.meshes[0].rotate(Vector3.Up(), Math.PI / 2 + startRotation);
    skeleton.meshes[0].position = startPosition;

    const modularCharacter = new ModularCharacter(this, skeleton);

    for (const part of parts) {
      await modularCharacter.attachPart(part.category, part.assetPath);
    }

    if (combatantSpecies === CombatantSpecies.Humanoid) await modularCharacter.equipWeapon("");

    return modularCharacter;
  }
}
