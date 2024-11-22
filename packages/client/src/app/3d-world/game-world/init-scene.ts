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
  GlowLayer,
} from "@babylonjs/core";
import { GameWorld } from ".";

export const GROUND_WIDTH = 50;
export const GROUND_HEIGHT = 50;
export const GROUND_TEXTURE_WIDTH = 8000;
export const GROUND_TEXTURE_HEIGHT = 10000;

export function initScene(
  this: GameWorld
): [ArcRotateCamera, ShadowGenerator, Mesh, DynamicTexture] {
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
  // hemiLight.intensity = 0.0;
  const lightPosition = new Vector3(4.0, 4.0, 8.0);
  const pointLight = new PointLight("point-light", lightPosition, this.scene);
  const ball = MeshBuilder.CreateSphere("ball", { diameter: 0.25 }, this.scene);
  ball.position = lightPosition;
  pointLight.intensity = 0.2;
  // pointLight.intensity = 0.0;

  const glowLayer = new GlowLayer("glow", this.scene);
  // Adjust glow intensity
  glowLayer.intensity = 0.5;

  const ground = MeshBuilder.CreateGround(
    "ground1",
    { width: GROUND_WIDTH, height: GROUND_HEIGHT, subdivisions: 25 },
    this.scene
  );

  // Create dynamic texture
  this.groundTexture = new DynamicTexture("dynamic texture", GROUND_TEXTURE_WIDTH, this.scene);

  const materialGround = new StandardMaterial("Mat", this.scene);
  materialGround.diffuseTexture = this.groundTexture;
  ground.material = materialGround;

  // Draw on canvas

  this.clearFloorTexture();

  // this.drawCharacterSlots();
  // SHADOWS
  const shadowGenerator = new ShadowGenerator(1024, pointLight);
  // ground.receiveShadows = true;

  return [camera, shadowGenerator, ball, this.groundTexture];
}
