import {
  Scene,
  Engine,
  Vector3,
  ArcRotateCamera,
  Mesh,
  DynamicTexture,
  NodeMaterial,
  Constants,
  InputBlock,
  Camera,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { initScene } from "./init-scene";
import { CombatTurnResult } from "@speed-dungeon/common";
import { NextToBabylonMessage } from "@/singletons/next-to-babylon-message-queue";
import showDebugText from "./show-debug-text";
import processMessagesFromNext from "./process-messages-from-next";
import { ModelManager } from "./model-manager";
import handleGameWorldError from "./handle-error";
import { clearFloorTexture } from "./clear-floor-texture";
import drawCharacterSlots from "./draw-character-slots";
import { SavedMaterials, createDefaultMaterials } from "./materials/create-default-materials";
import { ImageManager } from "./image-manager";
import pixelationShader from "./pixelationNodeMaterial.json";

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
  imageManager: ImageManager = new ImageManager();

  constructor(
    public canvas: HTMLCanvasElement,
    debugRef: React.RefObject<HTMLUListElement>
  ) {
    // this.imageCreatorEngine = new Engine(imageCreatorCanvas, false);
    // this.imageCreatorScene = createImageCreatorScene(this.imageCreatorEngine);

    this.engine = new Engine(canvas, true);
    // this.engine.setHardwareScalingLevel(10); // renders at lower resolutions
    this.scene = new Scene(this.engine);

    this.debug.debugRef = debugRef;
    [this.camera, this.sun, this.groundTexture] = this.initScene();
    this.defaultMaterials = createDefaultMaterials(this.scene);

    // PIXELATION FILTER
    pixelate(this.camera, this.scene);
    //

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

export function pixelate(camera: Camera, scene: Scene, value: number = 3.8) {
  const nodeMaterial = NodeMaterial.Parse(pixelationShader, scene);
  nodeMaterial.build();
  const postProcess = nodeMaterial.createPostProcess(camera, 1.0, Constants.TEXTURE_LINEAR_LINEAR);

  if (!postProcess) return;

  postProcess.samples = 4;

  const pixelateX = nodeMaterial.getBlockByName("pixelateSizeX") as InputBlock;
  const pixelateY = nodeMaterial.getBlockByName("pixelateSizeY") as InputBlock;
  if (pixelateX) pixelateX.value = value;
  if (pixelateY) pixelateY.value = value;
}
