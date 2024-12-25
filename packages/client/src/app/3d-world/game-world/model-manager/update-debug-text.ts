import { useGameStore } from "@/stores/game-store";
import { GameWorld } from "..";
import { actionCommandManager } from "@/singletons/action-command-manager";
import { ACTION_COMMAND_TYPE_STRINGS } from "@speed-dungeon/common";
import { gameWorld } from "../../SceneManager";

export default function updateDebugText(this: GameWorld) {
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
    const numMaterials = `<div>num materials: ${this.scene.materials.length}</div>`;

    const actionCommandQueueMessages = [];
    if (actionCommandManager.currentlyProcessing)
      actionCommandQueueMessages.push(
        ACTION_COMMAND_TYPE_STRINGS[actionCommandManager.currentlyProcessing.payload.type]
      );
    actionCommandQueueMessages.push(
      ...actionCommandManager.queue.map((item) => ACTION_COMMAND_TYPE_STRINGS[item.payload.type])
    );

    const modelManagerMessages = [];
    if (gameWorld.current) {
      modelManagerMessages.push(
        ...gameWorld.current.modelManager.modelActionQueue.messages.map((item) => item.type)
      );
    }

    this.debug.debugRef.current.innerHTML = [
      `fps: ${fps}`,
      `models awaiting spawn:${useGameStore.getState().combatantModelsAwaitingSpawn}`,
      `queue: ${actionCommandManager.queue.map((item) => ACTION_COMMAND_TYPE_STRINGS[item.payload.type])}`,
      `current: ${actionCommandManager.currentlyProcessing ? ACTION_COMMAND_TYPE_STRINGS[actionCommandManager.currentlyProcessing.payload.type] : null}`,
      `actionCommandQueueMessages: ${actionCommandQueueMessages}`,
      `modelManagerMessages: ${modelManagerMessages}`,
      `combatants processing actions: ${actionCommandManager.entitiesPerformingActions}`,
      numMaterials,
      cameraAlpha,
      cameraBeta,
      cameraRadius,
      cameraTarget,
    ]
      .map((text) => `<li>${text}</li>`)
      .join("");
  }
}
