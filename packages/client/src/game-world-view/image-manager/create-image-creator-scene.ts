import {
  Vector3,
  HemisphericLight,
  Color4,
  PointLight,
  GlowLayer,
  Engine,
  Scene,
} from "@babylonjs/core";

export function createImageCreatorScene(engine: Engine): Scene {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0, 0, 0, 0);

  // LIGHTS
  const hemiLight = new HemisphericLight("hemi-light-2", new Vector3(0, 1, 0), scene);
  hemiLight.intensity = 0.85;
  const lightPosition = new Vector3(4.0, 20.0, 8.0);
  const pointLight = new PointLight("point-light-2", lightPosition, scene);
  pointLight.intensity = 0.8;
  pointLight.position = new Vector3(-1, 2, 2);

  const glowLayer = new GlowLayer("glow-2", scene);
  glowLayer.intensity = 0.5;

  return scene;
}
