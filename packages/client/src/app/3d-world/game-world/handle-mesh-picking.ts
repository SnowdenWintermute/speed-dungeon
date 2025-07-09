// this.scene.onPointerDown = () => {
//   var ray = this.scene.createPickingRay(
//     this.scene.pointerX,
//     this.scene.pointerY,
//     Matrix.Identity(),
//     this.camera
//   );

//   var hit = this.scene.pickWithRay(ray);
//   if (hit?.pickedMesh) {
//     mutateNextBabylonMessagingStore((state) => {
//       state.messages.push(hit?.pickedMesh?.name || "");
//     });
//   }
// };
