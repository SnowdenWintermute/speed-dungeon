import {
  Scene,
  Engine,
  Vector3,
  ArcRotateCamera,
  SceneLoader,
  Mesh,
  DynamicTexture,
  ISceneLoaderAsyncResult,
  UniversalCamera,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { BASE_FILE_PATH } from "../combatant-models/modular-character-parts";
import { initScene } from "./init-scene";
import { CombatTurnResult, Item } from "@speed-dungeon/common";
import { NextToBabylonMessage } from "@/singletons/next-to-babylon-message-queue";
import showDebugText from "./show-debug-text";
import processMessagesFromNext from "./process-messages-from-next";
import { ModelManager } from "./model-manager";
import handleGameWorldError from "./handle-error";
import { clearFloorTexture } from "./clear-floor-texture";
import drawCharacterSlots from "./draw-character-slots";
import {
  DYNAMIC_MATERIAL_TAG,
  SavedMaterials,
  createDefaultMaterials,
} from "./materials/create-default-materials";
import { createImageCreatorScene } from "./image-creator-scene";
import spawnEquipmentModel from "../combatant-models/spawn-equipment-model";
import { calculateCompositeBoundingBox, takeScreenshot } from "../utils";
import { disposeMeshMaterials } from "./materials/utils";
import { useGameStore } from "@/stores/game-store";

export class GameWorld {
  engine: Engine;
  scene: Scene;
  camera: ArcRotateCamera | null = null;
  sun: Mesh;
  // shadowGenerator: null | ShadowGenerator = null;
  messages: NextToBabylonMessage[] = [];
  mouse: Vector3 = new Vector3(0, 1, 0);
  debug: { debugRef: React.RefObject<HTMLUListElement> | null } = { debugRef: null };
  useShadows: boolean = false;
  modelManager: ModelManager = new ModelManager(this);
  turnResultsQueue: CombatTurnResult[] = [];
  currentRoomLoaded: boolean = false;
  groundTexture: DynamicTexture;
  defaultMaterials: SavedMaterials;
  // imageCreationDefaultMaterials: SavedMaterials;
  numImagesBeingCreated: number = 0;

  constructor(
    public canvas: HTMLCanvasElement,
    debugRef: React.RefObject<HTMLUListElement>
  ) {
    // this.imageCreatorEngine = new Engine(imageCreatorCanvas, false);
    // this.imageCreatorScene = createImageCreatorScene(this.imageCreatorEngine);

    // this.engine.setHardwareScalingLevel(10); // renders at lower resolutions
    this.engine = new Engine(canvas, false);
    this.scene = new Scene(this.engine);

    this.debug.debugRef = debugRef;
    [this.camera, this.sun, this.groundTexture] = this.initScene();

    this.defaultMaterials = createDefaultMaterials(this.scene);
    // this.imageCreationDefaultMaterials = createDefaultMaterials(this.imageCreatorScene);

    // spawnTestEquipmentModels(this);

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
