import {
  Scene,
  Engine,
  Vector3,
  ArcRotateCamera,
  SceneLoader,
  Mesh,
  DynamicTexture,
  MeshBuilder,
  ISceneLoaderAsyncResult,
  UniversalCamera,
  CreateScreenshotUsingRenderTarget,
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
import {
  calculateCompositeBoundingBox,
  disposeAsyncLoadedScene,
  getClientRectFromMesh,
  takeScreenshot,
} from "../utils";
import { disposeMeshMaterials } from "./materials/utils";

export class GameWorld {
  engine: Engine;
  scene: Scene;

  imageCreatorEngine: Engine;
  imageCreatorScene: Scene;

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
  imageCreationDefaultMaterials: SavedMaterials;
  lastSpawnedImageCreatorItem: null | ISceneLoaderAsyncResult = null;
  constructor(
    public canvas: HTMLCanvasElement,
    public imageCreatorCanvas: HTMLCanvasElement,
    debugRef: React.RefObject<HTMLUListElement>
  ) {
    this.imageCreatorEngine = new Engine(imageCreatorCanvas, false);
    this.imageCreatorScene = createImageCreatorScene(this.imageCreatorEngine);

    // this.engine.setHardwareScalingLevel(10); // renders at lower resolutions
    this.engine = new Engine(canvas, false);
    this.scene = new Scene(this.engine);

    this.debug.debugRef = debugRef;
    // [this.camera, this.shadowGenerator, this.sun, this.groundTexture] = this.initScene();
    [this.camera, this.sun, this.groundTexture] = this.initScene();

    this.defaultMaterials = createDefaultMaterials(this.scene);
    this.imageCreationDefaultMaterials = createDefaultMaterials(this.imageCreatorScene);

    // spawnTestEquipmentModels(this);

    this.engine.runRenderLoop(() => {
      this.updateGameWorld();
      this.scene.render();
    });

    // this.startLimitedFramerateRenderLoop(3, 3000);
  }

  async createItemImage(item: Item) {
    while (this.imageCreatorScene.meshes.length) {
      const mesh = this.imageCreatorScene.meshes.pop()!;
      disposeMeshMaterials(mesh, DYNAMIC_MATERIAL_TAG);
      mesh.dispose();
    }

    const equipmentModelResult = await spawnEquipmentModel(
      this,
      item,
      this.imageCreatorScene,
      this.imageCreationDefaultMaterials
    );
    if (equipmentModelResult instanceof Error) return console.error(equipmentModelResult);

    this.lastSpawnedImageCreatorItem = equipmentModelResult;

    const parentMesh = equipmentModelResult.meshes[0];
    if (!parentMesh) return console.error("no parent mesh");
    parentMesh.position = Vector3.Zero();

    const box = calculateCompositeBoundingBox(equipmentModelResult.meshes);
    const center = box.min.add(box.max).scale(0.5);
    // parentMesh.position = center;
    const size = box.max.subtract(box.min);

    const camera = this.imageCreatorScene.cameras[0];
    if (!(camera instanceof UniversalCamera)) return console.error("no camera");
    const fov = camera.fov; // Field of view in radians
    const maxDimension = Math.max(size.x, size.y); // Largest dimension of the equipment
    const distance = maxDimension / (2 * Math.tan(fov / 2));
    camera.position = center.add(new Vector3(0, 0, distance));
    camera.setTarget(center);
    const canvasWidth = 100; // Example width
    const canvasHeight = (size.y / size.x) * canvasWidth;
    this.imageCreatorCanvas.width = canvasWidth;
    this.imageCreatorCanvas.height = canvasHeight;
    // this.imageCreatorCanvas.style.width = `${canvasWidth}px`;
    // this.imageCreatorCanvas.style.height = `${canvasHeight}px`;
    this.imageCreatorEngine.resize();
    this.imageCreatorScene.render();
    console.log("canvas dimensions: ", canvasWidth, canvasHeight);
    this.imageCreatorEngine.runRenderLoop(() => {
      this.imageCreatorScene.render();
      this.imageCreatorEngine.stopRenderLoop(); // Stop after rendering one frame
    });
    const image = await takeScreenshot(this.imageCreatorEngine, camera, canvasWidth, canvasHeight);
    console.log("image: ", image);

    console.log("Bounding Box Center:", center);
    console.log("Bounding Box Size:", size);
    console.log("box: ", box);
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

  async importMesh(path: string, scene: Scene) {
    const sceneResult = await SceneLoader.ImportMeshAsync("", BASE_FILE_PATH || "", path, scene);
    // if (this.useShadows)
    //   for (const mesh of sceneResult.meshes) this.shadowGenerator?.addShadowCaster(mesh, true);
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
