import { AnimationGroup, ISceneLoaderAsyncResult } from "babylonjs";

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

  setAnimationPlaying(
    name: string,
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

    this.playing = { name, animationGroup, weight: 1.0 };
  }

  startAnimationWithTransition(
    name: string,
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
      (this.playing && this.playing.name === name) ||
      this.transition?.transitioningTo?.name === name;

    // console.log("trying to start animation: ", name);

    if (alreadyPlayingAnimationWithSameName && !options.shouldRestartIfAlreadyPlaying)
      return console.log("already playing animation ", name);
    else if (
      alreadyPlayingAnimationWithSameName &&
      this.transition?.transitioningTo.name === name &&
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
      console.log("trying to restart animation currently playing: ", name);
      this.playing?.animationGroup.reset();
      this.playing?.animationGroup.setWeightForAllAnimatables(1);
      return;
    }

    if (this.playing !== null) transitionFrom = this.playing;
    else if (this.transition?.transitioningTo) {
      transitionFrom = this.transition.transitioningTo;
      // if there is already an ongoing transition we want to preserve its time started
      // so as not to restart its weights at 0
      timeStarted = this.transition.timeStarted;
    }

    if (transitionFrom === null)
      return this.setAnimationPlaying(name, transitionTo, { shouldLoop: options.shouldLoop });

    this.transition = {
      durationMs,
      timeStarted,
      transitioningFrom: transitionFrom,
      transitioningTo: { name, animationGroup: transitionTo, weight: 0.0 },
    };
    this.playing = null;

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
}

export type ManagedAnimation = {
  name: string;
  animationGroup: AnimationGroup;
  weight: number;
};
