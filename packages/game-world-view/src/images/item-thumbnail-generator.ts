import {
  Color4,
  CreateScreenshotUsingRenderTarget,
  Engine,
  GlowLayer,
  HemisphericLight,
  PointLight,
  Scene,
  UniversalCamera,
  Vector3,
} from "@babylonjs/core";
import { ClientAppAssetService, Equipment, Item } from "@speed-dungeon/common";
import { ItemThumbnailRenderer } from "@/client-application/item-thumbnails/item-thumbnail-renderer";
import { FloatingMessageService } from "@/client-application/event-log/floating-messages-service";
import { MaterialManager } from "../materials/material-manager";
import { calculateCompositeBoundingBox } from "../utils";
import { ItemSceneEntityFactory } from "../scene-entities/items/item-scene-entity-factory";

export class ItemThumbnailGenerator implements ItemThumbnailRenderer {
  private canvas = new OffscreenCanvas(100, 100);
  private engine: Engine;
  private scene: Scene;
  private camera: UniversalCamera;
  private materialManager: MaterialManager;
  private itemSceneEntityFactory: ItemSceneEntityFactory;

  constructor(assetService: ClientAppAssetService, floatingMessageService: FloatingMessageService) {
    const gl = this.canvas.getContext("webgl2");
    if (!gl) {
      throw new Error("Failed to create WebGL context.");
    }
    this.engine = new Engine(gl, true, { preserveDrawingBuffer: true, stencil: true });
    this.scene = this.createScene(this.engine);
    this.materialManager = new MaterialManager(this.scene);
    this.itemSceneEntityFactory = new ItemSceneEntityFactory(
      assetService,
      floatingMessageService,
      this.scene,
      this.materialManager
    );
    this.camera = new UniversalCamera("camera", new Vector3(0, 0, 3), this.scene);
    this.camera.minZ = 0;
  }

  private createScene(engine: Engine): Scene {
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0, 0, 0, 0);
    const hemiLight = new HemisphericLight("hemi-light-2", new Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.85;
    const pointLight = new PointLight("point-light-2", new Vector3(4.0, 20.0, 8.0), scene);
    pointLight.intensity = 0.8;
    pointLight.position = new Vector3(-1, 2, 2);
    const glowLayer = new GlowLayer("glow-2", scene);
    glowLayer.intensity = 0.5;
    return scene;
  }

  async renderThumbnail(item: Item) {
    const sceneEntity = await this.itemSceneEntityFactory.create(item, false);

    try {
      sceneEntity.setVisibility(1);
      sceneEntity.rootMesh.position = Vector3.Zero();

      const box = calculateCompositeBoundingBox(sceneEntity.assetContainer.meshes);
      const itemHeight = box.max.y - box.min.y;
      const center = box.min.add(box.max).scale(0.5);
      const size = box.max.subtract(box.min);

      const { camera } = this;
      const maxDimension = Math.max(size.x, size.y);
      const distance = maxDimension / (2 * Math.tan(camera.fov / 2));
      camera.position.copyFrom(center.add(new Vector3(0, 0, distance)));
      camera.setTarget(center);

      const canvasHeight = item instanceof Equipment ? itemHeight * 120 : itemHeight * 420;
      const canvasWidth = (size.x / size.y) * canvasHeight;
      this.canvas.width = canvasWidth;
      this.canvas.height = canvasHeight;

      return await this.captureScreenshot(canvasWidth, canvasHeight);
    } finally {
      sceneEntity.cleanup({ softCleanup: false });
    }
  }

  // the render loop has to be running for the screenshot to resolve, so the callback form is
  // what makes this awaitable
  private captureScreenshot(width: number, height: number) {
    return new Promise<string>((resolve, reject) => {
      this.engine.runRenderLoop(() => {});
      try {
        CreateScreenshotUsingRenderTarget(
          this.engine,
          this.camera,
          { width, height },
          (image) => {
            this.engine.stopRenderLoop();
            resolve(image);
          },
          "image/png"
        );
      } catch (error) {
        this.engine.stopRenderLoop();
        reject(error);
      }
    });
  }

  dispose() {
    this.scene.dispose();
    this.engine.dispose();
  }
}
