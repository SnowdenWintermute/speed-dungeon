import {
  Color3,
  GlowLayer,
  HemisphericLight,
  MeshBuilder,
  PointLight,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import { GameWorldGroundPlane } from "./ground-plane";
import { GLOW_LAYER_NAME, GROUND_COLOR } from "../game-world-view-consts";

export class EnvironmentView {
  readonly groundPlane: GameWorldGroundPlane;
  readonly lights: { hemi: HemisphericLight; point: PointLight };

  constructor(private scene: Scene) {
    this.groundPlane = new GameWorldGroundPlane(scene);
    const glowLayer = new GlowLayer(GLOW_LAYER_NAME, this.scene);
    glowLayer.intensity = 0.5;
    this.lights = this.setUpLighting();
    this.setUpSun(this.lights.point);
  }

  setUpLighting() {
    const hemi = new HemisphericLight("hemi-light", new Vector3(0, 1, 0), this.scene);
    hemi.specular = Color3.FromHexString(GROUND_COLOR);
    hemi.intensity = 0.85;
    const lightPosition = new Vector3(4.0, 20.0, 8.0);
    const point = new PointLight("point-light", lightPosition, this.scene);
    point.intensity = 0.2;
    return { hemi, point };
  }

  setUpSun(pointLight: PointLight) {
    const ball = MeshBuilder.CreateSphere("ball", { diameter: 0.25 }, this.scene);
    const sunMaterial = new StandardMaterial("sun material", this.scene);
    sunMaterial.emissiveColor = new Color3(1, 1, 1);
    ball.material = sunMaterial;
    ball.position = pointLight.position;
  }
}
