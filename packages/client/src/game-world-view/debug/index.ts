import { ClientApplication } from "@/client-application";
import { GameWorldView } from "..";
import { ReplayBranchExecution } from "@/client-application/replay-execution/branch-execution";
import {
  ACTION_RESOLUTION_STEP_TYPE_STRINGS,
  CLIENT_EVENT_TYPE_STRINGS,
  COMBAT_ACTION_NAME_STRINGS,
  GAME_UPDATE_COMMAND_TYPE_STRINGS,
  GameUpdateCommandType,
} from "@speed-dungeon/common";
import { DialogElementName } from "@/client-application/ui/dialogs";

export class GameWorldViewDebug {
  public uiDebugDisplayRef: React.RefObject<HTMLUListElement | null> | null = null;
  constructor(
    private clientApplication: ClientApplication,
    private gameWorldView: GameWorldView
  ) {}

  show() {
    this.gameWorldView.environment.groundPlane.drawGrid();
    this.gameWorldView.environment.groundPlane.compassDrawer.draw();

    const { combatantSceneEntityManager } = this.gameWorldView.sceneEntityService;

    for (const modularCharacter of combatantSceneEntityManager.getAll()) {
      modularCharacter.debugView.setUpDebugMeshes();
      modularCharacter.rootMesh.showBoundingBox = true;
      modularCharacter.highlightManager.turnIndicator?.showDebug();

      modularCharacter.debugView.despawnDebugMeshes();
      modularCharacter.rootMesh.showBoundingBox = false;
      modularCharacter.highlightManager.turnIndicator?.hideDebug();
    }
  }

  hide() {
    const { combatantSceneEntityManager } = this.gameWorldView.sceneEntityService;

    for (const modularCharacter of combatantSceneEntityManager.getAll()) {
      modularCharacter.debugView.despawnDebugMeshes();
      modularCharacter.rootMesh.showBoundingBox = false;
      modularCharacter.highlightManager.turnIndicator?.hideDebug();
    }
  }

  updateDebugText() {
    const debugIsHidden = !this.clientApplication.uiStore.dialogs.isOpen(DialogElementName.Debug);

    if (debugIsHidden || !this.uiDebugDisplayRef?.current) return;

    this.updateCombatantSceneEntityPositionDebug();

    const replayScheduler = this.clientApplication.replayTreeScheduler;
    const branches = replayScheduler.getCurrent()?.getActiveBranches();
    const fps = `${this.gameWorldView.engine.getFps().toFixed()}`;

    this.uiDebugDisplayRef.current.innerHTML = [
      `movementTrackers: ${this.getActiveMovementTrackersText()}`,
      `branches: ${this.getReplayBranchesText(branches)}`,
      `fps: ${fps}`,
      `sequentialEventProcessor queue: ${this.getSequentialEventQueueStrings()}`,
      `isProcessing: ${this.clientApplication.sequentialEventProcessor.isProcessing}`,
      `${this.getCombatantSceneEntityPositions()}`,
      ...this.getGameWorldResources(),
      ...this.getCameraDetails(),
    ]
      .map((text) => `<li>${text}</li>`)
      .join("");
  }

  private getCombatantSceneEntityPositions() {
    const { sceneEntityService } = this.gameWorldView;
    const { sceneEntities } = sceneEntityService.combatantSceneEntityManager;
    const result = [];
    for (const [_, e] of sceneEntities) {
      result.push(
        `<li>${e.entityId.slice(0, 3)}: x:${e.rootTransformNode.position.x}, z: ${e.rootTransformNode.position.z}</li>`
      );
    }
    return `<ul>${result.join()}</ul>`;
  }

  private getGameWorldResources() {
    const { scene } = this.gameWorldView;
    const materialsCount = `materials: ${scene.materials.length}`;
    const transformNodesCount = `transform nodes: ${scene.transformNodes.length}`;
    const particleSystemsCount = `particleSystems: ${scene.particleSystems.length}`;
    return [materialsCount, transformNodesCount, particleSystemsCount];
  }

  private getSequentialEventQueueStrings() {
    const { sequentialEventProcessor } = this.clientApplication;
    const eventStrings = [];
    const { currentEventProcessing, pendingEvents } = sequentialEventProcessor;
    if (currentEventProcessing) {
      eventStrings.push(CLIENT_EVENT_TYPE_STRINGS[currentEventProcessing.type]);
    }
    for (const event of pendingEvents) {
      eventStrings.push(CLIENT_EVENT_TYPE_STRINGS[event.type]);
    }

    return eventStrings;
  }

  private getCameraDetails() {
    const { camera } = this.gameWorldView;
    if (!camera) return "";
    const alpha = `camera alpha: ${camera.alpha.toFixed(2)}`;
    const beta = `camera beta: ${camera.beta.toFixed(2)}`;
    const radius = `camera radius: ${camera.radius.toFixed(2)}`;
    const target = `camera target:
          x ${camera.target.x.toFixed(2)}, 
          y ${camera.target.y.toFixed(2)}, 
          z ${camera.target.z.toFixed(2)}`;
    return [alpha, beta, radius, target];
  }

  private getReplayBranchesText(branches: ReplayBranchExecution[] | undefined) {
    if (!branches) return "";

    return branches
      .map((branch) => {
        const currUpdateOption = branch.getCurrentGameUpdate();
        if (currUpdateOption?.command.type === GameUpdateCommandType.CombatantMotion) {
          const updateType = GAME_UPDATE_COMMAND_TYPE_STRINGS[currUpdateOption.command.type];
          const actionName = COMBAT_ACTION_NAME_STRINGS[currUpdateOption.command.actionName];
          const stepType = [ACTION_RESOLUTION_STEP_TYPE_STRINGS[currUpdateOption.command.step]];
          return `${updateType} - ${actionName} - ${stepType}`;
        }
        if (currUpdateOption) {
          return GAME_UPDATE_COMMAND_TYPE_STRINGS[currUpdateOption.command.type];
        } else {
          return "no update";
        }
      })
      .join(", ");
  }

  private getActiveMovementTrackersText() {
    let activeMovementTrackers = "";
    const { combatantSceneEntityManager } = this.gameWorldView.sceneEntityService;
    for (const [_, model] of combatantSceneEntityManager.sceneEntities) {
      const { movementManager } = model;
      for (const [type, activeTracker] of movementManager.getTrackers()) {
        activeMovementTrackers += model.entityId + " " + activeTracker.percentComplete().toFixed(2);
      }
    }
    return activeMovementTrackers;
  }

  private updateCombatantSceneEntityPositionDebug() {
    const { combatantSceneEntityManager } = this.gameWorldView.sceneEntityService;
    for (const [_, model] of combatantSceneEntityManager.sceneEntities) {
      const { position } = model.rootTransformNode;
      if (model.debugElement && position) {
        model.debugElement.innerHTML = `x:${position.x?.toFixed(2)} z${position.z?.toFixed(2)}`;
      }
    }
  }

  startLimitedFramerateRenderLoop(fps: number, timeout: number) {
    window.setTimeout(() => {
      this.gameWorldView.engine.stopRenderLoop();
      let lastTime = new Date().getTime();
      // const fpsLabel = document.getElementsByClassName("fps")[0];
      window.setInterval(() => {
        const currTime = new Date().getTime();
        const deltaTime = currTime - lastTime;
        this.gameWorldView.updateGameWorld(deltaTime);
        this.gameWorldView.scene.render();
        // fpsLabel.innerHTML = (1000 / (curTime - lastTime)).toFixed() + " fps";
        lastTime = currTime;
      }, 1000 / fps);
    }, timeout);
  }

  getGpuName() {
    const babylonGl = this.gameWorldView.engine._gl;
    if (!babylonGl) return "Unknown GPU";
    // Use the standard WebGL parameter instead of the deprecated extension
    const renderer = babylonGl.getParameter(babylonGl.RENDERER);
    return renderer || "Unknown GPU";
  }
}
