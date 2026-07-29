import {
  ArcRotateCamera,
  CreateScreenshotUsingRenderTargetAsync,
  Engine,
  RenderTargetTexture,
  Vector3,
} from "@babylonjs/core";
import { ArcRotateParams, MODEL_PORTRAIT_CAMERA_POSITIONS } from "./portrait-camera-positions";
import { GameWorldView } from "..";
import { LAYER_MASK_1, LAYER_MASK_ALL } from "../game-world-view-consts";
import { getChildMeshByName } from "../utils";

export class CombatantPortraitGenerator {
  private canvas = new OffscreenCanvas(100, 100);
  private engine: Engine;
  private camera: ArcRotateCamera;
  private captureChain: Promise<unknown> = Promise.resolve();

  constructor(private gameWorldView: GameWorldView) {
    const gl = this.canvas.getContext("webgl2");
    if (!gl) {
      throw new Error("Failed to create WebGL context.");
    }
    // using this engine instead of the main engine somehow works and avoids the flash of low
    // resolution rendering to the main canvas
    this.engine = new Engine(gl, true, { preserveDrawingBuffer: true, stencil: true });

    this.camera = new ArcRotateCamera(
      "portrait camera",
      0,
      0,
      0,
      Vector3.Zero(),
      this.gameWorldView.scene
    );
    this.camera.minZ = 0;
    this.camera.layerMask = LAYER_MASK_1;
    this.camera.outputRenderTarget = new RenderTargetTexture(
      "portraitTexture",
      { width: 100, height: 100 },
      this.gameWorldView.scene
    );
  }

  async createCombatantPortrait(combatantId: string) {
    // captures share one camera, engine and render target, so overlapping calls would each
    // reframe the camera and stop the other's render loop mid-screenshot
    const capture = this.captureChain.then(() => this.capturePortrait(combatantId));
    this.captureChain = capture.catch(() => undefined);
    return capture;
  }

  private async capturePortrait(combatantId: string) {
    const world = this.gameWorldView;
    const combatantModelOption =
      world.sceneEntityService.combatantSceneEntityManager.getOptional(combatantId);
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

    const { camera } = this;
    // Calculate the distance needed to align the top of the viewport with the top of the bounding box
    const distance = width / (2 * Math.tan(camera.fov / 2)); // Vertical frustum size
    const inFrontOf = combatantModelOption.rootTransformNode.forward.scale(distance);
    const cameraPosition = headPosition.add(new Vector3(0, 0, inFrontOf.z));
    const alphaOffset = -0.2;
    camera.position.copyFrom(cameraPosition);
    camera.setTarget(headPosition);
    camera.alpha += alphaOffset;
    camera.beta -= 0.2;

    const { monsterType } = combatantModelOption.combatant.combatantProperties;
    if (monsterType !== null) {
      const { arcRotate, position } = MODEL_PORTRAIT_CAMERA_POSITIONS[monsterType] || {
        arcRotate: new ArcRotateParams(),
        position: Vector3.Zero(),
      };
      const { alpha, beta, radius } = arcRotate;
      camera.alpha += alpha;
      camera.beta += beta;
      camera.radius += radius;
      camera.target.copyFrom(camera.target.add(position));
    } else {
      // humanoid
      camera.target.copyFrom(camera.target.add(new Vector3(0, 0.05, 0)));
    }

    for (const mesh of combatantModelOption.rootMesh.getChildMeshes()) {
      mesh.layerMask = LAYER_MASK_1;
    }

    this.engine.runRenderLoop(() => {
      //
    });

    try {
      return await CreateScreenshotUsingRenderTargetAsync(
        this.engine,
        camera,
        { width: 100, height: 100 },
        "image/png"
      );
    } finally {
      // a failed capture must still restore the layer mask or the model stays hidden
      // from the main camera
      this.engine.stopRenderLoop();

      for (const mesh of combatantModelOption.rootMesh.getChildMeshes()) {
        mesh.layerMask = LAYER_MASK_ALL;
      }
    }
  }

  dispose() {
    this.engine.dispose();
  }
}
