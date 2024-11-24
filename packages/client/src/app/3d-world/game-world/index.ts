import {
  Scene,
  Engine,
  Vector3,
  ArcRotateCamera,
  SceneLoader,
  ShadowGenerator,
  Mesh,
  DynamicTexture,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { BASE_FILE_PATH } from "../combatant-models/modular-character-parts";
import { initScene } from "./init-scene";
import { CombatTurnResult } from "@speed-dungeon/common";
import { NextToBabylonMessage, NextToBabylonMessageTypes, nextToBabylonMessageQueue } from "@/singletons/next-to-babylon-message-queue";
import showDebugText from "./show-debug-text";
import processMessagesFromNext from "./process-messages-from-next";
import { ModelManager } from "./model-manager";
import handleGameWorldError from "./handle-error";
import { clearFloorTexture } from "./clear-floor-texture";
import drawCharacterSlots from "./draw-character-slots";
import spawnTestEquipmentModels from "./spawn-test-equipment-models";

export class GameWorld {
  scene: Scene;
  engine: Engine;
  camera: ArcRotateCamera | null = null;
  sun: Mesh;
  shadowGenerator: null | ShadowGenerator = null;
  messages: NextToBabylonMessage[] = [];
  mouse: Vector3 = new Vector3(0, 1, 0);
  debug: { debugRef: React.RefObject<HTMLUListElement> | null } = { debugRef: null };
  useShadows: boolean = false;
  modelManager: ModelManager = new ModelManager(this);
  turnResultsQueue: CombatTurnResult[] = [];
  currentRoomLoaded: boolean = false;
  groundTexture: DynamicTexture;
  constructor(
    public canvas: HTMLCanvasElement,
    debugRef: React.RefObject<HTMLUListElement>
  ) {
    this.engine = new Engine(canvas, true);
    // this.engine.setHardwareScalingLevel(10); // renders at lower resolutions
    this.scene = new Scene(this.engine);
    this.debug.debugRef = debugRef;
    [this.camera, this.shadowGenerator, this.sun, this.groundTexture] = this.initScene();



    spawnTestEquipmentModels(this);

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
