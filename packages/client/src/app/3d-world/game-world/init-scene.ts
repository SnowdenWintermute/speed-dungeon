import {
  Vector3,
  HemisphericLight,
  MeshBuilder,
  ArcRotateCamera,
  Color4,
  PointLight,
  StandardMaterial,
  ShadowGenerator,
  Mesh,
  DynamicTexture,
  ICanvasRenderingContext,
} from "@babylonjs/core";
import { GameWorld } from ".";

export const GROUND_WIDTH = 50;
export const GROUND_HEIGHT = 50;
export const GROUND_TEXTURE_WIDTH = 10000;
export const GROUND_TEXTURE_HEIGHT = 10000;

export function initScene(
  this: GameWorld
): [ArcRotateCamera, ShadowGenerator, Mesh, ICanvasRenderingContext, DynamicTexture] {
  this.scene.clearColor = new Color4(0.1, 0.1, 0.15, 1);

  // this.scene.fogMode = 3;
  // this.scene.fogStart = 5;
  // this.scene.fogEnd = 10;
  // this.scene.fogColor = new Color3(255, 255, 255);
  // CAMERA
  const camera = new ArcRotateCamera(
    "camera",
    // alpha
    3.09,
    // beta
    1.14,
    // radius
    8,
    // target
    new Vector3(0.92, 0.54, 0.62),
    // Vector3.Zero(),
    this.scene
  );
  camera.wheelDeltaPercentage = 0.02;
  camera.attachControl();

  // LIGHTS
  const hemiLight = new HemisphericLight("hemi-light", new Vector3(0, 1, 0), this.scene);
  hemiLight.intensity = 0.85;
  const lightPosition = new Vector3(4.0, 4.0, 8.0);
  const pointLight = new PointLight("point-light", lightPosition, this.scene);
  const ball = MeshBuilder.CreateSphere("ball", { diameter: 0.25 }, this.scene);
  ball.position = lightPosition;
  pointLight.intensity = 0.2;

  // GROUND
  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: GROUND_WIDTH, height: GROUND_HEIGHT },
    this.scene
  );
  const material = new StandardMaterial("ground-material", this.scene);
  // material.diffuseColor = new Color3(0.203, 0.295, 0.208);
  ground.material = material;

  const dynTex = new DynamicTexture(
    "ground texture context",
    { width: GROUND_TEXTURE_WIDTH, height: GROUND_TEXTURE_HEIGHT },
    this.scene
  );
  const groundTextureContext = dynTex.getContext();
  material.diffuseTexture = dynTex;

  // SHADOWS
  const shadowGenerator = new ShadowGenerator(1024, pointLight);
  ground.receiveShadows = true;

  return [camera, shadowGenerator, ball, groundTextureContext, dynTex];
}
