import { Engine, Scene } from "@babylonjs/core";

export type TickScheduler = (tick: (deltaTime: number) => void) => () => void; // returns unsubscribe

export function createBabylonScheduler(engine: Engine, scene: Scene): TickScheduler {
  return (tick) => {
    const callTickWithEngineDeltaTime = () => tick(engine.getDeltaTime());
    scene.registerBeforeRender(callTickWithEngineDeltaTime);
    return () => scene.unregisterBeforeRender(callTickWithEngineDeltaTime);
  };
}

export class ManualTickScheduler {
  private tick: ((deltaTime: number) => void) | null = null;

  readonly scheduler: TickScheduler = (tick) => {
    this.tick = tick;
    return () => {
      this.tick = null;
    };
  };

  advance(deltaTime: number) {
    this.tick?.(deltaTime);
  }
}
