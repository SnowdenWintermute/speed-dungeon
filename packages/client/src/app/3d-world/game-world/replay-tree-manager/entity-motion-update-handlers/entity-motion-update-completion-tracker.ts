import {
  ActionEntityMotionGameUpdateCommand,
  AnimationTimingType,
  CombatantMotionGameUpdateCommand,
  EntityAnimation,
  Milliseconds,
} from "@speed-dungeon/common";

export class EntityMotionUpdateCompletionTracker {
  private translationIsComplete: boolean = false;
  private animationIsComplete: boolean = false;
  private delayIsComplete: boolean = false;
  private delay: Milliseconds = 0;

  constructor(
    animationOption: undefined | EntityAnimation,
    hasTranslation: boolean,
    delayOption: Milliseconds,
    gameUpdate: {
      command: CombatantMotionGameUpdateCommand | ActionEntityMotionGameUpdateCommand;
      isComplete: boolean;
    }
  ) {
    if (!animationOption) this.animationIsComplete = true;
    else if (animationOption.timing.type === AnimationTimingType.Looping)
      this.animationIsComplete = true;

    if (!hasTranslation) this.translationIsComplete = true;

    if (!delayOption) this.delayIsComplete = true;
    else this.delay = delayOption;

    if (!this.delayIsComplete) {
      setTimeout(() => {
        this.setDelayComplete();

        if (this.isComplete()) {
          gameUpdate.isComplete = true;
        }
      }, this.delay);
    }
  }

  isComplete() {
    return this.translationIsComplete && this.animationIsComplete && this.delayIsComplete;
  }

  setTranslationComplete() {
    this.translationIsComplete = true;
  }
  setAnimationComplete() {
    this.animationIsComplete = true;
  }
  setDelayComplete() {
    this.delayIsComplete = true;
  }
}
