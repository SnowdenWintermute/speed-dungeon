import { GameUpdateCommand, NestedNodeReplayEvent, ReplayEventType } from "@speed-dungeon/common";
import { ReplayTreeExecution } from "./tree-execution";
import { ReplayGameUpdateTracker } from "./replay-game-update-completion-tracker";
import { GAME_UPDATE_HANDLERS } from "./update-handlers";

export class ReplayBranchExecution {
  private currentIndex = -1;
  private isComplete = false;
  private currentGameUpdateOption: null | ReplayGameUpdateTracker<GameUpdateCommand> = null;

  constructor(
    private parentReplayTreeProcessor: ReplayTreeExecution,
    private node: NestedNodeReplayEvent,
    private branchProcessors: ReplayBranchExecution[]
  ) {}

  getCurrentGameUpdate() {
    return this.currentGameUpdateOption;
  }

  currentStepIsComplete(): boolean {
    if (this.currentGameUpdateOption === null) return true;
    else return this.currentGameUpdateOption.getIsComplete();
  }

  isDoneProcessing() {
    return this.isComplete;
  }

  startProcessingNext() {
    this.currentIndex += 1;
    const node = this.node.events[this.currentIndex];

    if (node === undefined) {
      this.isComplete = true;
      return;
    }

    if (node.type === ReplayEventType.NestedNode) {
      const newBranch = new ReplayBranchExecution(
        this.parentReplayTreeProcessor,
        node,
        this.branchProcessors
      );
      newBranch.startProcessingNext();
      this.branchProcessors.push(newBranch);
      return;
    }

    this.currentGameUpdateOption = new ReplayGameUpdateTracker(node.gameUpdate);

    // Any update may include cosmetic effect updates
    const cosmeticEffectsToStartOption =
      this.currentGameUpdateOption.command.cosmeticEffectsToStart;
    const cosmeticEffectsToStopOption = this.currentGameUpdateOption.command.cosmeticEffectsToStop;

    try {
      const sceneEntityServiceOption =
        this.parentReplayTreeProcessor.clientApplication.gameWorldView?.sceneEntityService;
      sceneEntityServiceOption?.queueCosmeticEffectStart(cosmeticEffectsToStartOption || []);
      sceneEntityServiceOption?.stopCosmeticEffects(cosmeticEffectsToStopOption || []);
    } catch (err) {
      console.error("error with cosmetic effects", this.currentGameUpdateOption.command, err);
    }

    GAME_UPDATE_HANDLERS[node.gameUpdate.type](
      this.parentReplayTreeProcessor.clientApplication,
      this.currentGameUpdateOption
    );
  }
}
