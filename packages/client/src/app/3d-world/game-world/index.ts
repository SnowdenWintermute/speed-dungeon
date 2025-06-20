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
  GroundMesh,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { initScene } from "./init-scene";
import { IdGenerator, InputLock } from "@speed-dungeon/common";
import { updateDebugText } from "./model-manager/update-debug-text";
import { ModelManager } from "./model-manager";
import handleGameWorldError from "./handle-error";
import { clearFloorTexture } from "./clear-floor-texture";
import drawCharacterSlots from "./draw-character-slots";
import { SavedMaterials, createDefaultMaterials } from "./materials/create-default-materials";
import { ImageManager } from "./image-manager";
import pixelationShader from "./pixelationNodeMaterial.json";
import { ReplayTreeManager } from "./replay-tree-manager";
import { ActionEntityManager } from "../scene-entities/action-entity-models";
import { useGameStore } from "@/stores/game-store";
import { testParticleSystem } from "./testing-particle-systems";

export const LAYER_MASK_1 = 0x10000000;
export const LAYER_MASK_ALL = 0xffffffff;

export class GameWorld {
  engine: Engine;
  scene: Scene;
  camera: ArcRotateCamera | null = null;
  portraitCamera: ArcRotateCamera;
  sun: Mesh;
  ground: GroundMesh;
  // shadowGenerator: null | ShadowGenerator = null;
  mouse: Vector3 = new Vector3(0, 1, 0);
  debug: { debugRef: React.RefObject<HTMLUListElement> | null } = { debugRef: null };
  useShadows: boolean = false;
  modelManager: ModelManager = new ModelManager(this);
  groundTexture: DynamicTexture;
  defaultMaterials: SavedMaterials;
  // imageCreationDefaultMaterials: SavedMaterials;
  numImagesBeingCreated: number = 0;
  imageManager: ImageManager = new ImageManager();
  portraitRenderTarget: RenderTargetTexture;
  replayTreeManager = new ReplayTreeManager();
  idGenerator = new IdGenerator();
  actionEntityManager = new ActionEntityManager();
  tickCounter: number = 0;

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
    [this.camera, this.sun, this.groundTexture, this.ground] = this.initScene();
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

    this.engine.runRenderLoop(() => {
      this.updateGameWorld();
      this.scene.render();
    });

    // testingSounds();

    // const particleSystems = testParticleSystem(this.scene);
    // particleSystems.forEach((system) => system.start());

    // this.startLimitedFramerateRenderLoop(5, 3000);
  }

  updateGameWorld() {
    this.tickCounter += 1;
    this.updateDebugText();
    if (this.replayTreeManager.currentTreeCompleted()) {
      this.replayTreeManager.startNext();
    }
    this.replayTreeManager.process();

    if (
      !this.modelManager.modelActionQueue.isProcessing &&
      this.modelManager.modelActionQueue.messages.length
    )
      this.modelManager.modelActionQueue.processMessages();

    for (const actionEntityModel of this.actionEntityManager.getAll()) {
      actionEntityModel.movementManager.processActiveActions();
      actionEntityModel.dynamicAnimationManager.playing?.animationGroup?.animateScene(
        actionEntityModel.dynamicAnimationManager.assetContainer
      );
      actionEntityModel.dynamicAnimationManager.handleCompletedAnimations();
      actionEntityModel.dynamicAnimationManager.stepAnimationTransitionWeights();
    }

    for (const combatantModel of Object.values(this.modelManager.combatantModels)) {
      combatantModel.highlightManager.updateHighlight();

      combatantModel.movementManager.processActiveActions();
      combatantModel.skeletalAnimationManager.stepAnimationTransitionWeights();
      combatantModel.skeletalAnimationManager.handleCompletedAnimations();
      combatantModel.updateDomRefPosition();
    }
  }

  handleError = handleGameWorldError;
  initScene = initScene;
  clearFloorTexture = clearFloorTexture;
  drawCharacterSlots = drawCharacterSlots;
  updateDebugText = updateDebugText;

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
