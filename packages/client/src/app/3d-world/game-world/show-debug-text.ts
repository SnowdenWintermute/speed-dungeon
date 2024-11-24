import { useGameStore } from "@/stores/game-store";
import { GameWorld } from ".";
import {
  actionCommandManager,
  actionCommandWaitingArea,
} from "@/singletons/action-command-manager";
import { formatActionCommandType } from "@speed-dungeon/common";

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
    const modelManagerMessages = `<div>
    ${Object.values(this.modelManager.modelMessageQueues)[0]?.messages.length}
    </div>`;
    // const actionResultsProcessing = useGameStore.getState().;
    this.debug.debugRef.current.innerHTML = [
      `fps: ${fps}`,
      `models awaiting spawn:${useGameStore.getState().combatantModelsAwaitingSpawn.join(", ")}`,
      `waiting area: ${actionCommandWaitingArea.map((item) => formatActionCommandType(item.payload.type))}`,
      `queue: ${actionCommandManager.queue.map((item) => formatActionCommandType(item.payload.type))}`,
      `current: ${actionCommandManager.currentlyProcessing ? formatActionCommandType(actionCommandManager.currentlyProcessing.payload.type) : null}`,
      // modelManagerMessages,
      cameraAlpha,
      cameraBeta,
      cameraRadius,
      cameraTarget,
    ]
      .map((text) => `<li>${text}</li>`)
      .join("");
  }
}
