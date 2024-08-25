import { AnimationGroup, ISceneLoaderAsyncResult } from "babylonjs";
import { CombatantModelActionType } from "./model-actions";

export class AnimationManager {
  playing: null | ManagedAnimation = null;
  transition: {
    transitioningFrom: ManagedAnimation;
    transitioningTo: ManagedAnimation;
    timeStarted: number;
    durationMs: number;
  } | null = null;
  constructor(public skeleton: ISceneLoaderAsyncResult) {
    // stop default animation
    this.skeleton.animationGroups[0]?.stop();

    // const idleAnimation = this.getAnimationGroupByName("idle");
    // if (idleAnimation) this.setAnimationPlaying("idle", idleAnimation, { shouldLoop: true });
  }

  stop() {
    this.playing?.animationGroup.stop();
    this.transition?.transitioningTo?.animationGroup.stop();
    this.transition?.transitioningFrom?.animationGroup.stop();
    this.transition = null;
    this.playing = null;
  }

  setAnimationPlaying(
    animationGroup: AnimationGroup,
    options: { shouldLoop: boolean }
  ): Error | void {
    // stop current transitioning animations if any
    if (this.transition) {
      this.transition.transitioningTo.animationGroup.stop();
      this.transition.transitioningFrom.animationGroup.stop();
      this.transition = null;
    }
    animationGroup.play(options.shouldLoop);

    this.playing = { animationGroup, weight: 1.0 };
  }

  startAnimationWithTransition(
    transitionTo: AnimationGroup,
    durationMs: number,
    options: { shouldLoop: boolean; shouldRestartIfAlreadyPlaying: boolean } = {
      shouldLoop: true,
      shouldRestartIfAlreadyPlaying: false,
    }
  ): Error | void {
    let transitionFrom: null | ManagedAnimation = null;
    let timeStarted: number = Date.now();

    const alreadyPlayingAnimationWithSameName =
      (this.playing && this.playing.animationGroup.name === transitionTo.name) ||
      this.transition?.transitioningTo?.animationGroup.name === transitionTo.name;

    // console.log("transition to: ", transitionTo);

    if (alreadyPlayingAnimationWithSameName && !options.shouldRestartIfAlreadyPlaying)
      return console.log("already playing animation ", transitionTo.name);
    else if (
      alreadyPlayingAnimationWithSameName &&
      this.transition?.transitioningTo.animationGroup.name === transitionTo.name &&
      options.shouldRestartIfAlreadyPlaying
    ) {
      console.log("trying to restart animation currently transitioning to: ", name);
      this.transition.transitioningFrom.animationGroup.setWeightForAllAnimatables(0);
      this.playing = this.transition.transitioningTo;
      this.transition = null;
      this.playing.animationGroup.setWeightForAllAnimatables(1);
      this.playing.animationGroup.reset();
      return;
    } else if (alreadyPlayingAnimationWithSameName && options.shouldRestartIfAlreadyPlaying) {
      console.log(
        "trying to restart animation currently playing: ",
        this.playing?.animationGroup.name
      );
      this.playing?.animationGroup.reset();
      this.playing?.animationGroup.setWeightForAllAnimatables(1);
      return;
    }

    if (this.playing !== null) {
      transitionFrom = this.playing;
    } else if (this.transition?.transitioningTo) {
      // console.log("transitioning from partially transitioned animation");
      transitionFrom = this.transition.transitioningTo;
      // if there is already an ongoing transition we want to preserve its time started
      // so as not to restart its weights at 0
      timeStarted = this.transition.timeStarted;
    }

    if (transitionFrom === null) {
      if (transitionTo.name === "melee-attack") console.log("transition from was null");
      return this.setAnimationPlaying(transitionTo, {
        shouldLoop: options.shouldLoop,
      });
    }

    this.transition = {
      durationMs,
      timeStarted,
      transitioningFrom: transitionFrom,
      transitioningTo: { animationGroup: transitionTo, weight: 0.0 },
    };
    this.playing = null;

    if (transitionTo.name === "melee-attack")
      console.log(
        "playing: ",
        this.playing,
        "melee attack transition from ",
        this.transition.transitioningFrom.animationGroup.name,
        " to ",
        this.transition.transitioningTo.animationGroup.name
      );

    transitionTo.reset();
    transitionTo.start(options.shouldLoop);
    transitionTo.setWeightForAllAnimatables(0.0);
  }

  stepAnimationTransitionWeights(): Error | void {
    if (this.transition === null) return;
    if (
      this.transition.transitioningTo.animationGroup.name ===
      this.transition.transitioningFrom.animationGroup.name
    )
      return;

    const timeSinceTransitionStarted = Date.now() - this.transition.timeStarted;
    // actually it is a number between 0 and 1 so not exactly a "percent"
    // but it works for setting the weights because they take such a value
    let percentOfTransitionCompleted = timeSinceTransitionStarted / this.transition.durationMs;
    if (percentOfTransitionCompleted > 1) percentOfTransitionCompleted = 1;
    this.transition.transitioningTo.animationGroup.setWeightForAllAnimatables(
      percentOfTransitionCompleted
    );
    this.transition.transitioningFrom.animationGroup.setWeightForAllAnimatables(
      1 - percentOfTransitionCompleted
    );

    if (percentOfTransitionCompleted === 1) {
      percentOfTransitionCompleted = 1;
      this.playing = this.transition.transitioningTo;
      this.transition.transitioningFrom.animationGroup.stop();
      this.transition = null;
    }
  }

  getAnimationGroupByName(name: string) {
    for (let index = 0; index < this.skeleton.animationGroups.length; index++) {
      if (!this.skeleton.animationGroups[index]) continue;
      if (this.skeleton.animationGroups[index]!.name === name) {
        return this.skeleton.animationGroups[index];
      }
    }
  }

  isRepeatingAnimation(actionType: CombatantModelActionType) {
    switch (actionType) {
      case CombatantModelActionType.ApproachDestination:
      case CombatantModelActionType.ReturnHome:
      case CombatantModelActionType.Idle:
      case CombatantModelActionType.EndTurn:
        return true;
      default:
        return false;
    }
  }

  getFallbackAnimationName(animationName: string) {
    if (animationName === "melee-attack-offhand")
      return this.getAnimationGroupByName("melee-attack");
    if (animationName === "move-back") return this.getAnimationGroupByName("move-forward");
  }

  static setAnimationEndCallback(animationGroup: AnimationGroup, callback: () => void) {
    animationGroup.onAnimationEndObservable.add(callback, undefined, true, undefined, true);
  }
}

export type ManagedAnimation = {
  animationGroup: AnimationGroup;
  weight: number;
};
