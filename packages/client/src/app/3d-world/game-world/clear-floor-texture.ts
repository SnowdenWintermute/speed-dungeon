import { FFIX_COLORS } from "@speed-dungeon/common";
import { GameWorld } from ".";
import { GROUND_TEXTURE_HEIGHT, GROUND_TEXTURE_WIDTH } from "./init-scene";

export function clearFloorTexture(this: GameWorld) {
  const context = this.groundTexture.getContext();

  context.beginPath();
  context.fillStyle = "#344b35";
  context.fillRect(0, 0, GROUND_TEXTURE_WIDTH, GROUND_TEXTURE_HEIGHT);

  drawCompass(this);

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
  context.fillText("W", west.x, west.y);

  context.beginPath();
  context.moveTo(north.x, north.y);
  context.lineTo(centerX, centerY);
  context.strokeStyle = FFIX_COLORS.windgreen;
  context.stroke();
  context.fillText("N", north.x, north.y);

  context.beginPath();
  context.moveTo(south.x, south.y);
  context.lineTo(centerX, centerY);
  context.strokeStyle = FFIX_COLORS.waterblue;
  context.stroke();
  context.fillText("S", south.x, south.y);

  context.beginPath();
  context.moveTo(east.x, east.y);
  context.lineTo(centerX, centerY);
  context.strokeStyle = FFIX_COLORS.earthyellow;
  context.stroke();
  context.fillText("E", east.x, east.y);

  context.moveTo(centerX, centerY);
  context.beginPath();
  context.arc(centerX, centerY, 10, 0, Math.PI * 2);
  context.fillStyle = "#000";
  context.fill();
}
