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
  RenderTargetTexture,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { initScene } from "./init-scene";
import { CombatTurnResult } from "@speed-dungeon/common";
import { NextToBabylonMessage } from "@/singletons/next-to-babylon-message-queue";
import updateDebugText from "./model-manager/update-debug-text";
import processMessagesFromNext from "./process-messages-from-next";
import { ModelManager } from "./model-manager";
import handleGameWorldError from "./handle-error";
import { clearFloorTexture } from "./clear-floor-texture";
import drawCharacterSlots from "./draw-character-slots";
import { SavedMaterials, createDefaultMaterials } from "./materials/create-default-materials";
import { ImageManager } from "./image-manager";
import pixelationShader from "./pixelationNodeMaterial.json";

export const LAYER_MASK_1 = 0x10000000;
export const LAYER_MASK_ALL = 0xffffffff;

export class GameWorld {
  engine: Engine;
  scene: Scene;
  camera: ArcRotateCamera | null = null;
  portraitCamera: ArcRotateCamera;
  sun: Mesh;
  // shadowGenerator: null | ShadowGenerator = null;
  messages: NextToBabylonMessage[] = [];
  mouse: Vector3 = new Vector3(0, 1, 0);
  debug: { debugRef: React.RefObject<HTMLUListElement> | null } = { debugRef: null };
  useShadows: boolean = false;
  modelManager: ModelManager = new ModelManager(this);
  turnResultsQueue: CombatTurnResult[] = [];
  groundTexture: DynamicTexture;
  defaultMaterials: SavedMaterials;
  // imageCreationDefaultMaterials: SavedMaterials;
  numImagesBeingCreated: number = 0;
  imageManager: ImageManager = new ImageManager();
  portraitRenderTarget: RenderTargetTexture;

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
    this.camera.layerMask = LAYER_MASK_ALL;
    this.defaultMaterials = createDefaultMaterials(this.scene);
    this.scene.activeCamera = this.camera;

    this.portraitCamera = new ArcRotateCamera(
      "portrait camera",
      0,
      0,
      0,
      Vector3.Zero(),
      this.scene
    );

    this.portraitCamera.minZ = 0;
    this.portraitCamera.layerMask = LAYER_MASK_1;

    this.portraitRenderTarget = new RenderTargetTexture(
      "portraitTexture",
      { width: 100, height: 100 },
      this.scene
    );

    this.portraitCamera.outputRenderTarget = this.portraitRenderTarget;

    // PIXELATION FILTER
    // pixelate(this.camera, this.scene);
    //

    // spawnTestEquipmentModels(this);

    this.engine.runRenderLoop(() => {
      this.updateGameWorld();
      this.scene.render();
    });

    // this.startLimitedFramerateRenderLoop(10, 3000);
  }

  updateGameWorld() {
    this.updateDebugText();
    this.processMessagesFromNext();

    if (
      !this.modelManager.modelActionQueue.isProcessing &&
      this.modelManager.modelActionQueue.messages.length
    )
      this.modelManager.modelActionQueue.processMessages();

    for (const combatantModel of Object.values(this.modelManager.combatantModels)) {
      combatantModel.highlightManager.updateHighlight();
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
  updateDebugText = updateDebugText;
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
