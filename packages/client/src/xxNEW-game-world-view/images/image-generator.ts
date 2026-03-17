import {
  ArcRotateCamera,
  Color4,
  CreateScreenshotUsingRenderTarget,
  CreateScreenshotUsingRenderTargetAsync,
  Engine,
  GlowLayer,
  HemisphericLight,
  PointLight,
  RenderTargetTexture,
  Scene,
  UniversalCamera,
  Vector3,
} from "@babylonjs/core";
import { Equipment, Item } from "@speed-dungeon/common";
import {
  ImageGenerationRequest,
  ImageGenerationRequestHandlers,
  ImageGenerationRequestType,
} from "./image-generator-requests";
import { MODEL_PORTRAIT_CAMERA_POSITIONS } from "./portrait-camera-positions";
import { GameWorldView } from "..";
import { ClientApplication } from "@/client-application";
import { LAYER_MASK_1, LAYER_MASK_ALL } from "../game-world-view-consts";
import { MaterialManager } from "../materials/material-manager";
import { calculateCompositeBoundingBox, getChildMeshByName } from "../utils";
import { ItemSceneEntityFactory } from "../scene-entities/items/item-scene-entity-factory";

export class ImageGenerator {
  canvas = new OffscreenCanvas(100, 100);
  engine: Engine;
  scene: Scene;
  queue: ImageGenerationRequest[] = [];
  isProcessing: boolean = false;
  camera: UniversalCamera;
  requestHandlers: ImageGenerationRequestHandlers;
  materialManager: MaterialManager;
  itemSceneEntityFactory: ItemSceneEntityFactory;
  // portraits
  portraitCamera: ArcRotateCamera;

  constructor(
    private clientApplication: ClientApplication,
    private gameWorldView: GameWorldView
  ) {
    const gl = this.canvas.getContext("webgl2");
    if (!gl) {
      throw new Error("Failed to create WebGL context.");
    }

    this.engine = new Engine(gl, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    this.scene = this.createScene(this.engine);
    this.materialManager = new MaterialManager(this.scene);
    this.itemSceneEntityFactory = new ItemSceneEntityFactory(
      clientApplication.assetService,
      this.scene,
      this.materialManager
    );
    this.camera = new UniversalCamera("camera", new Vector3(0, 0, 3), this.scene);
    this.camera.minZ = 0;
    this.requestHandlers = this.createRequestHandlers();

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
    const portraitRenderTarget = new RenderTargetTexture(
      "portraitTexture",
      { width: 100, height: 100 },
      this.scene
    );
    this.portraitCamera.outputRenderTarget = portraitRenderTarget;
  }

  private createScene(engine: Engine): Scene {
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0, 0, 0, 0);
    this.setUpSceneLighting(scene);
    const glowLayer = new GlowLayer("glow-2", scene);
    glowLayer.intensity = 0.5;
    return scene;
  }

  private setUpSceneLighting(scene: Scene) {
    const hemiLight = new HemisphericLight("hemi-light-2", new Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.85;
    const lightPosition = new Vector3(4.0, 20.0, 8.0);
    const pointLight = new PointLight("point-light-2", lightPosition, scene);
    pointLight.intensity = 0.8;
    pointLight.position = new Vector3(-1, 2, 2);
  }

  private createRequestHandlers(): ImageGenerationRequestHandlers {
    return {
      [ImageGenerationRequestType.ItemCreation]: ({ item }) => {
        try {
          this.createItemImage(item);
          this.engine.runRenderLoop(() => {
            //
          });
        } catch (err) {
          console.error(err);
        }
      },
      // we're calling processNextMessage() individually because we haven't figured out how
      // to await createItemImage because we need to run the render loop for it to finish
      // so we call processNextMessage() in the promise resolution of that one, so even though we'd like to
      // just call processNextMessage() after the switch statement, I haven't figured out how to make it work
      [ImageGenerationRequestType.ItemDeletion]: ({ itemIds }) => {
        this.clientApplication.imageStore.clearThumbnailIds(itemIds);
        this.processNextMessage();
      },
      [ImageGenerationRequestType.ClearState]: () => {
        this.clientApplication.imageStore.clearAllThumbnails();
        this.processNextMessage();
      },
    };
  }

  async enqueueMessage(message: ImageGenerationRequest) {
    this.queue.push(message);
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.processNextMessage();
  }

  processNextMessage() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      console.info("image manager queue emptied");
      return;
    }

    const message = this.queue.shift();
    if (!message) {
      return console.error("expected message not found");
    }
  }

  async createItemImage(item: Item) {
    const equipmentModelResult = await this.itemSceneEntityFactory.create(item, false);

    if (equipmentModelResult instanceof Error) {
      this.processNextMessage();
      return console.info(equipmentModelResult.message);
    }

    equipmentModelResult.setVisibility(1);

    const parentMesh = equipmentModelResult.rootMesh;

    parentMesh.position = Vector3.Zero();

    const box = calculateCompositeBoundingBox(equipmentModelResult.assetContainer.meshes);
    const itemHeight = box.max.y - box.min.y;

    const center = box.min.add(box.max).scale(0.5);
    const size = box.max.subtract(box.min);

    const camera = this.camera;
    const fov = camera.fov;
    const maxDimension = Math.max(size.x, size.y);
    const distance = maxDimension / (2 * Math.tan(fov / 2));
    camera.position.copyFrom(center.add(new Vector3(0, 0, distance)));
    camera.setTarget(center);

    const canvasHeight = item instanceof Equipment ? itemHeight * 120 : itemHeight * 420;
    const canvasWidth = (size.x / size.y) * canvasHeight;
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;

    CreateScreenshotUsingRenderTarget(
      this.engine,
      camera,
      { width: canvasWidth, height: canvasHeight },
      (image) => {
        this.engine.stopRenderLoop();
        this.clientApplication.imageStore.setItemThumbnail(item.entityProperties.id, image);
        equipmentModelResult.cleanup({ softCleanup: false });
        this.processNextMessage();
      },
      "image/png"
    );
  }

  async createCombatantPortrait(combatantId: string) {
    const world = this.gameWorldView;
    const combatantModelOption = world.combatantSceneEntityRegistry.findOneOptional(combatantId);
    if (!combatantModelOption) {
      // might be processing image request after left game?
      return;
    }

    let headBoneOption = getChildMeshByName(combatantModelOption.rootMesh, "DEF-head");
    if (!headBoneOption) {
      headBoneOption = combatantModelOption.rootMesh;
    }

    const headPosition = headBoneOption.getWorldMatrix().getTranslation();

    const boundingInfo = combatantModelOption.rootMesh.getBoundingInfo();
    const min = boundingInfo.boundingBox.minimumWorld;
    const max = boundingInfo.boundingBox.maximumWorld;

    const width = max.x - min.x;

    const { portraitCamera } = this;
    // Camera parameters
    const fov = portraitCamera.fov;
    // Calculate the distance needed to align the top of the viewport with the top of the bounding box
    const distance = width / (2 * Math.tan(fov / 2)); // Vertical frustum size
    const inFrontOf = combatantModelOption.rootTransformNode.forward.scale(distance);
    const cameraPosition = headPosition.add(new Vector3(0, 0, inFrontOf.z));
    const alphaOffset = -0.2;
    portraitCamera.position.copyFrom(cameraPosition);
    portraitCamera.setTarget(headPosition);
    portraitCamera.alpha += alphaOffset;
    portraitCamera.beta -= 0.2;

    const { monsterType } = combatantModelOption.combatant.combatantProperties;
    if (monsterType !== null) {
      const { arcRotate, position } = MODEL_PORTRAIT_CAMERA_POSITIONS[monsterType];
      const { alpha, beta, radius } = arcRotate;
      portraitCamera.alpha += alpha;
      portraitCamera.beta += beta;
      portraitCamera.radius += radius;
      portraitCamera.target.copyFrom(world.portraitCamera.target.add(position));
    } else {
      // humanoid
      portraitCamera.target.copyFrom(portraitCamera.target.add(new Vector3(0, 0.05, 0)));
    }

    for (const mesh of combatantModelOption.rootMesh.getChildMeshes()) {
      mesh.layerMask = LAYER_MASK_1;
    }

    this.engine.runRenderLoop(() => {
      //
    });
    const image = await CreateScreenshotUsingRenderTargetAsync(
      // using this engine instead of the main engine somehow works
      // and avoids the flash of low resolution rendering to the main canvas
      this.engine,
      portraitCamera,
      { width: 100, height: 100 },
      "image/png"
    );

    // @TODO - stopping this affects item screenshot creation, fix it
    this.engine.stopRenderLoop();

    for (const mesh of combatantModelOption.rootMesh.getChildMeshes()) {
      mesh.layerMask = LAYER_MASK_ALL;
    }

    return image;
  }
}
