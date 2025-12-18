import { GameWorldView } from ".";

export function handleGameWorldViewError(this: GameWorldView, error: Error) {
  console.error(error);
  this.engine.stopRenderLoop();
}
