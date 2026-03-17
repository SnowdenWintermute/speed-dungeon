import { DynamicTexture, GroundMesh, MeshBuilder, Scene, StandardMaterial } from "@babylonjs/core";
import {
  GROUND_COLOR,
  GROUND_HEIGHT,
  GROUND_TEXTURE_HEIGHT,
  GROUND_TEXTURE_WIDTH,
  GROUND_WIDTH,
} from "../game-world-view-consts";
import { DEFAULT_ACCOUNT_CHARACTER_CAPACITY } from "@speed-dungeon/common";
import { DebugCompassDrawer } from "./debug/compass";

export class GameWorldGroundPlane {
  readonly groundMesh: GroundMesh;
  readonly groundTexture: DynamicTexture;
  readonly compassDrawer: DebugCompassDrawer;

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
    this.compassDrawer = new DebugCompassDrawer(this.groundTexture);
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

  drawGrid() {
    const { groundTexture, groundMesh } = this;
    const context = groundTexture.getContext();
    context.lineWidth = 3;

    const textureSize = groundTexture.getSize();

    const boundingBox = groundMesh.getBoundingInfo().boundingBox;
    const groundWidth = boundingBox.maximum.x - boundingBox.minimum.x;
    const groundHeight = boundingBox.maximum.z - boundingBox.minimum.z;
    const pixelsPerUnit = textureSize.width / groundWidth;

    const columnWidth = pixelsPerUnit;
    const columnCount = textureSize.width / columnWidth;

    const rowHeight = pixelsPerUnit;
    const rowCount = textureSize.height / rowHeight;

    context.strokeStyle = `rgba(100,100,100,.5)`;

    for (let column = 0; column < columnCount; column += 1) {
      const columnPosition = column * columnWidth;
      context.beginPath();
      context.moveTo(columnPosition, 0);
      context.lineTo(columnPosition, textureSize.height);
      context.stroke();
    }

    for (let row = 0; row < rowCount; row += 1) {
      const rowPosition = row * rowHeight;
      context.beginPath();
      context.moveTo(0, rowPosition);
      context.lineTo(textureSize.width, rowPosition);
      context.stroke();
    }

    groundTexture.update();
  }
}
