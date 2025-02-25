import { AnimationGroup, AnimationEvent } from "@babylonjs/core";
import { ModularCharacter } from "../modular-character";
import {
  ANIMATION_NAME_STRINGS,
  AnimationName,
  MISSING_ANIMATION_DEFAULT_ACTION_FALLBACK_TIME,
} from "@speed-dungeon/common";
import { setDebugMessage } from "@/stores/game-store/babylon-controlled-combatant-data";

export type ManagedAnimationOptions = {
  shouldLoop: boolean;
  animationEventOption: null | { fn: () => void; frame: number };
  animationDurationOverrideOption: null | number;
  onComplete: () => void;
};

export class ManagedAnimation {
  timeStarted: number = Date.now();
  weight: number = 0;
  animationEventOption: null | AnimationEvent = null;
  eventCompleted: boolean = false;
  constructor(
    public animationGroupOption: null | AnimationGroup,
    public transitionDuration: number = 0,
    public options: ManagedAnimationOptions
  ) {
    const { animationEventOption } = options;
    const animation = this.animationGroupOption?.targetedAnimations[0]?.animation;
    if (animation && animationEventOption) {
      const animationEvent = new AnimationEvent(animationEventOption.frame, () => {
        animationEventOption.fn();
        this.eventCompleted = true;
      });
      animationEvent.onlyOnce = true;
      animation.addEvent(animationEvent);
    }
  }

  setWeight(newWeight: number) {
    this.weight = newWeight;
    this.animationGroupOption?.setWeightForAllAnimatables(newWeight);
  }

  isCompleted() {
    if (this.options.shouldLoop) return false;
    const timeSinceStarted = Date.now() - this.timeStarted;
    if (this.animationGroupOption) {
      return timeSinceStarted >= Math.floor(this.animationGroupOption.getLength() * 1000);
    } else {
      return timeSinceStarted >= MISSING_ANIMATION_DEFAULT_ACTION_FALLBACK_TIME;
    }
  }
}

export class AnimationManager {
  playing: null | ManagedAnimation = null;
  previous: null | ManagedAnimation = null;
  locked: boolean = false;
  constructor(public characterModel: ModularCharacter) {
    // stop default animation
    this.characterModel.skeleton.animationGroups[0]?.stop();
  }

  cloneAnimationOption(animationGroupOption: undefined | AnimationGroup): null | AnimationGroup {
    return animationGroupOption?.clone(animationGroupOption.name, undefined, true) ?? null;
  }

  startAnimationWithTransition(
    newAnimationName: AnimationName,
    transitionDuration: number,
    options: ManagedAnimationOptions = {
      shouldLoop: true,
      animationEventOption: null,
      animationDurationOverrideOption: null,
      onComplete: () => {},
    }
  ): Error | void {
    let newAnimationGroupOption = this.getAnimationGroupByName(newAnimationName);
    // alternatives to some missing animations
    if (newAnimationGroupOption === undefined) {
      const fallbackName = this.getFallbackAnimationName(newAnimationName);
      newAnimationGroupOption = this.getAnimationGroupByName(fallbackName || AnimationName.Idle);
    }

    const clonedAnimationOption = this.cloneAnimationOption(newAnimationGroupOption);

    if (clonedAnimationOption === null) {
      // send message to client with timout duration to remove itself
      setDebugMessage(
        this.characterModel.entityId,
        `Missing animation: ${newAnimationName}`,
        MISSING_ANIMATION_DEFAULT_ACTION_FALLBACK_TIME
      );
    }

    if (this.playing !== null) {
      if (this.previous !== null) this.cleanUpFinishedAnimation(this.previous);
      this.previous = this.playing;
      this.playing = null;
    }

    this.playing = new ManagedAnimation(clonedAnimationOption, transitionDuration, options);

    if (clonedAnimationOption) {
      if (options.animationDurationOverrideOption) {
        const animationStockDuration = clonedAnimationOption.getLength() * 1000;
        const speedModifier =
          animationStockDuration / (options.animationDurationOverrideOption ?? 1);

        clonedAnimationOption.start(options.shouldLoop, speedModifier);
      } else clonedAnimationOption.start(options.shouldLoop);
    }
  }

  stepAnimationTransitionWeights(): Error | void {
    // if (!this.playing) console.log("no animation played this frame");
    if (!this.playing || this.playing.weight >= 1) return;

    const timeSinceStarted = Date.now() - this.playing.timeStarted;
    let percentTransitionCompleted = timeSinceStarted / this.playing.transitionDuration;
    percentTransitionCompleted = Math.min(1, percentTransitionCompleted);

    this.playing.setWeight(percentTransitionCompleted);
    if (this.previous) this.previous.setWeight(1 - this.playing.weight);
  }

  cleanUpFinishedAnimation(managedAnimation: ManagedAnimation) {
    const { animationEventOption, onComplete } = managedAnimation.options;

    managedAnimation.animationGroupOption?.stop();

    if (animationEventOption && !managedAnimation.eventCompleted) {
      animationEventOption.fn();
    }

    onComplete();

    if (managedAnimation.animationGroupOption)
      // else causes memory leaks
      managedAnimation.animationGroupOption?.dispose();
  }

  handleCompletedAnimations() {
    if (this.previous?.weight === 0) {
      this.cleanUpFinishedAnimation(this.previous);
      this.previous = null;
    }

    if (this.playing && this.playing.isCompleted()) {
      this.cleanUpFinishedAnimation(this.playing);
      this.playing = null;
    }

    if (this.playing === null && this.previous === null && !this.locked) {
      console.log("no playing or previous animation");
      // console.log("tried to start idle");
      this.characterModel.startIdleAnimation(500); // circular ref
    }
  }

  getAnimationGroupByName(animationName: AnimationName) {
    const asString = ANIMATION_NAME_STRINGS[animationName];
    const { skeleton } = this.characterModel;
    for (let index = 0; index < skeleton.animationGroups.length; index++) {
      if (!skeleton.animationGroups[index]) continue;
      if (skeleton.animationGroups[index]!.name === asString) {
        return skeleton.animationGroups[index];
      }
    }
  }

  isRepeatingAnimation() {
    // switch (actionType) {
    //   case CombatantModelActionType.ApproachDestination:
    //     return true;
    //   default:
    //     return false;
    // }
  }

  getFallbackAnimationName(animationName: AnimationName) {
    // if (animationName === AnimationName.MeleeOffHand) return AnimationName.MeleeMainHand;
    if (animationName === AnimationName.MoveBack) return AnimationName.MoveForward;
    if (animationName === AnimationName.Idle) return AnimationName.MoveForward;
  }

  static setAnimationEndCallback(animationGroup: AnimationGroup, callback: () => void) {
    animationGroup.onAnimationEndObservable.add(callback, undefined, true, undefined, true);
  }
}
