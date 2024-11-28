import {
  Camera,
  CreateScreenshotUsingRenderTarget,
  CreateScreenshotUsingRenderTargetAsync,
  Engine,
  MeshBuilder,
  Scene,
  UniversalCamera,
  Vector3,
} from "@babylonjs/core";
import { useGameStore } from "@/stores/game-store";
import { createImageCreatorScene } from "./create-image-creator-scene";
import { SavedMaterials, createDefaultMaterials } from "../materials/create-default-materials";
import { Item } from "@speed-dungeon/common";
import spawnEquipmentModel from "../../combatant-models/spawn-equipment-model";
import { calculateCompositeBoundingBox, disposeAsyncLoadedScene } from "../../utils";

export enum ImageCreationRequestType {
  Item,
}

export type ItemImageCreationRequest = { type: ImageCreationRequestType.Item; item: Item };

export type ImageCreationRequest = ItemImageCreationRequest;

export class ImageCreator {
  canvas: OffscreenCanvas;
  engine: Engine;
  scene: Scene;
  materials: SavedMaterials;
  queue: ImageCreationRequest[] = [];
  isProcessing: boolean = false;
  constructor() {
    this.canvas = new OffscreenCanvas(100, 100);
    const gl = this.canvas.getContext("webgl2");
    if (!gl) throw new Error("Failed to create WebGL context.");

    this.engine = new Engine(gl, true, { preserveDrawingBuffer: true, stencil: true });

    this.scene = createImageCreatorScene(this.engine);
    this.materials = createDefaultMaterials(this.scene);
  }

  async enqueueMessage(message: ImageCreationRequest) {
    this.queue.push(message);
    console.log(this.queue.length);
    // console.log("isProcessing: ", this.isProcessing, "queue: ", this.queue, message);
    if (this.isProcessing) return;

    this.isProcessing = true;
    while (this.queue.length > 0) {
      const message = this.queue.shift();
      if (!message) break;
      console.log("trying to create screenshot");
      try {
        const image = await CreateScreenshotUsingRenderTargetAsync(
          this.engine,
          this.scene.cameras[0]!,
          { width: 100, height: 100 },
          "image/png"
        );
        console.log(image);
      } catch (err) {
        console.error(err);
      }

      // await this.createItemImage(message.item);
    }
    this.isProcessing = false;
  }

  async createItemImage(item: Item) {
    const equipmentModelResult = await spawnEquipmentModel(item, this.scene, this.materials);
    if (equipmentModelResult instanceof Error) return console.error(equipmentModelResult);
    const parentMesh = equipmentModelResult.meshes[0];
    if (!parentMesh) return console.error("no parent mesh");

    parentMesh.position = Vector3.Zero();

    const box = calculateCompositeBoundingBox(equipmentModelResult.meshes);
    const center = box.min.add(box.max).scale(0.5);
    const size = box.max.subtract(box.min);

    const camera = this.scene.cameras[0];
    if (!(camera instanceof UniversalCamera)) return console.error("no camera");
    const fov = camera.fov;
    const maxDimension = Math.max(size.x, size.y);
    const distance = maxDimension / (2 * Math.tan(fov / 2));
    camera.position = center.add(new Vector3(0, 0, distance));
    camera.setTarget(center);
    const canvasWidth = 144;
    const canvasHeight = (size.y / size.x) * canvasWidth;
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;

    this.engine.beginFrame();
    this.scene.render();
    this.engine.endFrame();
    console.log("about to take screenshot", this.engine, camera);
    // const image = await takeScreenshot(this.engine, camera, canvasWidth, canvasHeight);
    const image = await CreateScreenshotUsingRenderTargetAsync(
      this.engine,
      camera,
      { width: canvasWidth, height: canvasHeight },
      "image/png"
    );

    useGameStore.getState().mutateState((state) => {
      state.itemThumbnails[item.entityProperties.id] = image;
    });

    disposeAsyncLoadedScene(equipmentModelResult);

    console.log(image.slice(0, 10));
  }
}
