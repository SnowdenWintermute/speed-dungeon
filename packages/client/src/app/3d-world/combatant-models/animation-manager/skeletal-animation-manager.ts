import { AnimationGroup } from "@babylonjs/core";
import { AnimationManager, ManagedAnimation, ManagedAnimationOptions } from ".";
import { ModularCharacter } from "../modular-character";
import { SKELETAL_ANIMATION_NAME_STRINGS, SkeletalAnimationName } from "@speed-dungeon/common";

export class ManagedSkeletalAnimation extends ManagedAnimation<AnimationGroup> {
  protected timeStarted: number = Date.now();
  weight: number = 0;
  constructor(
    protected animationGroup: AnimationGroup,
    public readonly transitionDuration: number,
    protected options: ManagedAnimationOptions
  ) {
    super(animationGroup, transitionDuration, options);
  }

  getName() {
    return this.animationGroup.name;
  }

  getLength() {
    if (this.options.animationDurationOverrideOption !== undefined)
      return this.options.animationDurationOverrideOption;
    return this.animationGroup.getLength() * 1000;
  }

  setWeight(newWeight: number) {
    this.weight = newWeight;
    this.animationGroup.setWeightForAllAnimatables(newWeight);
  }

  isCompleted() {
    if (this.options.shouldLoop) return false;
    const timeSinceStarted = Date.now() - this.timeStarted;
    return timeSinceStarted >= this.animationGroup.getLength() * 1000;
  }

  cleanup() {
    if (this.options.onComplete) {
      console.log("onComplete running in cleanup for", this.getName());
      this.options.onComplete();
    }
    this.animationGroup.stop();
    this.animationGroup.dispose(); // else causes memory leaks
  }
}

export class SkeletalAnimationManager implements AnimationManager<AnimationGroup> {
  playing: null | ManagedSkeletalAnimation = null;
  previous: null | ManagedSkeletalAnimation = null;
  locked: boolean = false;
  constructor(public characterModel: ModularCharacter) {
    this.characterModel.skeleton.animationGroups[0]?.stop(); // stop default animation
  }

  cloneAnimation(animationGroup: AnimationGroup): AnimationGroup {
    return animationGroup.clone(animationGroup.name, undefined, true);
  }

  startAnimationWithTransition(
    newAnimationName: SkeletalAnimationName,
    transitionDuration: number,
    options: ManagedAnimationOptions
  ): Error | void {
    console.log(
      this.characterModel.entityId.slice(0, 4),
      "starting animation",
      SKELETAL_ANIMATION_NAME_STRINGS[newAnimationName],
      "curr: ",
      this.playing?.getName(),
      "prev: ",
      this.previous?.getName(),
      this.previous?.weight
    );

    this.previous?.cleanup();
    this.previous = this.playing;

    const clonedAnimation = this.getClonedAnimation(newAnimationName);
    options.animationDurationOverrideOption = undefined;
    this.playing = new ManagedSkeletalAnimation(clonedAnimation, transitionDuration, options);

    clonedAnimation.start(options.shouldLoop);

    // if (options.animationDurationOverrideOption) {
    //   const animationStockDuration = clonedAnimation.getLength() * 1000;
    //   const speedModifier = animationStockDuration / (options.animationDurationOverrideOption ?? 1);

    //   // clonedAnimationOption.start(options.shouldLoop, speedModifier);
    //   clonedAnimation.start(options.shouldLoop, 1);
    // } else clonedAnimation.start(options.shouldLoop);
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
    }

    let percentTransitionCompleted = elapsed / this.playing.transitionDuration;
    percentTransitionCompleted = Math.min(1, percentTransitionCompleted);

    this.playing.setWeight(percentTransitionCompleted);
    this.previous?.setWeight(1 - percentTransitionCompleted);
  }

  handleCompletedAnimations() {
    if (this.previous?.weight === 0) {
      // console.log("removing previous", this.previous.getName());
      this.previous.cleanup();
      this.previous = null;
    }

    if (this.playing && this.playing.isCompleted()) {
      // console.log("removing current", this.playing.getName());
      this.playing.cleanup();
      this.playing = null;
    }
  }

  getClonedAnimation(name: SkeletalAnimationName) {
    let newAnimationGroup = this.getAnimationGroupByName(name);
    // alternatives to some missing animations
    if (newAnimationGroup === undefined) {
      const fallbackName = this.getFallbackAnimationName(name);
      console.log("getting fallback animation", fallbackName);
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
