import { GameWorld } from ".";

export function handleGameWorldViewError(this: GameWorld, error: Error) {
  console.error(error);
  this.engine.stopRenderLoop();
}
