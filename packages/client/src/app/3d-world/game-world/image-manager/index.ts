import {
  CreateScreenshotUsingRenderTarget,
  Engine,
  Quaternion,
  Scene,
  UniversalCamera,
  Vector3,
} from "@babylonjs/core";
import { useGameStore } from "@/stores/game-store";
import { createImageCreatorScene } from "./create-image-creator-scene";
import { SavedMaterials, createDefaultMaterials } from "../materials/create-default-materials";
import { ERROR_MESSAGES, Equipment, Item } from "@speed-dungeon/common";
import { calculateCompositeBoundingBox, disposeAsyncLoadedScene } from "../../utils";
import { spawnItemModel } from "../../item-models/spawn-item-model";
import { gameWorld } from "../../SceneManager";

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
      console.info("image manager queue emptied");
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
    const equipmentModelResult = await spawnItemModel(item, this.scene, this.materials, false);
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
        useGameStore.getState().mutateState((state) => {
          state.itemThumbnails[item.entityProperties.id] = image;
        });
        disposeAsyncLoadedScene(equipmentModelResult, this.scene);

        this.processNextMessage();
      },
      "image/png"
    );
  }

  async createCombatantPortrait(combatantId: string) {
    if (!gameWorld.current) return;
    const world = gameWorld.current;
    const combatantModelOption = gameWorld.current.modelManager.combatantModels[combatantId];
    if (!combatantModelOption) return new Error(ERROR_MESSAGES.COMBATANT.NOT_FOUND);

    combatantModelOption.updateBoundingBox();
    const boundingInfo = combatantModelOption.rootMesh.getBoundingInfo();
    const min = boundingInfo.boundingBox.minimumWorld;
    const max = boundingInfo.boundingBox.maximumWorld;

    // Dimensions of the bounding box
    const width = max.x - min.x;
    const height = max.y - min.y;
    const depth = max.z - min.z;

    const newX = (min.x + max.x) / 2;
    const newY = max.y;
    const newZ = combatantModelOption.rootTransformNode.forward.z;

    const newPosition = new Vector3(newX, newY, newZ);

    world.portraitCamera.position.copyFrom(newPosition);
    // new Vector3(
    //   (min.x + max.x) / 2, // Center the camera horizontally
    //   max.y - height / 2 + height / 2, // Align the top of the bounding box with the viewport's top
    //   max.z + requiredDistance // Position the camera at the required distance
    // );

    // world.portraitCamera.rotation = Vector3.Zero();
    world.portraitCamera.setTarget(
      new Vector3((min.x + max.x) / 2, min.y + max.y - 0.2, (min.z + max.z) / 2)
    );

    CreateScreenshotUsingRenderTarget(
      world.engine,
      world.portraitCamera,
      { width: 100, height: 100 },
      (image) => {
        useGameStore.getState().mutateState((state) => {
          state.combatantPortraits[combatantId] = image;
        });
      },
      "image/png"
    );
  }
}
