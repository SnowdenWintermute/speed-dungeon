import { Engine, Scene } from "@babylonjs/core";

export type TickScheduler = (tick: () => void) => () => void; // returns unsubscribe

export function createBabylonScheduler(engine: Engine, scene: Scene): TickScheduler {
  return (tick) => {
    const callTickWithEngineDeltaTime = () => {
      tick();
    };
    scene.registerBeforeRender(callTickWithEngineDeltaTime);
    return () => scene.unregisterBeforeRender(callTickWithEngineDeltaTime);
  };
}

export class ManualTickScheduler {
  private tickFn: ((deltaTime: number) => void) | null = null;

  readonly scheduler: TickScheduler = (tick) => {
    this.tickFn = tick;
    return () => {
      this.tickFn = null;
    };
  };

  tick() {
    this.tickFn?.(0);
  }
}
