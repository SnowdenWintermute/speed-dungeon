import { DynamicTexture, GroundMesh } from "@babylonjs/core";
import { DebugCompassDrawer } from "./compass";

export class GameWorldViewDebug {
  private compassDrawer: DebugCompassDrawer;
  constructor(
    private groundMesh: GroundMesh,
    private groundTexture: DynamicTexture
  ) {
    this.compassDrawer = new DebugCompassDrawer(groundTexture);
  }

  draw() {
    this.drawGrid();
    this.compassDrawer.draw();
  }

  private drawGrid() {
    const context = this.groundTexture.getContext();
    context.lineWidth = 3;

    const textureSize = this.groundTexture.getSize();

    const boundingBox = this.groundMesh.getBoundingInfo().boundingBox;
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

    this.groundTexture.update();
  }
}
