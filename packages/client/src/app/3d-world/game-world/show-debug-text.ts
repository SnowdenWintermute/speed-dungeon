import { GameWorld } from ".";

export default function showDebugText(this: GameWorld) {
  if (this.debug.debugRef?.current) {
    const fps = `<div>${this.engine.getFps().toFixed()}</div>`;

    if (!this.camera) return;
    const cameraAlpha = `<div>camera alpha: ${this.camera.alpha.toFixed(2)}</div>`;
    const cameraBeta = `<div>camera beta: ${this.camera.beta.toFixed(2)}</div>`;
    const cameraRadius = `<div>camera radius: ${this.camera.radius.toFixed(2)}</div>`;
    const cameraTarget = `<div>camera target:
          x ${this.camera.target.x.toFixed(2)}, 
          y ${this.camera.target.y.toFixed(2)}, 
          z ${this.camera.target.z.toFixed(2)}</div>`;
    this.debug.debugRef.current.innerHTML = [
      fps,
      cameraAlpha,
      cameraBeta,
      cameraRadius,
      cameraTarget,
    ].join("");
  }
}
