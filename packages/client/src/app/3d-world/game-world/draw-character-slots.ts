import { GameWorld } from ".";
import { drawCompass } from "./clear-floor-texture";
import { GROUND_TEXTURE_HEIGHT, GROUND_TEXTURE_WIDTH, GROUND_WIDTH } from "./init-scene";

export default function drawCharacterSlots(this: GameWorld) {
  const context = this.groundTexture.getContext();
  context.beginPath();
  context.fillStyle = "#344b35";
  context.fillRect(0, 0, GROUND_TEXTURE_WIDTH, GROUND_TEXTURE_HEIGHT);

  for (let i = 0; i < 3; i += 1) {
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

  drawCompass(this);

  this.groundTexture.update();
}
