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
import { CombatTurnResult, CombatantSpecies } from "@speed-dungeon/common";
import handleMessageFromNext from "./handle-message-from-next";
import { NextToBabylonMessage } from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";
import { MutateState } from "@/stores/mutate-state";
import { GameState } from "@/stores/game-store";
import showDebugText from "./show-debug-text";

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
  combatantModels: { [entityId: string]: ModularCharacter } = {};
  turnResultsQueue: CombatTurnResult[] = [];
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
      this.showDebugText();
      while (this.messages.length > 0) {
        const message = this.messages.pop();
        if (message !== undefined) {
          const maybeError = this.handleMessageFromNext(message);
          if (maybeError instanceof Error) {
            console.error(maybeError.message);
            this.engine.stopRenderLoop();
          }
        }
      }
      // EACH COMBATANT MODEL:
      // start new model actions or return to idle
      // process active model actions
      this.scene.render();
    });
  }

  initScene = initScene;
  handleMessageFromNext = handleMessageFromNext;
  showDebugText = showDebugText;

  async importMesh(path: string) {
    const sceneResult = await SceneLoader.ImportMeshAsync("", BASE_FILE_PATH, path, this.scene);
    if (this.useShadows)
      for (const mesh of sceneResult.meshes) this.shadowGenerator?.addShadowCaster(mesh, true);
    return sceneResult;
  }

  async spawnCharacterModel(
    this: GameWorld,
    entityId: string,
    combatantSpecies: CombatantSpecies,
    parts: ModularCharacterPart[],
    startPosition?: Vector3,
    startRotation?: number
  ): Promise<ModularCharacter> {
    const skeleton = await this.importMesh(SKELETONS[combatantSpecies]!);
    const modularCharacter = new ModularCharacter(this, skeleton, startPosition, startRotation);

    for (const part of parts) {
      await modularCharacter.attachPart(part.category, part.assetPath);
    }

    if (combatantSpecies === CombatantSpecies.Humanoid) await modularCharacter.equipWeapon("");

    this.combatantModels[entityId] = modularCharacter;

    return modularCharacter;
  }
}
