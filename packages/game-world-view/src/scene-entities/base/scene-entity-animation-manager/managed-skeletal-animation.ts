import { AnimationGroup } from "@babylonjs/core";
import { ManagedAnimation, ManagedAnimationOptions } from ".";
import { DEBUG_ANIMATION_SPEED_MULTIPLIER } from "@speed-dungeon/common";

export class ManagedSkeletalAnimation extends ManagedAnimation<AnimationGroup> {
  protected timeStarted: number = Date.now();
  weight: number = 0;
  constructor(
    protected animationGroup: AnimationGroup,
    public readonly transitionDuration: number,
    options: ManagedAnimationOptions
  ) {
    super(animationGroup, transitionDuration, options);
  }

  getName() {
    return this.animationGroup.name;
  }

  getLength() {
    let length = this.animationGroup.getLength() * 1000;
    if (this.options.animationDurationOverrideOption !== undefined)
      length = this.options.animationDurationOverrideOption;

    return length * DEBUG_ANIMATION_SPEED_MULTIPLIER;
  }

  setWeight(newWeight: number) {
    this.weight = newWeight;
    this.animationGroup.setWeightForAllAnimatables(newWeight);
  }

  setToLastFrame() {
    const lastFrame = this.animationGroup.to;
    this.animationGroup.goToFrame(lastFrame);
  }

  isCompleted() {
    if (this.onCompleteRan) {
      return true;
    }

    if (this.options.shouldLoop) {
      return false;
    }

    const timeSinceStarted = Date.now() - this.timeStarted;
    const animationLength = this.getLength();
    return timeSinceStarted >= animationLength;
  }

  runOnComplete() {
    if (this.onCompleteRan) {
      return;
    }
    this.options.onComplete?.();
    this.onCompleteRan = true;
  }

  cleanup() {
    this.animationGroup.stop();
    this.animationGroup.dispose(); // else causes memory leaks

    // if we don't run the oncomplete for animations that are interrupted
    // it will never unlock the input since we're often relying on those animations'
    // onComplete functions to know when to unlock input
    // this.runOnComplete();
  }
}
