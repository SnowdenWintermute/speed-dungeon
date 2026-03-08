import { Scene } from "@babylonjs/core";

export type TickScheduler = (tick: () => void) => () => void; // returns unsubscribe

export function createBabylonScheduler(scene: Scene): TickScheduler {
  return (tick) => {
    scene.registerBeforeRender(tick);
    return () => scene.unregisterBeforeRender(tick);
  };
}

export class ManualScheduler {
  private tick: (() => void) | null = null;

  readonly scheduler: TickScheduler = (tick) => {
    this.tick = tick;
    return () => {
      this.tick = null;
    };
  };

  advance() {
    this.tick?.();
  }
}
