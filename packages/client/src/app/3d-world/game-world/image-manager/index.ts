import {
  CreateScreenshotUsingRenderTarget,
  Engine,
  Scene,
  UniversalCamera,
  Vector3,
} from "@babylonjs/core";
import { useGameStore } from "@/stores/game-store";
import { createImageCreatorScene } from "./create-image-creator-scene";
import { SavedMaterials, createDefaultMaterials } from "../materials/create-default-materials";
import { Equipment, Item } from "@speed-dungeon/common";
import { calculateCompositeBoundingBox, disposeAsyncLoadedScene } from "../../utils";
import { spawnItemModel } from "../../item-models/spawn-item-model";

export enum ImageManagerRequestType {
  ItemCreation,
  ItemDeletion,
  ClearState,
}

export type ItemImageCreationRequest = {
  type: ImageManagerRequestType.ItemCreation;
  item: Item;
};
export type ItemImageDeletionRequest = {
  type: ImageManagerRequestType.ItemDeletion;
  itemIds: string[];
};

export type ItemImageClearStateRequest = {
  type: ImageManagerRequestType.ClearState;
};

export type ImageManagerRequest =
  | ItemImageCreationRequest
  | ItemImageDeletionRequest
  | ItemImageClearStateRequest;

export class ImageManager {
  canvas: OffscreenCanvas;
  engine: Engine;
  scene: Scene;
  materials: SavedMaterials;
  queue: ImageManagerRequest[] = [];
  isProcessing: boolean = false;
  camera: UniversalCamera;
  constructor() {
    this.canvas = new OffscreenCanvas(100, 100);
    const gl = this.canvas.getContext("webgl2");
    if (!gl) throw new Error("Failed to create WebGL context.");

    this.engine = new Engine(gl, true, { preserveDrawingBuffer: true, stencil: true });
    this.scene = createImageCreatorScene(this.engine);
    this.camera = new UniversalCamera("camera", new Vector3(0, 0, 3), this.scene);
    this.camera.minZ = 0;
    this.materials = createDefaultMaterials(this.scene);

    // pixelate(this.camera, this.scene, 2);
  }

  processNextMessage() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      console.log("image manager queue emptied");
      return;
    }

    const message = this.queue.shift();
    if (!message) return console.error("expected message not found");

    switch (message.type) {
      // we're calling processNextMessage() individually because we haven't figured out how
      // to await createItemImage because we need to run the render loop for it to finish
      // so we call processNextMessage() in the promise resolution of that one, so even though we'd like to
      // just call processNextMessage() after the switch statement, I haven't figured out how to make it work
      case ImageManagerRequestType.ItemCreation:
        try {
          const camera = this.scene.cameras[0];
          if (!camera) return console.error("expected camera not found");
          this.createItemImage(message.item);
          this.engine.runRenderLoop(() => {});
        } catch (err) {
          console.error(err);
        }
        break;
      case ImageManagerRequestType.ItemDeletion:
        useGameStore.getState().mutateState((state) => {
          for (const id of message.itemIds) {
            delete state.itemThumbnails[id];
          }
        });
        this.processNextMessage();
        break;
      case ImageManagerRequestType.ClearState:
        useGameStore.getState().mutateState((state) => {
          state.itemThumbnails = {};
        });
        this.processNextMessage();
        break;
    }
  }

  async enqueueMessage(message: ImageManagerRequest) {
    this.queue.push(message);
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.processNextMessage();
  }

  async createItemImage(item: Item) {
    const equipmentModelResult = await spawnItemModel(item, this.scene, this.materials);
    if (equipmentModelResult instanceof Error) {
      this.processNextMessage();
      return console.error("no equipment model");
    }
    const parentMesh = equipmentModelResult.meshes[0];
    if (!parentMesh) return console.error("no parent mesh");

    parentMesh.position = Vector3.Zero();

    const box = calculateCompositeBoundingBox(equipmentModelResult.meshes);
    const itemHeight = box.max.y - box.min.y;

    const center = box.min.add(box.max).scale(0.5);
    const size = box.max.subtract(box.min);

    const camera = this.scene.cameras[0];
    if (!(camera instanceof UniversalCamera)) return console.error("no camera");
    const fov = camera.fov;
    const maxDimension = Math.max(size.x, size.y);
    const distance = maxDimension / (2 * Math.tan(fov / 2));
    camera.position = center.add(new Vector3(0, 0, distance));
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
        useGameStore.getState().mutateState((state) => {
          state.itemThumbnails[item.entityProperties.id] = image;
        });
        disposeAsyncLoadedScene(equipmentModelResult, this.scene);

        this.processNextMessage();
      },
      "image/png"
    );
  }
}
