import {
  Vector3,
  HemisphericLight,
  Color4,
  PointLight,
  GlowLayer,
  Engine,
  Scene,
  UniversalCamera,
  MeshBuilder,
} from "@babylonjs/core";

export const GROUND_WIDTH = 50;
export const GROUND_HEIGHT = 50;
export const GROUND_TEXTURE_WIDTH = 8000;
export const GROUND_TEXTURE_HEIGHT = 10000;

export function createImageCreatorScene(engine: Engine): Scene {
  const scene = new Scene(engine);
  // scene.clearColor = new Color4(0, 0, 0, 0);
  scene.clearColor = new Color4(0.1, 0.1, 0.15, 1);

  const camera = new UniversalCamera("camera", new Vector3(0, 0, 3), scene);
  camera.minZ = 0;
  camera.attachControl();

  // LIGHTS
  const hemiLight = new HemisphericLight("hemi-light-2", new Vector3(0, 1, 0), scene);
  hemiLight.intensity = 0.85;
  const lightPosition = new Vector3(4.0, 20.0, 8.0);
  const pointLight = new PointLight("point-light-2", lightPosition, scene);
  pointLight.intensity = 0.8;
  pointLight.position = new Vector3(-1, 2, 2);

  const glowLayer = new GlowLayer("glow-2", scene);
  glowLayer.intensity = 0.5;

  const ball = MeshBuilder.CreateSphere("ball", { diameter: 0.25 }, scene);

  return scene;
}
