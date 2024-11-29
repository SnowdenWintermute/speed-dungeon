import {
  BoundingBoxGizmo,
  CreateScreenshotUsingRenderTarget,
  Engine,
  Scene,
  UniversalCamera,
  Vector3,
  Viewport,
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

  processNextMessage() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      this.engine.stopRenderLoop();
      console.log("finished generating screenshots");
      return;
    }

    const message = this.queue.shift();
    if (!message) return console.error("expected message not found");

    try {
      const camera = this.scene.cameras[0];
      if (!camera) return console.error("expected camera not found");
      this.createItemImage(message.item);
      this.engine.runRenderLoop(() => {});
    } catch (err) {
      console.error(err);
    }
  }

  async enqueueMessage(message: ImageCreationRequest) {
    this.queue.push(message);
    if (this.isProcessing) return;

    this.isProcessing = true;
    while (this.queue.length > 0) {
      this.processNextMessage();
    }
  }

  async createItemImage(item: Item) {
    const equipmentModelResult = await spawnEquipmentModel(item, this.scene, this.materials);
    if (equipmentModelResult instanceof Error) return console.error(equipmentModelResult);
    const parentMesh = equipmentModelResult.meshes[0];
    if (!parentMesh) return console.error("no parent mesh");

    parentMesh.position = Vector3.Zero();

    const canvasWidth = 87;
    const canvasHeight = 160;

    const rotationAngle = Math.atan(canvasWidth / canvasHeight);

    let box = calculateCompositeBoundingBox(equipmentModelResult.meshes);
    let center = box.min.add(box.max).scale(0.5);
    // parentMesh.rotateAround(center, Vector3.Forward(), -rotationAngle);
    parentMesh.rotateAround(center, Vector3.Forward(), -Math.PI / 2);

    const camera = this.scene.cameras[0];
    if (!(camera instanceof UniversalCamera)) return console.error("no camera");
    camera.viewport = new Viewport(
      0,
      0,
      canvasWidth / this.canvas.width,
      canvasHeight / this.canvas.height
    );
    const fov = camera.fov;

    equipmentModelResult.meshes.forEach((mesh) => {
      mesh.refreshBoundingInfo({});
      mesh.computeWorldMatrix(true);
    });

    box = calculateCompositeBoundingBox(equipmentModelResult.meshes);
    center = box.min.add(box.max).scale(0.5);
    // center = box.min.add(box.max).scale(0.5);
    const size = box.max.subtract(box.min);
    const diagonal = Math.sqrt(size.x ** 2 + size.y ** 2);
    const distance = diagonal / (2 * Math.tan(fov / 2));
    // const maxDimension = Math.max(size.x, size.y);
    // const distance = maxDimension / (2 * Math.tan(fov / 2));
    camera.position = center.add(new Vector3(0, 0, distance));
    camera.setTarget(center);

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
        disposeAsyncLoadedScene(equipmentModelResult);
        this.processNextMessage();
      },
      "image/png"
    );
  }
}

// async createItemImage(item: Item) {
//    const equipmentModelResult = await spawnEquipmentModel(item, this.scene, this.materials);
//    if (equipmentModelResult instanceof Error) return console.error(equipmentModelResult);
//    const parentMesh = equipmentModelResult.meshes[0];
//    if (!parentMesh) return console.error("no parent mesh");

//    parentMesh.position = Vector3.Zero();

//    const box = calculateCompositeBoundingBox(equipmentModelResult.meshes);
//    const itemHeight = box.max.y - box.min.y;

//    const center = box.min.add(box.max).scale(0.5);
//    const size = box.max.subtract(box.min);

//    const camera = this.scene.cameras[0];
//    if (!(camera instanceof UniversalCamera)) return console.error("no camera");
//    const fov = camera.fov;
//    const maxDimension = Math.max(size.x, size.y);
//    const distance = maxDimension / (2 * Math.tan(fov / 2));
//    camera.position = center.add(new Vector3(0, 0, distance));
//    camera.setTarget(center);

//    const canvasHeight = itemHeight * 100;
//    const canvasWidth = (size.x / size.y) * canvasHeight;
//    this.canvas.width = canvasWidth;
//    this.canvas.height = canvasHeight;

//    CreateScreenshotUsingRenderTarget(
//      this.engine,
//      camera,
//      { width: canvasWidth, height: canvasHeight },
//      (image) => {
//        this.engine.stopRenderLoop();
//        useGameStore.getState().mutateState((state) => {
//          state.itemThumbnails[item.entityProperties.id] = image;
//        });
//        disposeAsyncLoadedScene(equipmentModelResult);
//        this.processNextMessage();
//      },
//      "image/png"
//    );
//  }
