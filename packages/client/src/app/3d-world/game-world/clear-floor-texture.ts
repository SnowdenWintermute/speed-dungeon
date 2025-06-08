import { FFIX_COLORS } from "@speed-dungeon/common";
import { GameWorld } from ".";
import { GROUND_TEXTURE_HEIGHT, GROUND_TEXTURE_WIDTH } from "./init-scene";

export const GROUND_COLOR = "#344b35";
export function clearFloorTexture(this: GameWorld) {
  const context = this.groundTexture.getContext();

  context.beginPath();
  context.fillStyle = GROUND_COLOR;
  context.fillRect(0, 0, GROUND_TEXTURE_WIDTH, GROUND_TEXTURE_HEIGHT);

  this.groundTexture.update();
}

export function drawCompass(gameWorld: GameWorld) {
  const context = gameWorld.groundTexture.getContext();
  context.lineWidth = 10;

  const length = 500;
  const centerX = GROUND_TEXTURE_WIDTH / 2;
  const centerY = GROUND_TEXTURE_HEIGHT / 2;

  context.beginPath();
  context.arc(centerX, centerY, 100, 0, Math.PI * 2);
  context.strokeStyle = "#FFF";
  context.stroke();

  const west = { x: centerX - length, y: centerY };
  const north = { x: centerX, y: centerY - length };
  const south = { x: centerX, y: centerY + length };
  const east = { x: centerX + length, y: centerY };

  context.font = "50px sans-serif";
  context.fillStyle = "#FFF";

  context.strokeStyle = FFIX_COLORS.firered;
  context.beginPath();
  context.moveTo(west.x, west.y);
  context.lineTo(centerX, centerY);
  context.stroke();
  context.fillText("W (-X)", west.x, west.y);

  context.beginPath();
  context.moveTo(north.x, north.y);
  context.lineTo(centerX, centerY);
  context.strokeStyle = FFIX_COLORS.windgreen;
  context.stroke();
  context.fillText("N (-Y)", north.x, north.y);

  context.beginPath();
  context.moveTo(south.x, south.y);
  context.lineTo(centerX, centerY);
  context.strokeStyle = FFIX_COLORS.waterblue;
  context.stroke();
  context.fillText("S (+Y)", south.x, south.y);

  context.beginPath();
  context.moveTo(east.x, east.y);
  context.lineTo(centerX, centerY);
  context.strokeStyle = FFIX_COLORS.earthyellow;
  context.stroke();
  context.fillText("E (+X)", east.x, east.y);

  context.moveTo(centerX, centerY);
  context.beginPath();
  context.arc(centerX, centerY, 10, 0, Math.PI * 2);
  context.fillStyle = "#000";
  context.fill();

  gameWorld.groundTexture.update();
}

export function drawDebugGrid(gameWorld: GameWorld) {
  const context = gameWorld.groundTexture.getContext();
  context.lineWidth = 3;

  const textureSize = gameWorld.groundTexture.getSize();

  const boundingBox = gameWorld.ground.getBoundingInfo().boundingBox;
  const groundWidth = boundingBox.maximum.x - boundingBox.minimum.x;
  const groundHeight = boundingBox.maximum.z - boundingBox.minimum.z;
  const pixelsPerUnit = textureSize.width / groundWidth;

  const columnWidth = pixelsPerUnit;
  const columnCount = textureSize.width / columnWidth;

  const rowHeight = pixelsPerUnit;
  const rowCount = textureSize.height / rowHeight;

  console.log(textureSize, columnCount);
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

  gameWorld.groundTexture.update();
}
