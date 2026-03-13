import { DynamicTexture, GroundMesh, MeshBuilder, Scene, StandardMaterial } from "@babylonjs/core";
import {
  GROUND_COLOR,
  GROUND_HEIGHT,
  GROUND_TEXTURE_HEIGHT,
  GROUND_TEXTURE_WIDTH,
  GROUND_WIDTH,
} from "../game-world-view-consts";
import { GameWorldViewDebug } from "./debug";
import { DEFAULT_ACCOUNT_CHARACTER_CAPACITY } from "@speed-dungeon/common";

export class GameWorldGroundPlane {
  private debugView: GameWorldViewDebug;
  private groundMesh: GroundMesh;
  private groundTexture: DynamicTexture;
  constructor(scene: Scene) {
    this.groundMesh = MeshBuilder.CreateGround(
      "ground mesh",
      { width: GROUND_WIDTH, height: GROUND_HEIGHT, subdivisions: 25 },
      scene
    );
    this.groundTexture = new DynamicTexture("dynamic texture", GROUND_TEXTURE_WIDTH, scene);
    const materialGround = new StandardMaterial("ground material", scene);
    materialGround.diffuseTexture = this.groundTexture;
    this.groundMesh.material = materialGround;

    this.debugView = new GameWorldViewDebug(this.groundMesh, this.groundTexture);
  }

  dispose() {
    this.groundMesh.dispose();
  }

  clear() {
    const context = this.groundTexture.getContext();
    context.beginPath();
    context.fillStyle = GROUND_COLOR;
    context.fillRect(0, 0, GROUND_TEXTURE_WIDTH, GROUND_TEXTURE_HEIGHT);
    this.groundTexture.update();
  }

  drawDebug() {
    this.debugView.draw();
  }

  drawCharacterSlots() {
    const context = this.groundTexture.getContext();
    context.beginPath();
    context.fillStyle = "#344b35";
    context.fillRect(0, 0, GROUND_TEXTURE_WIDTH, GROUND_TEXTURE_HEIGHT);

    for (let i = 0; i < DEFAULT_ACCOUNT_CHARACTER_CAPACITY; i += 1) {
      const spacingInResolutionUnits = GROUND_TEXTURE_WIDTH / GROUND_WIDTH;
      const centerX =
        -spacingInResolutionUnits + GROUND_TEXTURE_WIDTH / 2 + spacingInResolutionUnits * i;
      const centerY = GROUND_TEXTURE_WIDTH / 2;
      const radius = 45;

      context.beginPath();

      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.strokeStyle = "grey";
      context.lineWidth = 7;
      context.stroke();
    }

    this.groundTexture.update();
  }
}
