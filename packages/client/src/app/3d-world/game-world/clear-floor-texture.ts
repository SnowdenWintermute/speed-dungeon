import { GameWorld } from ".";
import { GROUND_TEXTURE_HEIGHT, GROUND_TEXTURE_WIDTH } from "./init-scene";

export function clearFloorTexture(this: GameWorld) {
  const context = this.groundTexture.getContext();

  context.beginPath();
  context.fillStyle = "#344b35";
  context.fillRect(0, 0, GROUND_TEXTURE_WIDTH, GROUND_TEXTURE_HEIGHT);
  this.groundTexture.update();
}
