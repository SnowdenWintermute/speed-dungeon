import { Engine, Scene } from "@babylonjs/core";
import { ReplayTreeScheduler } from "./replay-tree-scheduler";
import { ActionResolutionStepType, CombatActionName } from "@speed-dungeon/common";

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

  tickToNextNonZeroDurationStep(replayTreeScheduler: ReplayTreeScheduler) {
    this.tick(replayTreeScheduler.getMinRemainingDuration());
    while (replayTreeScheduler.current && replayTreeScheduler.getMinRemainingDuration() === 0) {
      this.tick(replayTreeScheduler.getMinRemainingDuration());
    }
  }

  tickToNext(replayTreeScheduler: ReplayTreeScheduler) {
    this.tick(replayTreeScheduler.getMinRemainingDuration());
  }

  tickToExpectedStep(
    replayTreeScheduler: ReplayTreeScheduler,
    action: CombatActionName,
    stepType: ActionResolutionStepType
  ) {
    if (!replayTreeScheduler.current) {
      return;
    }
    while (replayTreeScheduler.current) {
      const nextExpectedStep = replayTreeScheduler.current.nextExpectedStep;
      if (!nextExpectedStep) {
        break;
      }

      const { step, actionName } = nextExpectedStep.command;
      const isMatch = step === stepType && actionName === action;

      if (isMatch) {
        break;
      }
      this.tick(replayTreeScheduler.getMinRemainingDuration());
    }
  }
}
