import { Engine, Scene } from "@babylonjs/core";

export type TickScheduler = (tick: (deltaMs: number) => void) => () => void; // returns unsubscribe

export function createBabylonScheduler(engine: Engine, scene: Scene): TickScheduler {
  return (tick) => {
    const callTickWithEngineDeltaTime = () => {
      tick(engine.getDeltaTime());
    };
    scene.registerBeforeRender(callTickWithEngineDeltaTime);
    return () => scene.unregisterBeforeRender(callTickWithEngineDeltaTime);
  };
}

export class ManualTickScheduler {
  private tickFn: ((deltaMs: number) => void) | null = null;

  readonly scheduler: TickScheduler = (tick) => {
    this.tickFn = tick;
    return () => {
      this.tickFn = null;
    };
  };

  tick(deltaMs: number) {
    this.tickFn?.(deltaMs);
  }
}
