import { GameWorld } from ".";

export default function handleGameWorldError(this: GameWorld, error: Error) {
  console.error(error);
  this.engine.stopRenderLoop();
}
