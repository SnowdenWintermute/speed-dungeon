import {
  Scene,
  Engine,
  Vector3,
  ArcRotateCamera,
  SceneLoader,
  ShadowGenerator,
  Mesh,
  ICanvasRenderingContext,
  DynamicTexture,
  GroundMesh,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { BASE_FILE_PATH } from "../combatant-models/modular-character-parts";
import { initScene } from "./init-scene";
import { CombatTurnResult } from "@speed-dungeon/common";
import { NextToBabylonMessage } from "@/singletons/next-to-babylon-message-queue";
import { MutateState } from "@/stores/mutate-state";
import { GameState } from "@/stores/game-store";
import showDebugText from "./show-debug-text";
import processMessagesFromNext from "./process-messages-from-next";
import { NextBabylonMessagingState } from "@/stores/next-babylon-messaging-store";
import { ModelManager } from "./model-manager";
import handleGameWorldError from "./handle-error";
import { clearFloorTexture } from "./clear-floor-texture";
import drawCharacterSlots from "./draw-character-slots";

export class GameWorld {
  scene: Scene;
  engine: Engine;
  camera: ArcRotateCamera | null = null;
  sun: Mesh;
  shadowGenerator: null | ShadowGenerator = null;
  messages: NextToBabylonMessage[] = [];
  mouse: Vector3 = new Vector3(0, 1, 0);
  debug: { debugRef: React.RefObject<HTMLDivElement> | null } = { debugRef: null };
  useShadows: boolean = false;
  modelManager: ModelManager = new ModelManager(this);
  turnResultsQueue: CombatTurnResult[] = [];
  currentRoomLoaded: boolean = false;
  groundTexture: DynamicTexture;
  constructor(
    public canvas: HTMLCanvasElement,
    public mutateGameState: MutateState<GameState>,
    public mutateNextBabylonMessagingState: MutateState<NextBabylonMessagingState>,
    debugRef: React.RefObject<HTMLDivElement>
  ) {
    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);
    this.debug.debugRef = debugRef;
    [this.camera, this.shadowGenerator, this.sun, this.groundTexture] = this.initScene();

    this.engine.runRenderLoop(() => {
      this.updateGameWorld();
      this.scene.render();
    });

    // this.startLimitedFramerateRenderLoop(3, 3000);
  }

  updateGameWorld() {
    this.showDebugText();
    this.processMessagesFromNext();

    // spawn/despawn models
    this.modelManager.startProcessingNewMessages();

    for (const combatantModel of Object.values(this.modelManager.combatantModels)) {
      combatantModel.modelActionManager.processActiveModelAction();
      combatantModel.animationManager.handleCompletedAnimations();
      combatantModel.animationManager.stepAnimationTransitionWeights();
      combatantModel.updateDomRefPosition();
    }
  }

  handleError = handleGameWorldError;
  initScene = initScene;
  clearFloorTexture = clearFloorTexture;
  drawCharacterSlots = drawCharacterSlots;
  showDebugText = showDebugText;
  processMessagesFromNext = processMessagesFromNext;

  async importMesh(path: string) {
    const sceneResult = await SceneLoader.ImportMeshAsync(
      "",
      BASE_FILE_PATH || "",
      path,
      this.scene
    );
    if (this.useShadows)
      for (const mesh of sceneResult.meshes) this.shadowGenerator?.addShadowCaster(mesh, true);
    return sceneResult;
  }

  startLimitedFramerateRenderLoop(fps: number, timeout: number) {
    window.setTimeout(() => {
      this.engine.stopRenderLoop();
      let lastTime = new Date().getTime();
      // const fpsLabel = document.getElementsByClassName("fps")[0];
      window.setInterval(() => {
        this.updateGameWorld();
        this.scene.render();
        let curTime = new Date().getTime();
        // fpsLabel.innerHTML = (1000 / (curTime - lastTime)).toFixed() + " fps";
        lastTime = curTime;
      }, 1000 / fps);
    }, timeout);
  }
}
