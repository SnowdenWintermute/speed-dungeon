import { DynamicTexture, GroundMesh } from "@babylonjs/core";
import { GameWorldGroundPlane } from "./ground-plane";

export class EnvironmentView {
  groundPlane: GameWorldGroundPlane;
  constructor(groundMesh: GroundMesh, groundTexture: DynamicTexture) {
    this.groundPlane = new GameWorldGroundPlane(groundMesh, groundTexture);
  }
}
