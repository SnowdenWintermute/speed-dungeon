import {
  Scene,
  Engine,
  Vector3,
  ArcRotateCamera,
  SceneLoader,
  ShadowGenerator,
  Mesh,
} from "babylonjs";
import "babylonjs-loaders";
import { BASE_FILE_PATH } from "../combatant-models/modular-character-parts";
import { initScene } from "./init-scene";
import { CombatTurnResult } from "@speed-dungeon/common";
import handleMessageFromNext from "./handle-message-from-next";
import { NextToBabylonMessage } from "@/stores/next-babylon-messaging-store/next-to-babylon-messages";
import { MutateState } from "@/stores/mutate-state";
import { GameState } from "@/stores/game-store";
import showDebugText from "./show-debug-text";
import processMessagesFromNext from "./process-messages-from-next";
import { NextBabylonMessagingState } from "@/stores/next-babylon-messaging-store";
import { ModelManager } from "./model-manager";
import enqueueNewActionResultsFromTurnResults from "./enqueue-new-action-results-from-turn-results";
import handleGameWorldError from "./handle-error";

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
  constructor(
    public canvas: HTMLCanvasElement,
    public mutateGameState: MutateState<GameState>,
    public mutateNextBabylonMessagingState: MutateState<NextBabylonMessagingState>,
    debugRef: React.RefObject<HTMLDivElement>
  ) {
    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);
    this.debug.debugRef = debugRef;
    [this.camera, this.shadowGenerator, this.sun] = this.initScene();

    this.engine.runRenderLoop(() => {
      this.showDebugText();
      this.processMessagesFromNext();
      this.modelManager.startProcessingNewMessages();

      if (this.currentRoomLoaded) {
        const turnResultsErrorOption = this.enqueueNewActionResultsFromTurnResults();
        if (turnResultsErrorOption instanceof Error) console.error(turnResultsErrorOption);
      }

      for (const combatantModel of Object.values(this.modelManager.combatantModels)) {
        combatantModel.updateDomRefPosition();
        if (this.currentRoomLoaded) combatantModel.enqueueNewModelActionsFromActionResults(this);
        combatantModel.startNewModelActions(mutateGameState);
        combatantModel.processActiveModelActions(this);
        combatantModel.animationManager.handleCompletedAnimations();
        combatantModel.animationManager.stepAnimationTransitionWeights();
      }

      this.scene.render();
    });

    window.setTimeout(() => {
      this.engine.stopRenderLoop();
      let lastTime = new Date().getTime();
      const fpsLabel = document.getElementsByClassName("fps")[0];
      window.setInterval(() => {
        this.showDebugText();
        this.processMessagesFromNext();
        this.modelManager.startProcessingNewMessages();

        if (this.currentRoomLoaded) {
          const turnResultsErrorOption = this.enqueueNewActionResultsFromTurnResults();
          if (turnResultsErrorOption instanceof Error) console.error(turnResultsErrorOption);
        }

        for (const combatantModel of Object.values(this.modelManager.combatantModels)) {
          combatantModel.updateDomRefPosition();
          if (this.currentRoomLoaded) combatantModel.enqueueNewModelActionsFromActionResults(this);
          combatantModel.startNewModelActions(mutateGameState);
          combatantModel.processActiveModelActions(this);
          combatantModel.animationManager.handleCompletedAnimations();
          combatantModel.animationManager.stepAnimationTransitionWeights();
        }
        this.scene.render();
        let curTime = new Date().getTime();
        // fpsLabel.innerHTML = (1000 / (curTime - lastTime)).toFixed() + " fps";
        lastTime = curTime;
      }, 1000 / 2);
    }, 100);
  }

  handleError = handleGameWorldError;
  initScene = initScene;
  handleMessageFromNext = handleMessageFromNext;
  showDebugText = showDebugText;
  processMessagesFromNext = processMessagesFromNext;
  enqueueNewActionResultsFromTurnResults = enqueueNewActionResultsFromTurnResults;

  async importMesh(path: string) {
    const sceneResult = await SceneLoader.ImportMeshAsync("", BASE_FILE_PATH, path, this.scene);
    if (this.useShadows)
      for (const mesh of sceneResult.meshes) this.shadowGenerator?.addShadowCaster(mesh, true);
    return sceneResult;
  }
}
