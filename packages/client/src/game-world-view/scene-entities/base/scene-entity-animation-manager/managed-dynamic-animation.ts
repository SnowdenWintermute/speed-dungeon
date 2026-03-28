import { MISSING_ANIMATION_DEFAULT_ACTION_FALLBACK_TIME } from "@speed-dungeon/common";
import { ManagedAnimation, ManagedAnimationOptions } from ".";
import { DynamicAnimation } from "./dynamic-animation";

export class ManagedDynamicAnimation extends ManagedAnimation<DynamicAnimation> {
  timeStarted: number = Date.now();
  weight: number = 0;
  constructor(
    public animationGroup: DynamicAnimation,
    public transitionDuration: number = 0,
    public options: ManagedAnimationOptions
  ) {
    super(animationGroup, transitionDuration, options);
  }

  setWeight(newWeight: number) {
    //
  }

  isCompleted() {
    if (this.options.shouldLoop) return false;
    const timeSinceStarted = Date.now() - this.timeStarted;

    if (!this.animationGroup) {
      return timeSinceStarted >= MISSING_ANIMATION_DEFAULT_ACTION_FALLBACK_TIME;
    }

    return timeSinceStarted >= Math.floor(this.animationGroup.getLength());
  }
}
