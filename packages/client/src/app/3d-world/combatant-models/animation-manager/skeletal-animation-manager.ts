import { AnimationGroup } from "@babylonjs/core";
import { AnimationManager, ManagedAnimation, ManagedAnimationOptions } from ".";
import { ModularCharacter } from "../modular-character";
import {
  DEBUG_ANIMATION_SPEED_MULTIPLIER,
  SKELETAL_ANIMATION_NAME_STRINGS,
  SkeletalAnimationName,
} from "@speed-dungeon/common";

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

    length *= DEBUG_ANIMATION_SPEED_MULTIPLIER;

    return length;
  }

  setWeight(newWeight: number) {
    this.weight = newWeight;
    this.animationGroup.setWeightForAllAnimatables(newWeight);
  }

  isCompleted() {
    if (this.options.shouldLoop) return false;
    const timeSinceStarted = Date.now() - this.timeStarted;
    const animationLength = this.getLength();
    return timeSinceStarted >= animationLength;
  }

  cleanup() {
    this.animationGroup.stop();
    this.animationGroup.dispose(); // else causes memory leaks
  }
}

export class SkeletalAnimationManager implements AnimationManager<AnimationGroup> {
  playing: null | ManagedSkeletalAnimation = null;
  previous: null | ManagedSkeletalAnimation = null;
  locked: boolean = false;
  constructor(public characterModel: ModularCharacter) {
    // stop default animation
    this.characterModel.skeleton.animationGroups[0]?.setWeightForAllAnimatables(0);
    this.characterModel.skeleton.animationGroups[0]?.stop();
  }

  cloneAnimation(animationGroup: AnimationGroup): AnimationGroup {
    return animationGroup.clone(animationGroup.name, undefined, true);
  }

  startAnimationWithTransition(
    newAnimationName: SkeletalAnimationName,
    transitionDuration: number,
    options: ManagedAnimationOptions
  ): Error | void {
    this.previous?.cleanup();
    this.previous = this.playing;

    const clonedAnimation = this.getClonedAnimation(newAnimationName);
    this.playing = new ManagedSkeletalAnimation(clonedAnimation, transitionDuration, options);

    const animationStockDuration = clonedAnimation.getLength() * 1000;
    let speedModifier =
      animationStockDuration / (options.animationDurationOverrideOption || animationStockDuration);

    speedModifier *= DEBUG_ANIMATION_SPEED_MULTIPLIER;

    clonedAnimation.start(options.shouldLoop, speedModifier);
  }

  stepAnimationTransitionWeights(): Error | void {
    // if (!this.playing) console.log("no animation played this frame");
    if (!this.playing) return;

    const elapsed = this.playing.elapsed();
    if (elapsed >= this.playing.getLength()) {
      this.playing.setWeight(1);
      this.previous?.setWeight(0);
      // otherwise it is possible that a short animation would finish
      // before the weight transition, leaving a mismatch in weights for one frame
      // when a subsequent animation is added and the previous animation is still there
      this.previous?.cleanup();
      this.previous = null;
      return;
    }

    let percentTransitionCompleted = elapsed / this.playing.transitionDuration;
    percentTransitionCompleted = Math.min(1, percentTransitionCompleted);

    this.playing.setWeight(percentTransitionCompleted);
    this.previous?.setWeight(1 - percentTransitionCompleted);
  }

  handleCompletedAnimations() {
    if (this.previous?.weight === 0) {
      this.previous.cleanup();
      this.previous = null;
    }

    if (this.playing && this.playing.isCompleted() && !this.playing.onCompleteRan) {
      if (this.playing.options.onComplete && !this.playing.options.shouldLoop) {
        this.playing.options.onComplete();
        this.playing.onCompleteRan = true;
      }
    }
  }

  getClonedAnimation(name: SkeletalAnimationName) {
    let newAnimationGroup = this.getAnimationGroupByName(name);
    // alternatives to some missing animations
    if (newAnimationGroup === undefined) {
      const fallbackName = this.getFallbackAnimationName(name);
      if (fallbackName !== undefined)
        newAnimationGroup = this.getAnimationGroupByName(fallbackName);

      if (newAnimationGroup === undefined)
        throw new Error(`no animation found ${SKELETAL_ANIMATION_NAME_STRINGS[name]}`);
    }

    return this.cloneAnimation(newAnimationGroup);
  }

  getAnimationGroupByName(animationName: SkeletalAnimationName) {
    const asString = SKELETAL_ANIMATION_NAME_STRINGS[animationName];
    const { skeleton } = this.characterModel;
    for (let index = 0; index < skeleton.animationGroups.length; index++) {
      if (!skeleton.animationGroups[index]) continue;
      if (skeleton.animationGroups[index]!.name === asString) {
        return skeleton.animationGroups[index];
      }
    }
  }

  getFallbackAnimationName(animationName: SkeletalAnimationName) {
    // if (animationName === AnimationName.MeleeOffHand) return AnimationName.MeleeMainHand;
    if (animationName === SkeletalAnimationName.MoveBack)
      return SkeletalAnimationName.MoveForwardLoop;
    const idleAnimationNames = [
      SkeletalAnimationName.IdleUnarmed,
      SkeletalAnimationName.IdleBow,
      SkeletalAnimationName.IdleTwoHand,
      SkeletalAnimationName.IdleDualWield,
      SkeletalAnimationName.IdleMainHand,
    ];
    if (idleAnimationNames.includes(animationName)) return SkeletalAnimationName.IdleUnarmed;
  }
}
