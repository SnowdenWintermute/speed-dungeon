export const GLOW_LAYER_NAME = "glow";

// [this.camera, this.sun, this.groundTexture, this.ground] = this.initScene();

export function initScene(
  this: GameWorldView
): [ArcRotateCamera, Mesh, DynamicTexture, GroundMesh] {
  // this.scene.clearColor = new Color4(0.1, 0.1, 0.15, 1);

  this.scene.clearColor = new Color4(0, 0, 0, 0);

  // this.scene.fogMode = 1;
  // this.scene.fogStart = 0;
  // this.scene.fogEnd = 100;
  // this.scene.fogColor = new Color3(0.9, 0.9, 0.85);
  // this.scene.fogDensity = 0.02;
  // CAMERA
  const camera = new ArcRotateCamera("camera", 0, 0, 0, new Vector3(0, 1, 0), this.scene);
  camera.alpha = Math.PI / 2;
  camera.beta = (Math.PI / 5) * 2;
  camera.radius = 4.28;
  camera.wheelDeltaPercentage = 0.01;
  camera.attachControl();
  camera.minZ = 0;

  // ORTHO setup
  // setupOrthoCamera()

  // LIGHTS
  const hemiLight = new HemisphericLight("hemi-light", new Vector3(0, 1, 0), this.scene);
  hemiLight.specular = Color3.FromHexString(GROUND_COLOR);
  hemiLight.intensity = 0.85;
  // hemiLight.intensity = 0.0;
  const lightPosition = new Vector3(4.0, 20.0, 8.0);
  const pointLight = new PointLight("point-light", lightPosition, this.scene);
  const ball = MeshBuilder.CreateSphere("ball", { diameter: 0.25 }, this.scene);
  const sunMaterial = new StandardMaterial("sun material");
  sunMaterial.emissiveColor = new Color3(1, 1, 1);
  ball.material = sunMaterial;
  ball.position = lightPosition;
  pointLight.intensity = 0.2;
  // pointLight.intensity = 0.0;

  const glowLayer = new GlowLayer(GLOW_LAYER_NAME, this.scene);
  // Adjust glow intensity
  glowLayer.intensity = 0.5;

  this.clearFloorTexture();

  return [camera, ball, this.groundTexture, ground];
}
