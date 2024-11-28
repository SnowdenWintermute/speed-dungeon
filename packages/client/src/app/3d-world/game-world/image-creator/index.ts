import { Engine, Scene, UniversalCamera, Vector3 } from "@babylonjs/core";
import { useGameStore } from "@/stores/game-store";
import { createImageCreatorScene } from "./create-image-creator-scene";
import { SavedMaterials, createDefaultMaterials } from "../materials/create-default-materials";
import { Item } from "@speed-dungeon/common";
import spawnEquipmentModel from "../../combatant-models/spawn-equipment-model";
import { calculateCompositeBoundingBox, takeScreenshot } from "../../utils";

export class ImageCreator {
  engine: Engine;
  scene: Scene;
  materials: SavedMaterials;
  constructor() {
    const offscreenCanvas = new OffscreenCanvas(100, 100);
    const gl = offscreenCanvas.getContext("webgl2");
    if (!gl) throw new Error("Failed to create WebGL context.");

    this.engine = new Engine(gl, true, { preserveDrawingBuffer: true, stencil: true });

    this.scene = createImageCreatorScene(this.engine);
    this.materials = createDefaultMaterials(this.scene);
  }

  async createItemImage(
    item: Item,
    canvas: OffscreenCanvas,
    engine: Engine,
    scene: Scene,
    materials: SavedMaterials
  ) {
    const equipmentModelResult = await spawnEquipmentModel(item, scene, materials);
    if (equipmentModelResult instanceof Error) return console.error(equipmentModelResult);

    const parentMesh = equipmentModelResult.meshes[0];
    if (!parentMesh) return console.error("no parent mesh");

    parentMesh.position = Vector3.Zero();

    const box = calculateCompositeBoundingBox(equipmentModelResult.meshes);
    const center = box.min.add(box.max).scale(0.5);
    const size = box.max.subtract(box.min);

    const camera = scene.cameras[0];
    if (!(camera instanceof UniversalCamera)) return console.error("no camera");
    const fov = camera.fov;
    const maxDimension = Math.max(size.x, size.y);
    const distance = maxDimension / (2 * Math.tan(fov / 2));
    camera.position = center.add(new Vector3(0, 0, distance));
    camera.setTarget(center);
    const canvasWidth = 144;
    const canvasHeight = (size.y / size.x) * canvasWidth;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    engine.beginFrame();
    scene.render();
    engine.endFrame();
    const image = await takeScreenshot(engine, camera, canvasWidth, canvasHeight);

    useGameStore.getState().mutateState((state) => {
      state.itemThumbnails[item.entityProperties.id] = image;
    });

    console.log(image.slice(10));
  }
}
