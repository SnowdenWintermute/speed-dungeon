import { GameWorld } from "..";
import { actionCommandQueue } from "@/singletons/action-command-manager";
import {
  ACTION_COMMAND_TYPE_STRINGS,
  GAME_UPDATE_COMMAND_TYPE_STRINGS,
} from "@speed-dungeon/common";
import { gameWorld } from "../../SceneManager";

export function updateDebugText(this: GameWorld) {
  if (this.debug.debugRef?.current) {
    const branches = this.replayTreeManager.getCurrent()?.getActiveBranches();
    let mapped = "";
    if (branches) {
      mapped = branches
        .map((branch) => {
          const currUpdateOption = branch.getCurrentGameUpdate();
          if (currUpdateOption)
            return GAME_UPDATE_COMMAND_TYPE_STRINGS[currUpdateOption.command.type];
          else return "no update";
        })
        .join(", ");
    }

    const processingUpdateBranches = `<div>${mapped}</div>`;

    const fps = `<div>${this.engine.getFps().toFixed()}</div>`;

    const rootTransformPositions = Object.values(this.modelManager.combatantModels)
      .map(
        (model) =>
          `<li>${model.entityId.slice(0, 3)}: x:${model.rootTransformNode.position.x}, z: ${model.rootTransformNode.position.z}</li>`
      )
      .join("");

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
    if (actionCommandQueue.commands[0])
      actionCommandQueueMessages.push(
        ACTION_COMMAND_TYPE_STRINGS[actionCommandQueue.commands[0].payload.type]
      );
    actionCommandQueueMessages.push(
      ...actionCommandQueue.commands.map((item) => ACTION_COMMAND_TYPE_STRINGS[item.payload.type])
    );

    const modelManagerMessages = [];
    if (gameWorld.current) {
      modelManagerMessages.push(
        ...gameWorld.current.modelManager.modelActionQueue.messages.map((item) => item.type)
      );
    }

    this.debug.debugRef.current.innerHTML = [
      `branches: ${processingUpdateBranches}`,
      `fps: ${fps}`,
      `action command queue: ${actionCommandQueueMessages}`,
      `isProcessing: ${actionCommandQueue.isProcessing}`,
      `modelManagerMessages: ${modelManagerMessages}`,
      `isProcessing: ${this.modelManager.modelActionQueue.isProcessing}`,
      // `combatants processing actions: ${actionCommandQueue.entitiesPerformingActions}`,
      `<ul>${rootTransformPositions}</ul>`,
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
