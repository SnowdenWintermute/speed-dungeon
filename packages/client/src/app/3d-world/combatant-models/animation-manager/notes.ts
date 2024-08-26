// let weight = 0;
// let animationIndex = 0;
// let lastAnimationStartedAt = Date.now();
// const PERCENT_TO_START_TRANSITION = 0.1;

// this.engine.runRenderLoop(() => {
//   const character1 = this.characters["1"];
//   if (character1) {

//     weight += 0.01;
//     weight = Math.min(weight, 1);
//     const timeSinceStarted = Date.now() - lastAnimationStartedAt;
//     const isDone =
//       timeSinceStarted >
//       character1.skeleton.animationGroups[animationIndex].getLength() *
//         1000;

//     character1.skeleton.animationGroups[
//       animationIndex
//     ].setWeightForAllAnimatables(weight);
//     if (isDone) {
//       const oldIndex = animationIndex;
//       character1.skeleton.animationGroups[oldIndex].stop();
//       character1.skeleton.animationGroups[
//         oldIndex
//       ].setWeightForAllAnimatables(0);

//       weight = 0;
//       animationIndex += 1;
//       if (animationIndex >= character1.skeleton.animationGroups.length)
//         animationIndex = 0;

//       character1.skeleton.animationGroups[animationIndex].start(false);
//       character1.skeleton.animationGroups[
//         animationIndex
//       ].setWeightForAllAnimatables(0);

//       lastAnimationStartedAt = Date.now();
//     }
//   }
//   this.scene.render();
// });
// }
