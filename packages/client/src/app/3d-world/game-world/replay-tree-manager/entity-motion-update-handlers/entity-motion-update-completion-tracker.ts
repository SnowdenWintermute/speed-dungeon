import { AnimationTimingType, EntityAnimation } from "@speed-dungeon/common";

export class EntityMotionUpdateCompletionTracker {
  private translationIsComplete: boolean = false;
  private animationIsComplete: boolean = false;

  constructor(animationOption: undefined | EntityAnimation, hasTranslation: boolean) {
    if (!animationOption) this.animationIsComplete = true;
    else if (animationOption.timing.type === AnimationTimingType.Looping)
      this.animationIsComplete = true;

    if (!hasTranslation) this.translationIsComplete = true;
  }

  isComplete() {
    return this.translationIsComplete && this.animationIsComplete;
  }

  setTranslationComplete() {
    this.translationIsComplete = true;
  }
  setAnimationComplete() {
    this.animationIsComplete = true;
  }
}
